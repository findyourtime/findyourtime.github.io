/**
 * Disque de force en WebGL — l'unique élément 3D du site, dans le hero.
 *
 * Pourquoi pas Three.js : la bibliothèque pèse environ 400 Ko gzip une
 * fois three.module et three.core comptés, et il faudrait l'héberger ici
 * plutôt que sur un CDN, puisque la politique de cookies du site affirme
 * qu'aucune requête ne sort du domaine. Pour un seul objet décoratif sur
 * une page dont le TBT est à 0 ms, le rapport est mauvais. Ce fichier
 * fait le même travail en quelques kilo-octets.
 *
 * L'objet est une surface de révolution : on décrit le profil du disque
 * en coupe (rayon, hauteur), on le fait tourner autour de l'axe Y, et
 * chaque segment du profil porte sa couleur. D'où le trou central
 * traversant et la tranche visible, qu'un empilement de cercles en CSS
 * ne sait pas rendre de trois quarts.
 *
 * Trois conditions d'arrêt : pas de WebGL, prefers-reduced-motion, ou
 * disque hors de l'écran. Dans les deux premiers cas on rend une image
 * fixe ; dans le troisième on suspend la boucle.
 */
(function () {
  'use strict';

  var canvas = document.getElementById('disque-canvas');
  if (!canvas) return;

  var conteneur = canvas.parentElement;

  // --- Palette : strictement les couleurs du site, en linéaire ----------
  // Aucune teinte nouvelle. Le relief vient de l'éclairage, pas d'une
  // couleur supplémentaire.
  function srgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [
      Math.pow(((n >> 16) & 255) / 255, 2.2),
      Math.pow(((n >> 8) & 255) / 255, 2.2),
      Math.pow((n & 255) / 255, 2.2)
    ];
  }
  var ROUGE = srgb('#C41E3A');  // --rouge
  var SOMBRE = srgb('#15161A'); // --encre
  var ACIER = srgb('#565960');  // --gris-fer

  // --- Profil du disque en coupe ---------------------------------------
  // Proportions d'un disque olympique : trou de 50 mm sur 450 mm de
  // diamètre. Le trou est ouvert un peu au-delà pour qu'on voie le fond à
  // travers quel que soit l'angle, et la tranche fait environ 16 %.
  var R = 1.0, T = 0.155, B = 0.055, TROU = 0.145;
  var profil = [
    // [rayon, hauteur, couleur du segment qui part de ce point]
    [TROU, -T, ACIER],   // face arrière : anneau d'acier autour du trou
    [0.18, -T, SOMBRE],  // face arrière : plage sombre
    [0.63, -T, ROUGE],   // face arrière : bordure rouge
    [R - B, -T, ROUGE],  // chanfrein arrière
    [R, -T + B, ROUGE],  // tranche
    [R, T - B, ROUGE],   // chanfrein avant
    [R - B, T, ROUGE],   // face avant : bordure rouge
    [0.63, T, SOMBRE],   // face avant : plage sombre
    [0.18, T, ACIER],    // face avant : anneau d'acier
    [TROU, T, SOMBRE]    // paroi du trou : sombre, sinon de trois quarts
                         // on la prend pour un bouchon plutôt qu'un trou
  ];

  var SEGMENTS = 72;
  var positions = [], normales = [], couleurs = [];

  function sommet(rayon, y, angle, n2, coul) {
    var c = Math.cos(angle), s = Math.sin(angle);
    positions.push(rayon * c, y, rayon * s);
    // La normale 2D du segment, ramenée sur le tour : la composante
    // radiale suit l'angle, la composante verticale ne bouge pas.
    normales.push(n2[0] * c, n2[1], n2[0] * s);
    couleurs.push(coul[0], coul[1], coul[2]);
  }

  for (var i = 0; i < profil.length; i++) {
    var a = profil[i], b = profil[(i + 1) % profil.length];
    var dr = b[0] - a[0], dy = b[1] - a[1];
    var len = Math.hypot(dr, dy) || 1;
    // Normale sortante du segment : (dy, -dr) normalisé.
    var n2 = [dy / len, -dr / len];
    var coul = a[2];

    for (var j = 0; j < SEGMENTS; j++) {
      var t0 = (j / SEGMENTS) * Math.PI * 2;
      var t1 = ((j + 1) / SEGMENTS) * Math.PI * 2;
      sommet(a[0], a[1], t0, n2, coul);
      sommet(b[0], b[1], t0, n2, coul);
      sommet(b[0], b[1], t1, n2, coul);
      sommet(a[0], a[1], t0, n2, coul);
      sommet(b[0], b[1], t1, n2, coul);
      sommet(a[0], a[1], t1, n2, coul);
    }
  }
  var NB_SOMMETS = positions.length / 3;

  // --- Contexte --------------------------------------------------------
  var gl = null;
  try {
    gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false }) ||
         canvas.getContext('experimental-webgl', { antialias: true, alpha: true });
  } catch (e) { gl = null; }
  if (!gl) return; // le repli SVG reste affiché

  var VS = [
    'attribute vec3 aPos; attribute vec3 aNor; attribute vec3 aCol;',
    'uniform mat4 uProj; uniform mat4 uVue; uniform mat4 uModele; uniform mat3 uNor;',
    'varying vec3 vNor; varying vec3 vCol; varying vec3 vPos;',
    'void main(){',
    '  vec4 p = uModele * vec4(aPos, 1.0);',
    '  vPos = p.xyz; vNor = uNor * aNor; vCol = aCol;',
    '  gl_Position = uProj * uVue * p;',
    '}'
  ].join('\n');

  var FS = [
    'precision mediump float;',
    'varying vec3 vNor; varying vec3 vCol; varying vec3 vPos;',
    'void main(){',
    '  vec3 N = normalize(vNor);',
    '  vec3 V = normalize(vec3(0.0, 0.0, 4.2) - vPos);',
    // Objet fermé rendu sans culling : on retourne la normale des faces
    // vues de dos plutôt que de les laisser s'assombrir.
    '  if (dot(N, V) < 0.0) N = -N;',
    '  vec3 L = normalize(vec3(-0.45, 0.78, 0.65));',
    '  float diff = max(dot(N, L), 0.0);',
    // Deuxième source, très faible, côté opposé : sans elle la tranche
    // disparaît complètement une demi-rotation sur deux.
    '  float appoint = max(dot(N, normalize(vec3(0.6, -0.3, -0.5))), 0.0) * 0.16;',
    '  vec3 H = normalize(L + V);',
    '  float spec = pow(max(dot(N, H), 0.0), 28.0) * 0.30;',
    '  vec3 c = vCol * (0.30 + 0.85 * diff + appoint) + spec;',
    '  c = pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));', // retour en sRGB
    '  gl_FragColor = vec4(c, 1.0);',
    '}'
  ].join('\n');

  function compiler(type, source) {
    var s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    return s;
  }
  var vs = compiler(gl.VERTEX_SHADER, VS), fs = compiler(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  function tampon(donnees, nom, taille) {
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(donnees), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, nom);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, taille, gl.FLOAT, false, 0, 0);
  }
  tampon(positions, 'aPos', 3);
  tampon(normales, 'aNor', 3);
  tampon(couleurs, 'aCol', 3);

  var uProj = gl.getUniformLocation(prog, 'uProj');
  var uVue = gl.getUniformLocation(prog, 'uVue');
  var uModele = gl.getUniformLocation(prog, 'uModele');
  var uNor = gl.getUniformLocation(prog, 'uNor');

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);

  // --- Matrices : juste ce qu'il faut, écrit à la main -----------------
  function perspective(fov, aspect, pres, loin) {
    var f = 1 / Math.tan(fov / 2), d = pres - loin;
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (loin + pres) / d, -1, 0, 0, 2 * loin * pres / d, 0];
  }
  function recul(z) {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -z, 1];
  }
  function modele(rx, ry) {
    var cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
    // rotation X puis Y, en colonnes
    return [cy, 0, -sy, 0,
            sx * sy, cx, sx * cy, 0,
            cx * sy, -sx, cx * cy, 0,
            0, 0, 0, 1];
  }
  function normale3(m) {
    // Rotation pure : la sous-matrice 3x3 suffit pour les normales.
    return [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]];
  }

  // Le profil est révolutionné autour de Y : l'axe du disque est donc
  // vertical, et le disque est à plat. Tourner autour de Y ne produirait
  // aucun changement visible, l'objet étant symétrique autour de cet axe.
  // On le redresse d'un quart de tour pour que la rotation animée le fasse
  // passer de la face à la tranche, comme un disque qu'on retourne. Les
  // 0,22 rad restants l'inclinent pour qu'on voie aussi le dessus.
  var INCLINAISON = -Math.PI / 2 + 0.22;
  var ANGLE_FIXE = -0.68;  // trois quarts, position de repos

  function dimensionner() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var l = conteneur.clientWidth, h = conteneur.clientHeight;
    if (!l || !h) return false;
    var cl = Math.round(l * dpr), ch = Math.round(h * dpr);
    if (canvas.width !== cl || canvas.height !== ch) {
      canvas.width = cl; canvas.height = ch;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniformMatrix4fv(uProj, false, perspective(0.62, l / h, 0.1, 40));
    gl.uniformMatrix4fv(uVue, false, recul(4.2));
    return true;
  }

  function rendre(angle) {
    if (!dimensionner()) return;
    var m = modele(INCLINAISON, angle);
    gl.uniformMatrix4fv(uModele, false, m);
    gl.uniformMatrix3fv(uNor, false, normale3(m));
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, NB_SOMMETS);
  }

  // Le WebGL a pris la main : le repli statique n'a plus lieu d'être.
  conteneur.classList.add('webgl-actif');

  var reduit = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (reduit.matches) {
    rendre(ANGLE_FIXE);
    window.addEventListener('resize', function () { rendre(ANGLE_FIXE); }, { passive: true });
    return;
  }

  // --- Boucle, suspendue hors de l'écran -------------------------------
  var TOUR = 34000; // millisecondes pour un tour complet
  var debut = null, visible = true, idAnim = null;

  function trame(t) {
    if (debut === null) debut = t;
    rendre(((t - debut) / TOUR) * Math.PI * 2 + ANGLE_FIXE);
    idAnim = requestAnimationFrame(trame);
  }
  function demarrer() {
    if (idAnim === null) { debut = null; idAnim = requestAnimationFrame(trame); }
  }
  function arreter() {
    if (idAnim !== null) { cancelAnimationFrame(idAnim); idAnim = null; }
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entrees) {
      visible = entrees[0].isIntersecting;
      if (visible && !document.hidden) demarrer(); else arreter();
    }, { threshold: 0 }).observe(conteneur);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden || !visible) arreter(); else demarrer();
  });
  window.addEventListener('resize', dimensionner, { passive: true });

  demarrer();
})();

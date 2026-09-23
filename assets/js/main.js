(function(){
  // Menu mobile
  var btn = document.querySelector('.btn-menu');
  var menu = document.querySelector('.menu-mobile');
  if(btn && menu){
    btn.addEventListener('click', function(){
      var ouvert = menu.classList.toggle('ouvert');
      btn.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
      if(ouvert){ menu.querySelectorAll('a')[0] && menu.querySelectorAll('a')[0].focus(); }
    });
  }

  // En-tête réactif au scroll (fond flouté, légèrement rétréci)
  var entete = document.querySelector('header.site');
  if(entete){
    var ticking = false;
    var reduitMouvement = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function actualiserEntete(){
      var y = window.scrollY;
      entete.classList.toggle('scrolled', y > 24);
      // La grille de points du hero se décale un peu moins vite que la page.
      // Une variable CSS suffit : aucune écriture de style de mise en page.
      if(!reduitMouvement){
        document.documentElement.style.setProperty('--defilement', Math.min(y, 600));
      }
      ticking = false;
    }
    window.addEventListener('scroll', function(){
      if(!ticking){ requestAnimationFrame(actualiserEntete); ticking = true; }
    }, { passive:true });
    actualiserEntete();
  }

  // Révélation au scroll pour les blocs de contenu statiques.
  // FONTE_REVEAL.scan() peut être rappelé après une injection dynamique
  // (catalogue, fiche produit, comparateur) pour révéler le nouveau contenu.
  window.FONTE_REVEAL = (function(){
    var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var selecteur = '.categorie-lien, .principe, .carte-guide, .encart-guide, .bloc-avis';
    var observateur = reduit ? null : new IntersectionObserver(function(entrees){
      entrees.forEach(function(entree){
        if(entree.isIntersecting){
          entree.target.classList.add('in');
          observateur.unobserve(entree.target);
        }
      });
    }, { threshold:0.12, rootMargin:'0px 0px -40px 0px' });

    function scan(racine){
      (racine || document).querySelectorAll(selecteur).forEach(function(el){
        if(el.dataset.reveal) return;
        el.dataset.reveal = '1';
        if(reduit){ return; }
        el.classList.add('reveal');
        observateur.observe(el);
      });
    }
    return { scan:scan };
  })();
  window.FONTE_REVEAL.scan();

  // Année du footer
  var anneeEls = document.querySelectorAll('[data-annee]');
  anneeEls.forEach(function(el){ el.textContent = new Date().getFullYear(); });

  // Animation unique du hero (barres plateau), désactivée par défaut si
  // prefers-reduced-motion : la valeur finale est déjà posée en CSS (--w).
  var plateau = document.querySelector('.plateau-barres');
  if(plateau){
    var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduit){
      plateau.classList.add('joue');
    } else {
      requestAnimationFrame(function(){
        setTimeout(function(){ plateau.classList.add('joue'); }, 150);
      });
    }
  }

  // Bandeau cookies RGPD — n'apparaît que si un outil de mesure est activé
  // dans assets/js/config.js (ANALYTICS_ENABLED). Aucun outil n'est branché
  // pour le moment : le bandeau reste donc masqué et aucun cookie non
  // essentiel n'est déposé.
  var config = window.FONTE_CONFIG || {};
  if(config.ANALYTICS_ENABLED){
    var bandeau = document.querySelector('.bandeau-cookies');
    if(bandeau){
      var choix = localStorage.getItem('fonte_cookies_choix');
      if(!choix){ bandeau.classList.add('visible'); }
      bandeau.querySelectorAll('[data-cookie-choix]').forEach(function(b){
        b.addEventListener('click', function(){
          localStorage.setItem('fonte_cookies_choix', b.getAttribute('data-cookie-choix'));
          bandeau.classList.remove('visible');
        });
      });
    }
  }

  // Inclinaison 3D des cartes au pointeur. Le JS ne fait que publier la
  // position relative du curseur dans deux variables CSS (-1 a 1) ; toute
  // la transformation est decrite en CSS, donc desactivable par media query.
  // Ne s'active ni au toucher, ni sous prefers-reduced-motion.
  var souris = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var anime = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.FONTE_TILT = function(racine){
    if(!souris || !anime) return;
    (racine || document).querySelectorAll('.carte-produit').forEach(function(carte){
      if(carte.classList.contains('incline')) return;
      carte.classList.add('incline');
      var enAttente = false;
      carte.addEventListener('pointermove', function(ev){
        if(enAttente) return;
        enAttente = true;
        requestAnimationFrame(function(){
          var r = carte.getBoundingClientRect();
          carte.style.setProperty('--tx', ((ev.clientX - r.left) / r.width - 0.5) * 2);
          carte.style.setProperty('--ty', ((ev.clientY - r.top) / r.height - 0.5) * 2);
          enAttente = false;
        });
      });
      carte.addEventListener('pointerleave', function(){
        carte.style.setProperty('--tx', 0);
        carte.style.setProperty('--ty', 0);
      });
    });
  };
  window.FONTE_TILT();

  // Epaisseur echelonnee des lignes du panneau de statistiques du hero.
  document.querySelectorAll('.plateau-barres .barre-ligne').forEach(function(l, i){
    l.style.setProperty('--z', i + 1);
  });

  // Formulaires Netlify "mise en relation" : envoi en AJAX vers Netlify Forms,
  // confirmation inline sans rechargement. Fonctionne aussi sans JS (soumission
  // classique, redirection vers /merci.html) grâce à l'attribut action du formulaire.
  document.querySelectorAll('form[data-netlify="true"]').forEach(function(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var donnees = new URLSearchParams(new FormData(form)).toString();
      fetch('/', {
        method:'POST',
        headers:{ 'Content-Type':'application/x-www-form-urlencoded' },
        body:donnees
      }).then(function(){
        var confirmation = form.parentElement.querySelector('.confirmation-envoi');
        if(confirmation){ confirmation.style.display = 'block'; }
        form.reset();
      }).catch(function(){
        form.submit();
      });
    });
  });
})();

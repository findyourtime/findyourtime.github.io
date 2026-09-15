(function(){
  // Menu mobile
  var btn = document.querySelector('.btn-menu');
  var menu = document.querySelector('.menu-mobile');
  if(btn && menu){
    btn.addEventListener('click', function(){
      var ouvert = menu.classList.toggle('ouvert');
      btn.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    });
  }

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

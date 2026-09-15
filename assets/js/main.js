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
    function actualiserEntete(){
      entete.classList.toggle('scrolled', window.scrollY > 24);
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

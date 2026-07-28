// Revela seções ao entrar na tela
(function(){
  var items = document.querySelectorAll('.reveal');
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        e.target.classList.add('is-visible');
        obs.unobserve(e.target);
      }
    });
  }, {threshold:0.15, rootMargin:'0px 0px -40px 0px'});
  items.forEach(function(el){ obs.observe(el); });
})();

// Parallax sutil na imagem do hero
(function(){
  var hv = document.getElementById('heroVisual');
  if(!hv) return;
  var img = hv.querySelector('img');
  var ticking = false;
  window.addEventListener('scroll', function(){
    if(!ticking){
      window.requestAnimationFrame(function(){
        var y = Math.min(window.scrollY, 600) * 0.06;
        img.style.transform = 'translateY(' + y + 'px) scale(1.06)';
        ticking = false;
      });
      ticking = true;
    }
  });
})();

// Lightbox: abre em tela cheia qualquer imagem marcada com data-lightbox
(function(){
  var overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.innerHTML = '<div class="lightbox-close" aria-label="Fechar">&times;</div><img alt="">';
  document.body.appendChild(overlay);
  var overlayImg = overlay.querySelector('img');
  var closeBtn = overlay.querySelector('.lightbox-close');

  function openLightbox(src, alt){
    overlayImg.src = src;
    overlayImg.alt = alt || '';
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox(){
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-lightbox] img').forEach(function(img){
    img.addEventListener('click', function(){
      openLightbox(img.currentSrc || img.src, img.alt);
    });
  });

  overlay.addEventListener('click', function(e){
    if(e.target === overlay || e.target === closeBtn){ closeLightbox(); }
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){ closeLightbox(); }
  });
})();

// Envio do formulário: post para o Apps Script e redireciona para o WhatsApp
document.getElementById('granato-form').addEventListener('submit', function(e){
  e.preventDefault();
  var form = e.target;
  var data = new FormData(form);
  fetch(form.action, { method: 'POST', body: data, mode: 'no-cors' })
    .finally(function(){
      window.location.href = 'https://wa.me/5544998600026?text=' + encodeURIComponent('Olá, vim do site e acabei de preencher o formulário.');
    });
});

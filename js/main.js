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

// Formulário -> Google Sheets (via Apps Script) -> WhatsApp
(function(){
  var form = document.getElementById('granato-form');
  var btn = document.getElementById('granato-submit');
  var status = document.getElementById('granato-form-status');
  var config = window.GRANATO_CONFIG || {};
  var submitting = false;
  var submissionTimer = null;

  if(!form || !btn) return;

  var appsScriptUrl = String(config.appsScriptUrl || '').trim();
  var whatsappNumber = String(config.whatsappNumber || '554497600121').replace(/\D/g, '');
  var whatsappMessage = String(config.whatsappMessage || 'Olá, vim pelo site no google e gostaria de mais informações.');
  var formToken = String(config.formToken || 'granato-lp-v1-20260902');
  var whatsappUrl = 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(whatsappMessage);
  var tokenField = document.getElementById('granato-integracao-token');
  if(tokenField) tokenField.value = formToken;

  // Mantém todos os botões/links de WhatsApp com o mesmo número e mensagem.
  document.querySelectorAll('.js-whatsapp-link').forEach(function(link){
    link.href = whatsappUrl;
  });

  // A URL do Apps Script é carregada pela configuração GRANATO_CONFIG no index.html.
  if(appsScriptUrl && appsScriptUrl !== 'COLE_AQUI_A_URL_DO_APPS_SCRIPT'){
    form.action = appsScriptUrl;
  }

  // Salva dados de origem úteis para os leads vindos de Google Ads/Google Search.
  var params = new URLSearchParams(window.location.search);
  var trackingFields = {
    'granato-pagina': window.location.href,
    'granato-referencia': document.referrer || '',
    'granato-utm-source': params.get('utm_source') || '',
    'granato-utm-medium': params.get('utm_medium') || '',
    'granato-utm-campaign': params.get('utm_campaign') || '',
    'granato-utm-term': params.get('utm_term') || '',
    'granato-utm-content': params.get('utm_content') || '',
    'granato-gclid': params.get('gclid') || ''
  };
  Object.keys(trackingFields).forEach(function(id){
    var field = document.getElementById(id);
    if(field) field.value = trackingFields[id];
  });

  function setStatus(message, isError){
    if(!status) return;
    status.textContent = message || '';
    status.classList.toggle('is-error', Boolean(isError));
  }

  function updateSubmitState(){
    btn.disabled = submitting || !form.checkValidity();
  }

  form.addEventListener('input', updateSubmitState);
  form.addEventListener('change', updateSubmitState);
  updateSubmitState();

  form.addEventListener('submit', function(e){
    if(!form.checkValidity()){
      e.preventDefault();
      form.reportValidity();
      return;
    }

    if(!appsScriptUrl || appsScriptUrl === 'COLE_AQUI_A_URL_DO_APPS_SCRIPT'){
      e.preventDefault();
      setStatus('Integração não configurada: informe a URL do Apps Script no index.html.', true);
      return;
    }

    var dataHora = document.getElementById('granato-data-hora');
    if(dataHora) dataHora.value = new Date().toISOString();

    submitting = true;
    btn.textContent = 'Enviando...';
    updateSubmitState();
    setStatus('Enviando seus dados...', false);

    clearTimeout(submissionTimer);
    submissionTimer = setTimeout(function(){
      if(!submitting) return;
      submitting = false;
      btn.textContent = 'Quero um orçamento';
      updateSubmitState();
      setStatus('O envio demorou mais que o esperado. Verifique sua conexão e tente novamente.', true);
    }, 30000);

    // O envio segue normalmente para o iframe oculto. O Apps Script responde
    // via postMessage somente depois de gravar a linha na planilha.
  });

  window.addEventListener('message', function(event){
    if(!submitting || !event.data || typeof event.data !== 'object') return;
    if(event.data.token !== formToken) return;

    if(event.data.type === 'granato-form-success'){
      clearTimeout(submissionTimer);
      submitting = false;
      setStatus('Dados enviados. Abrindo o WhatsApp...', false);

      if(window.dataLayer && Array.isArray(window.dataLayer)){
        window.dataLayer.push({ event: 'lead_form_enviado' });
      }

      window.location.href = whatsappUrl;
      return;
    }

    if(event.data.type === 'granato-form-error'){
      clearTimeout(submissionTimer);
      submitting = false;
      btn.textContent = 'Quero um orçamento';
      updateSubmitState();
      setStatus('Não foi possível salvar seus dados. Tente novamente.', true);
    }
  });
})();

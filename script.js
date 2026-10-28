(() => {
  'use strict';

  const body = document.body;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1) AÇILIŞ ANİMASYONU ---------- */
  function initIntro() {
    const intro = document.getElementById('intro');
    const beansLayer = document.getElementById('beans');
    const template = document.getElementById('bean-template');
    const skipBtn = document.getElementById('skip');

    const BEAN_COUNT = window.innerWidth < 600 ? 40 : 65;
    const INTRO_DURATION = 3600; // ms — çekirdekler düşüp yerleştikten sonra perde kalkar
    let finished = false;

    const rand = (min, max) => Math.random() * (max - min) + min;

    function finishIntro() {
      if (finished) return;
      finished = true;
      intro.classList.add('is-leaving');
      body.classList.remove('is-loading');
      body.classList.add('is-ready');
      // Perde tamamen çıkınca DOM'dan kaldır
      setTimeout(() => intro.remove(), 1300);
    }
    const seen = sessionStorage.getItem('yaren-intro');
sessionStorage.setItem('yaren-intro', '1');
if (seen) {
  intro.remove();
  body.classList.remove('is-loading');
  body.classList.add('is-ready');
  return;
}

    if (prefersReducedMotion) {
      intro.remove();
      body.classList.remove('is-loading');
      body.classList.add('is-ready');
      return;
    }

    const stageHeight = window.innerHeight;

    for (let i = 0; i < BEAN_COUNT; i++) {
      const bean = document.createElement('div');
      bean.className = 'bean';
      bean.appendChild(template.content.cloneNode(true));

      const width = rand(26, 50);
      const height = width * 1.5;
      const xPercent = rand(2, 98);

      // Orta kısım daha yüksek yığılsın (tepecik gibi)
      const closenessToCenter = 1 - Math.abs(xPercent - 50) / 50;
      const pileHeight = 6 + Math.pow(closenessToCenter, 1.6) * 120 + rand(0, 34);

      bean.style.setProperty('--w', `${width}px`);
      bean.style.setProperty('--h', `${height}px`);
      bean.style.setProperty('--left', `calc(${xPercent}% - ${width / 2}px)`);
      bean.style.setProperty('--land', `${stageHeight - height - pileHeight}px`);
      bean.style.setProperty('--rot', `${rand(-160, 160)}deg`);
      bean.style.setProperty('--delay', `${rand(0, 1.5).toFixed(2)}s`);
      bean.style.setProperty('--tone', rand(0.8, 1.25).toFixed(2));

      beansLayer.appendChild(bean);
    }

    setTimeout(finishIntro, INTRO_DURATION);
    skipBtn.addEventListener('click', finishIntro);
  }

  /* ---------- 2) NAVİGASYON ---------- */
  function initNav() {
    const nav = document.getElementById('nav');
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');
    const links = [...menu.querySelectorAll('a[href^="#"]')];

    // Kaydırınca arka plan
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mobil menü
    const setMenu = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    links.forEach((link) => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

    // Görünen bölüme göre aktif bağlantı
    const sections = links.map((l) => document.querySelector(l.getAttribute('href'))).filter(Boolean);
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- 3) KAYDIRINCA BELİRME ---------- */
  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach((el) => observer.observe(el));
  }

  /* ---------- 4) İLETİŞİM FORMU ---------- */
  function initForm() {
    const form = document.getElementById('contactForm');
    const success = document.getElementById('formSuccess');
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    // Her alan için doğrulama kuralı: hata varsa mesaj döner, yoksa ''
    const rules = {
      name: (v) => (v.trim() ? '' : 'Lütfen adını yaz.'),
      email: (v) => {
        if (!v.trim()) return 'Lütfen e-posta adresini yaz.';
        return EMAIL_REGEX.test(v.trim()) ? '' : 'Geçerli bir e-posta adresi gir (örn. ad@site.com).';
      },
      message: (v) => (v.trim() ? '' : 'Lütfen bir mesaj yaz.'),
    };

    function validateField(name) {
      const input = form.elements[name];
      const error = document.getElementById(`${name}Error`);
      const message = rules[name](input.value);
      error.textContent = message;
      input.closest('.field').classList.toggle('has-error', Boolean(message));
      input.setAttribute('aria-invalid', String(Boolean(message)));
      return !message;
    }

    // Kullanıcı alandan çıkınca ve hata varken yazarken kontrol et
    Object.keys(rules).forEach((name) => {
      const input = form.elements[name];
      input.addEventListener('blur', () => validateField(name));
      input.addEventListener('input', () => {
        if (input.closest('.field').classList.contains('has-error')) validateField(name);
        success.hidden = true;
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const results = Object.keys(rules).map(validateField); // hepsini çalıştır
      const isValid = results.every(Boolean);

      if (!isValid) {
        const firstInvalid = form.querySelector('.has-error input, .has-error textarea');
        if (firstInvalid) firstInvalid.focus();
        success.hidden = true;
        return;
      }

      // Sunucu bağlantısı gerekmiyor: başarı mesajını göster ve formu temizle
      form.reset();
      success.hidden = false;
    });
  }
    /* ---------- 5) HERO: SÜZÜLEN ÇEKİRDEKLER + FARE DERİNLİĞİ ---------- */
  function initHeroMotion() {
    const hero = document.querySelector('.hero');
    const layer = document.getElementById('heroBeans');
    const art = document.querySelector('.hero__art');
    const template = document.getElementById('bean-template');
    if (!hero || !layer || prefersReducedMotion) return;

    const rand = (min, max) => Math.random() * (max - min) + min;
    const count = window.innerWidth < 600 ? 8 : 16;

    for (let i = 0; i < count; i++) {
      const bean = document.createElement('div');
      bean.className = 'hero-bean';
      bean.appendChild(template.content.cloneNode(true));
      bean.style.setProperty('--size', `${rand(16, 40).toFixed(0)}px`);
      bean.style.setProperty('--x', `${rand(0, 100).toFixed(1)}%`);
      bean.style.setProperty('--dur', `${rand(14, 28).toFixed(1)}s`);
      bean.style.setProperty('--delay', `-${rand(0, 28).toFixed(1)}s`);
      bean.style.setProperty('--spin', `${rand(-360, 360).toFixed(0)}deg`);
      bean.style.setProperty('--drift', `${rand(-80, 80).toFixed(0)}px`);
      layer.appendChild(bean);
    }

    // Sadece fare olan cihazlarda: sahne ve çekirdekler zıt yönde kayar
    if (!window.matchMedia('(hover: hover)').matches) return;
    hero.addEventListener('mousemove', (e) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      art.style.translate = `${x * -28}px ${y * -20}px`;
      layer.style.translate = `${x * 36}px ${y * 24}px`;
    });
  }
  initIntro();
  initNav();
  initReveal();
  initForm();
  initHeroMotion();
})();

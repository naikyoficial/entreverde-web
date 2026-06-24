/* ══════════════════════════════════════
   ENTRE VERDE · main.js
   Cinematic scroll & interactions
══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  const isTouch = window.matchMedia('(hover: none)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Lazy image fade-in ── */
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    if (img.complete && img.naturalWidth) {
      img.style.opacity = 1;
    } else {
      img.addEventListener('load', () => img.style.opacity = 1);
      img.addEventListener('error', () => {
        img.style.opacity = 0;
        img.style.display = 'none';
      });
    }
  });

  /* ── Video with full error resilience ── */
  (function () {
    const video = document.querySelector('.sustrato-video');
    if (!video) return;

    // Skip video on very slow connections — show static poster-fallback instead
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g')) {
      video.style.display = 'none';
      return;
    }

    let stallTimer = null;
    let hasStartedPlaying = false;

    function showPosterFallback() {
      clearTimeout(stallTimer);
      try { video.pause(); } catch (_) {}
      video.style.display = 'none';
    }

    video.addEventListener('error', showPosterFallback, { once: true });
    const src = video.querySelector('source');
    if (src) src.addEventListener('error', showPosterFallback, { once: true });

    video.addEventListener('playing', () => {
      hasStartedPlaying = true;
      clearTimeout(stallTimer);
    }, { once: true });

    function tryPlay() {
      const p = video.play();
      if (p && p.catch) p.catch(err => {
        // AbortError is expected when the user scrolls away before play completes — not a real failure
        if (!err || err.name !== 'AbortError') showPosterFallback();
      });
      // If video hasn't started playing within 8 s, fall back to the poster gradient
      if (!hasStartedPlaying) {
        clearTimeout(stallTimer);
        stallTimer = setTimeout(() => {
          if (!hasStartedPlaying) showPosterFallback();
        }, 8000);
      }
    }

    if (!('IntersectionObserver' in window)) {
      tryPlay();
      return;
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          tryPlay();
        } else {
          clearTimeout(stallTimer);
          try { video.pause(); } catch (_) {}
        }
      });
    }, { threshold: 0.15 });

    io.observe(video);
  })();

  /* ── Grain texture (desktop only) ── */
  if (!isTouch) {
    const grain = document.querySelector('.grain');
    if (grain) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = canvas.height = 256;
      const img = ctx.createImageData(256, 256);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i] = img.data[i+1] = img.data[i+2] = v;
        img.data[i+3] = 28;
      }
      ctx.putImageData(img, 0, 0);
      grain.style.backgroundImage = `url(${canvas.toDataURL()})`;
    }
  }

  /* ── Loader ── */
  const loader = document.getElementById('loader');
  let loaderDone = false;
  function dismissLoader() {
    if (loaderDone) return;
    loaderDone = true;
    loader.classList.add('done');
    document.body.classList.remove('is-loading');
    runHeroAnimations();
  }
  window.addEventListener('load', () => setTimeout(dismissLoader, 300));
  setTimeout(dismissLoader, 4000);

  /* ── Magnetic buttons (desktop, motion allowed) ── */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      const inner = el.querySelector('.btn-magnetic-inner');
      const strength = 0.35;
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
        if (inner) inner.style.transform = `translate(${dx * strength * 0.5}px, ${dy * strength * 0.5}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        if (inner) inner.style.transform = '';
      });
    });
  }

  /* ── Card spotlight (cursor-tracking glow, desktop only) ── */
  if (!isTouch) {
    document.querySelectorAll('.comp-card, .planta-card, .cta-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ── Stat count-up (all devices) ── */
  (function () {
    const nums = document.querySelectorAll('.stat-num[data-count]');
    if (!nums.length) return;
    const animateNum = el => {
      const target = parseFloat(el.dataset.count);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      if (reduceMotion) { el.textContent = prefix + target + suffix; return; }
      const dur = 1600;
      const start = performance.now();
      const step = now => {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);          // easeOutCubic
        el.textContent = prefix + Math.round(target * eased) + suffix;
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = prefix + target + suffix;
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) { animateNum(en.target); obs.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    nums.forEach(n => io.observe(n));
  })();


  /* ── Scroll nativo ── */
  let lenis = null;

  /* ── GSAP & ScrollTrigger ── */
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  /* ── Hero animations (after loader) ── */
  function runHeroAnimations() {
    if (typeof gsap === 'undefined' || reduceMotion) {
      document.querySelectorAll('.reveal-up, .reveal-scale').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.h1-line:first-child .h1-inner', { yPercent: 110, duration: 1.15 }, 0.1)
      .from('.h1-line:last-child .h1-inner',  { yPercent: 110, duration: 1.15 }, 0.26)
      .to('.hero-sub',           { y: 0, opacity: 1, duration: 0.9 }, 0.46)
      .to('.hero-scroll',        { y: 0, opacity: 1, duration: 0.7 }, 0.6)
      .to('.formula-badge',      { scale: 1, opacity: 1, duration: 1.2, ease: 'back.out(1.4)' }, 0.5);
  }

  /* ── Hero parallax (desktop only) ── */
  if (!isTouch && !reduceMotion) {
    const heroImg = document.getElementById('hero-img');
    if (heroImg) {
      gsap.to(heroImg, {
        y: '18%',
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    }
  }

  /* ── Nav on scroll ── */
  const nav = document.getElementById('nav');
  ScrollTrigger.create({
    start: 'top -60',
    onToggle: self => nav.classList.toggle('scrolled', self.isActive)
  });

  /* ── Open form on "Quiero distribuir" CTA ── */
  const formWrap = document.getElementById('form');
  document.querySelectorAll('.btn-cta').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      formWrap.classList.add('open');
      setTimeout(() => formWrap.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      closeMobileMenu();
    });
  });

  /* ── Smooth scroll anchors ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    if (a.classList.contains('btn-cta')) return;
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -80, duration: 1.4 });
      else target.scrollIntoView({ behavior: 'smooth' });
      closeMobileMenu();
    });
  });

  /* ── Mobile menu ── */
  const burger = document.getElementById('nav-burger');
  const mobileMenu = document.getElementById('mobile-menu');

  function closeMobileMenu() {
    burger.classList.remove('open');
    mobileMenu.classList.remove('open');
  }
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });

  /* ── Scroll animations (desktop only) ── */
  if (!isTouch && !reduceMotion) {
    /* Sustrato section */
    gsap.from('.sustrato-img-frame', {
      x: -80, opacity: 0, duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.sustrato-section', start: 'top 72%' }
    });
    gsap.from('.sustrato-content .section-label, .sustrato-heading, .sustrato-text, .s-benefit', {
      x: 60, opacity: 0, duration: 1, stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.sustrato-content', start: 'top 72%' }
    });

    /* Stats band */
    gsap.from('.stat', {
      y: 40, opacity: 0, duration: 0.9, stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.stats-section', start: 'top 82%' }
    });

    /* Components */
    gsap.from('.comp-intro > *', {
      y: 40, opacity: 0, duration: 0.9, stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.comp-intro', start: 'top 80%' }
    });
    gsap.from('.comp-card', {
      y: 60, opacity: 0, duration: 0.9, stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.comp-cards', start: 'top 80%' }
    });

    /* Plantas */
    gsap.from('.plantas-heading', {
      y: 40, opacity: 0, duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.plantas-section', start: 'top 80%' }
    });
    gsap.from('.planta-card', {
      y: 60, opacity: 0, duration: 0.9, stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.plantas-grid', start: 'top 80%' }
    });

    /* FAQ */
    gsap.from('.faq-heading', {
      y: 40, opacity: 0, duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.faq-section', start: 'top 80%' }
    });
    gsap.from('.faq-item', {
      y: 30, opacity: 0, duration: 0.7, stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.faq-list', start: 'top 80%' }
    });

    /* CTA */
    gsap.from('.cta-heading, .cta-sub', {
      y: 50, opacity: 0, duration: 1, stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.cta-section', start: 'top 78%' }
    });
    gsap.from('.cta-card', {
      y: 60, opacity: 0, scale: 0.95, duration: 1.1,
      ease: 'back.out(1.5)',
      scrollTrigger: { trigger: '.cta-card', start: 'top 82%' }
    });
    gsap.from('.product-visual', {
      x: 50, opacity: 0, duration: 1.1, delay: 0.2,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.cta-grid', start: 'top 78%' }
    });

    /* CTA glow pulse */
    gsap.to('.cta-bg-glow', {
      opacity: 0.7, scale: 1.15, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut'
    });

    /* 3D card tilt */
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        gsap.to(card, {
          rotateY: dx * 10,
          rotateX: -dy * 10,
          transformPerspective: 800,
          duration: 0.4,
          ease: 'power2.out'
        });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'power3.out' });
      });
    });

    /* Scroll progress line */
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      position: fixed; top: 0; left: 0; height: 2px; width: 0;
      background: var(--green); z-index: 9990; pointer-events: none;
      transition: width 0.1s linear;
    `;
    document.body.appendChild(progressBar);
    ScrollTrigger.create({
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: self => {
        progressBar.style.width = (self.progress * 100) + '%';
      }
    });
  }

  /* ── FAQ accordion ── */
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ── Form submit ── */
  const form = document.getElementById('dist-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('.btn-submit');
      btn.innerHTML = '<span class="btn-text">Abriendo WhatsApp...</span>';
      btn.disabled = true;

      const d = new FormData(form);
      const get = k => (d.get(k) || '').trim();

      const nombre   = get('nombre');
      const email    = get('email');
      const comercio = get('comercio');
      const negocio  = get('negocio');
      const ciudad   = get('ciudad');
      const mensaje  = get('mensaje');

      const negocioLine = [comercio, negocio].filter(Boolean).join(' · ');

      const lines = [
        `🌿 *Nueva consulta — Aroid Mix Premium*`,
        '',
        `*${nombre}* quiere llevar el sustrato a su negocio.`,
        '',
        negocioLine ? `🏪 ${negocioLine}` : null,
        ciudad      ? `📍 ${ciudad}`      : null,
        `📧 ${email}`,
        mensaje     ? ''                  : null,
        mensaje     ? `💬 _"${mensaje}"_` : null,
      ].filter(Boolean).join('\n');

      window.location.href = `whatsapp://send?phone=5493436218007&text=${encodeURIComponent(lines)}`;

      form.style.display = 'none';
      const success = document.getElementById('form-success');
      success.classList.add('visible');
      gsap.from(success, { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' });
    });
  }

});

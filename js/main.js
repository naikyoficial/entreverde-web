/* ══════════════════════════════════════
   ENTRE VERDE · main.js
   Cinematic scroll & interactions
══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Grain texture ── */
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

  /* ── Loader ── */
  const loader = document.getElementById('loader');
  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('done');
      document.body.classList.remove('is-loading');
      runHeroAnimations();
    }, 300);
  });

  /* ── Custom Cursor ── */
  const dot   = document.getElementById('cursor-dot');
  const ring  = document.getElementById('cursor-ring');
  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  function animateRing() {
    rx += (mx - rx) * 0.14;
    ry += (my - ry) * 0.14;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  document.querySelectorAll('a, button, [data-tilt], .comp-card, .planta-card').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hovering'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hovering'));
  });

  /* ── Scroll nativo (sin Lenis para máxima compatibilidad) ── */
  let lenis = null;

  /* ── GSAP & ScrollTrigger ── */
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  /* ── Hero animations (after loader) ── */
  function runHeroAnimations() {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to('.h1-line:first-child', { y: 0, opacity: 1, duration: 1.1 }, 0.1)
      .to('.h1-line:last-child',  { y: 0, opacity: 1, duration: 1.1 }, 0.24)
      .to('.hero-sub',           { y: 0, opacity: 1, duration: 0.9 }, 0.4)
      .to('.hero-icons',         { y: 0, opacity: 1, duration: 0.8 }, 0.54)
      .to('.hero-scroll',        { y: 0, opacity: 1, duration: 0.7 }, 0.62)
      .to('.formula-badge',      { scale: 1, opacity: 1, duration: 1.2, ease: 'back.out(1.4)' }, 0.46);
  }

  /* ── Hero parallax ── */
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

  /* ── Helper: fade-up on scroll ── */
  function animateOnScroll(selector, vars = {}, triggerEl = null) {
    const els = document.querySelectorAll(selector);
    if (!els.length) return;
    gsap.from(els, {
      y: 60, opacity: 0, duration: 1,
      ease: 'power3.out', stagger: 0.12,
      scrollTrigger: {
        trigger: triggerEl || els[0],
        start: 'top 82%',
        toggleActions: 'play none none none'
      },
      ...vars
    });
  }

  /* ── Problem / VS section ── */
  gsap.from('.vs-intro', {
    y: 40, opacity: 0, duration: 1,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.problem-section', start: 'top 78%' }
  });
  gsap.from('.vs-heads', {
    y: 16, opacity: 0, duration: 0.7,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.vs-compare', start: 'top 88%' }
  });
  gsap.from('.vs-item', {
    y: 24, opacity: 0, duration: 0.6, stagger: 0.07,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.vs-compare', start: 'top 88%' }
  });

  /* ── Sustrato section ── */
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

  /* ── Components ── */
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

  /* ── Plantas ── */
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

  /* ── FAQ ── */
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

  /* ── CTA ── */
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

  /* ── CTA glow pulse ── */
  gsap.to('.cta-bg-glow', {
    opacity: 0.7, scale: 1.15, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut'
  });

  /* ── 3D card tilt ── */
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

      const waUrl = `https://wa.me/5493436218007?text=${encodeURIComponent(lines)}`;

      /* Abrir WA sincrónicamente dentro del evento — evita que el navegador
         lo bloquee como popup (setTimeout lo rompía) */
      const link = document.createElement('a');
      link.href = waUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      form.style.display = 'none';
      const success = document.getElementById('form-success');
      success.classList.add('visible');
      gsap.from(success, { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' });
    });
  }

  /* ── Scroll progress line ── */
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

});

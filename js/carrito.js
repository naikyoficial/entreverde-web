/* ══════════════════════════════════════
   ENTRE VERDE · Carrito de Cercos Vivos
   LocalStorage + UI flotante + Checkout a WhatsApp
   Depende de window.CATALOGO (catalogo.js)
══════════════════════════════════════ */

(function () {
  'use strict';

  var STORAGE_KEY = 'ev_cart_v1';
  var WA_NUMBER = '5493436218007';

  // ═══ Modelo del carrito ═══
  function readCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  function writeCart(cart) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) {}
  }
  function totalItems(cart) {
    return Object.values(cart).reduce(function (s, n) { return s + n; }, 0);
  }

  // ═══ API pública ═══
  window.EVCart = {
    add: function (slug, qty) {
      var cart = readCart();
      cart[slug] = (cart[slug] || 0) + (qty || 1);
      writeCart(cart);
      renderBadge(); renderModal();
      flashAdd(slug);
    },
    remove: function (slug) {
      var cart = readCart();
      delete cart[slug];
      writeCart(cart);
      renderBadge(); renderModal();
    },
    setQty: function (slug, qty) {
      var cart = readCart();
      if (qty <= 0) delete cart[slug];
      else cart[slug] = qty;
      writeCart(cart);
      renderBadge(); renderModal();
    },
    clear: function () {
      writeCart({});
      renderBadge(); renderModal();
    },
    count: function () { return totalItems(readCart()); },
    get: function () { return readCart(); }
  };

  // ═══ UI: botón flotante con badge ═══
  function createFloatBtn() {
    if (document.getElementById('ev-cart-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'ev-cart-btn';
    btn.className = 'ev-cart-btn';
    btn.setAttribute('aria-label', 'Ver carrito');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M3 3h2l2.4 12.4a2 2 0 002 1.6h8.8a2 2 0 002-1.6L21.5 7H6"/>' +
      '<circle cx="9.5" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/>' +
      '</svg>' +
      '<span class="ev-cart-badge" id="ev-cart-badge">0</span>';
    btn.addEventListener('click', openModal);
    document.body.appendChild(btn);
  }

  function renderBadge() {
    var badge = document.getElementById('ev-cart-badge');
    if (!badge) return;
    var n = totalItems(readCart());
    badge.textContent = n;
    badge.classList.toggle('is-active', n > 0);
    var btn = document.getElementById('ev-cart-btn');
    if (btn) btn.classList.toggle('has-items', n > 0);
  }

  // ═══ UI: modal con detalle y checkout ═══
  function createModal() {
    if (document.getElementById('ev-cart-modal')) return;
    var overlay = document.createElement('div');
    overlay.id = 'ev-cart-modal';
    overlay.className = 'ev-cart-modal';
    overlay.innerHTML =
      '<div class="ev-cm-sheet" role="dialog" aria-label="Mi carrito">' +
      '  <div class="ev-cm-head">' +
      '    <h3>Mi carrito</h3>' +
      '    <button type="button" class="ev-cm-close" aria-label="Cerrar">' +
      '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>' +
      '    </button>' +
      '  </div>' +
      '  <div class="ev-cm-body" id="ev-cm-body"></div>' +
      '  <div class="ev-cm-foot" id="ev-cm-foot"></div>' +
      '</div>';
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
    overlay.querySelector('.ev-cm-close').addEventListener('click', closeModal);
    document.body.appendChild(overlay);
  }
  function openModal() {
    createModal();
    renderModal();
    document.getElementById('ev-cart-modal').classList.add('is-open');
    document.body.classList.add('ev-cart-open');
  }
  function closeModal() {
    var m = document.getElementById('ev-cart-modal');
    if (m) m.classList.remove('is-open');
    document.body.classList.remove('ev-cart-open');
  }

  function findItem(slug) {
    if (!window.CATALOGO) return null;
    return window.CATALOGO.find(function (p) { return p.slug === slug; });
  }

  function renderModal() {
    var body = document.getElementById('ev-cm-body');
    var foot = document.getElementById('ev-cm-foot');
    if (!body || !foot) return;

    var cart = readCart();
    var entries = Object.entries(cart);

    if (entries.length === 0) {
      body.innerHTML =
        '<div class="ev-cm-empty">' +
        '  <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.5">' +
        '    <path d="M3 3h2l2.4 12.4a2 2 0 002 1.6h8.8a2 2 0 002-1.6L21.5 7H6"/>' +
        '    <circle cx="9.5" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/>' +
        '  </svg>' +
        '  <p>Tu carrito está vacío.</p>' +
        '  <span>Explorá el catálogo y agregá las especies que te interesen.</span>' +
        '</div>';
      foot.innerHTML = '';
      return;
    }

    var itemsHtml = entries.map(function (e) {
      var slug = e[0], qty = e[1];
      var item = findItem(slug);
      if (!item) return '';
      var cat = item.imgCat || 'hoja';
      var color = item.imgColor || '#2d5a3d';
      return '' +
        '<div class="ev-cm-item" data-slug="' + slug + '">' +
        '  <div class="ev-cm-thumb" style="background:' + color + '" data-cat="' + cat + '">' +
        '    <span class="ev-cm-thumb-mark">' + (cat === 'conifera' ? '✦' : cat === 'flor' ? '❀' : cat === 'baya' ? '●' : cat === 'herbacea' ? '⫯' : '❧') + '</span>' +
        '  </div>' +
        '  <div class="ev-cm-info">' +
        '    <strong>' + escapeHTML(item.nombre) + '</strong>' +
        '    <em>' + escapeHTML(item.cientifico) + '</em>' +
        '    <span>' + escapeHTML(item.altura) + ' · ' + escapeHTML(item.crecimiento) + '</span>' +
        '  </div>' +
        '  <div class="ev-cm-qty">' +
        '    <button class="qtyBtn" data-action="dec" aria-label="Menos">−</button>' +
        '    <span class="qtyNum">' + qty + '</span>' +
        '    <button class="qtyBtn" data-action="inc" aria-label="Más">+</button>' +
        '  </div>' +
        '  <button class="ev-cm-remove" data-action="rm" aria-label="Quitar">' +
        '    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 6v14a2 2 0 002 2h8a2 2 0 002-2V6"/></svg>' +
        '  </button>' +
        '</div>';
    }).join('');

    body.innerHTML = itemsHtml;

    // Delegación de eventos
    body.querySelectorAll('.ev-cm-item').forEach(function (row) {
      var slug = row.dataset.slug;
      row.querySelectorAll('button[data-action]').forEach(function (b) {
        b.addEventListener('click', function () {
          var a = b.dataset.action;
          var cur = readCart()[slug] || 0;
          if (a === 'inc') window.EVCart.setQty(slug, cur + 1);
          else if (a === 'dec') window.EVCart.setQty(slug, cur - 1);
          else if (a === 'rm') window.EVCart.remove(slug);
        });
      });
    });

    var total = totalItems(readCart());
    foot.innerHTML =
      '<div class="ev-cm-sum">' +
      '  <span>Total</span>' +
      '  <strong>' + total + ' planta' + (total !== 1 ? 's' : '') + '</strong>' +
      '</div>' +
      '<div class="ev-cm-foot-actions">' +
      '  <button type="button" class="ev-cm-clear" id="ev-cm-clear">Vaciar</button>' +
      '  <a href="#" class="ev-cm-checkout" id="ev-cm-checkout">' +
      '    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.86 11.86 0 0012.07 0C5.5 0 .17 5.33.14 11.9c0 2.1.55 4.14 1.6 5.94L0 24l6.3-1.65a11.87 11.87 0 005.68 1.45h.01c6.58 0 11.91-5.33 11.94-11.91 0-3.19-1.25-6.17-3.5-8.41z"/></svg>' +
      '    Hacer el pedido' +
      '  </a>' +
      '</div>' +
      '<p class="ev-cm-foot-note">El pedido se envía por WhatsApp. Te pasamos disponibilidad, precio y envío.</p>';

    document.getElementById('ev-cm-clear').addEventListener('click', function () {
      if (confirm('¿Vaciar el carrito?')) window.EVCart.clear();
    });
    document.getElementById('ev-cm-checkout').addEventListener('click', function (e) {
      e.preventDefault();
      doCheckout();
    });
  }

  function doCheckout() {
    var cart = readCart();
    var entries = Object.entries(cart);
    if (entries.length === 0) return;

    var lines = [];
    lines.push('¡Hola Entre Verde! Me gustaría hacer una consulta de pedido:');
    lines.push('');
    entries.forEach(function (e, i) {
      var slug = e[0], qty = e[1];
      var item = findItem(slug);
      if (!item) return;
      lines.push((i + 1) + ') ' + item.nombre + ' — ' + qty + ' unidad' + (qty !== 1 ? 'es' : '') + ' (' + item.altura + ', ' + item.crecimiento + ')');
    });
    lines.push('');
    lines.push('¿Me podrían pasar disponibilidad, precio y envío? Gracias.');

    var text = encodeURIComponent(lines.join('\n'));
    var url = 'https://wa.me/' + WA_NUMBER + '?text=' + text;
    window.open(url, '_blank', 'noopener');
  }

  // ═══ Flash cuando se agrega un item ═══
  function flashAdd(slug) {
    var btn = document.getElementById('ev-cart-btn');
    if (!btn) return;
    btn.classList.remove('is-flashing');
    void btn.offsetWidth; // force reflow
    btn.classList.add('is-flashing');
  }

  // ═══ Delegación global de botones "agregar" ═══
  function hookAddButtons() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-cart-add]');
      if (!btn) return;
      e.preventDefault();
      var slug = btn.dataset.cartAdd;
      if (!slug) return;
      if (btn.disabled) return;
      window.EVCart.add(slug, 1);
      // Micro-feedback en el botón
      var orig = btn.innerHTML;
      btn.innerHTML = '✓ Agregado';
      btn.classList.add('is-added');
      setTimeout(function () {
        btn.innerHTML = orig;
        btn.classList.remove('is-added');
      }, 1400);
    });
  }

  // ═══ Escape HTML para seguridad ═══
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ═══ Init ═══
  document.addEventListener('DOMContentLoaded', function () {
    createFloatBtn();
    renderBadge();
    hookAddButtons();
  });

  // Escuchar cambios de localStorage (cuando hay varias pestañas abiertas)
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY) { renderBadge(); renderModal(); }
  });
})();

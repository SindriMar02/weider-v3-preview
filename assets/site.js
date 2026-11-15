/* Weider v3. Data: assets/data.js (weider.is catalogue, 14 Nov 2026). Motion spec: _docs/weider-v3-2026-11-15/MOTION.md */
(function () {
  'use strict';
  var P = window.WEIDER || [], CATS = window.WEIDER_CATS || [];
  var byH = {}; P.forEach(function (p) { byH[p.h] = p; });
  var catLabel = {}; CATS.forEach(function (c) { catLabel[c.k] = c.label; });
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var G = window.gsap, ST = window.ScrollTrigger;
  if (G && ST) G.registerPlugin(ST);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- helpers ---------- */
  var kr = function (n) { return n.toLocaleString('de-DE') + ' kr.'; };
  var nVara = function (n) { return n + (n % 10 === 1 && n % 100 !== 11 ? ' vara' : ' vörur'); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // 18 curated photographs (Higgsfield GPT Image 2, one locked petrol-studio set). Everything else: official render on a CSS stage.
  var PHOTO = ['premium-whey', 'micronized-creatine', 'total-rush', 'gold-whey', 'premium-creatin-watermelon', 'protein-80-plus',
    'premium-bcaa-8-1-1-l-glutamine-500gr', 'rush-pump-sauerkirsche', 'plant-based-protein', 'pure-creatine', 'premium-creatine-gummies',
    'rush-ready-to-drink', 'omega-3-superior', 'premium-hydration', 'whey-wafer', 'vitamin-d3-k2-kapseln', 'magnesium-gummi', 'ashwagandha-gummi'];
  var hasPhoto = function (p) { return PHOTO.indexOf(p.h) > -1; };
  var photoSrc = function (p, big) { return 'assets/img/p/' + p.h + '-' + (big ? 1100 : 600) + '.webp'; };
  var renderSrc = function (p, i) { var v = p.v[i]; return v && v.img ? v.img.replace('assets/img/v/', 'assets/img/t/') : 'assets/img/t/' + p.h + '.webp'; };
  function ph(p, big, lazy) {
    var photo = hasPhoto(p);
    return '<span class="ph' + (photo ? '' : ' render') + '"><img src="' + (photo ? photoSrc(p, big) : 'assets/img/t/' + p.h + '.webp') +
      '" alt="' + esc(p.t) + '"' + (lazy === false ? '' : ' loading="lazy"') + ' decoding="async" width="600" height="800"></span>';
  }
  var many = function (p) { return p.v.length > 1; };
  var ranged = function (p) { return p.v.some(function (v) { return v.price !== p.price; }); };
  var priceHTML = function (p) { return (many(p) && ranged(p) ? '<span class="from">frá</span>' : '') + kr(p.price); };
  var ICON = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };
  function badge(p) {
    if (!p.avail) return '<span class="badge out">Uppselt</span>';
    if (p.new) return '<span class="badge">Nýtt</span>';
    if (p.popular) return '<span class="badge">Vinsælt</span>';
    if (p.vegan) return '<span class="badge">Vegan</span>';
    return '';
  }
  function photoFirst(list) { return list.slice().sort(function (a, b) { return (hasPhoto(b) - hasPhoto(a)) || (b.popular - a.popular) || (b.featured - a.featured); }); }
  var inCat = function (p, k) { return k === 'all' || p.cats.indexOf(k) > -1; };
  var SHORT = { all: 'Allt', protein: 'Prótein', kreatin: 'Kreatín', pre: 'Pre-workout', amino: 'Amínósýrur', snarl: 'Snarl & drykkir', vitamin: 'Vítamín', aukahlutir: 'Aukahlutir' };
  var CAT_IMG = { all: 'gold-whey', protein: 'premium-whey', kreatin: 'premium-creatin-watermelon', pre: 'total-rush', amino: 'premium-bcaa-8-1-1-l-glutamine-500gr', snarl: 'whey-wafer', vitamin: 'omega-3-superior', aukahlutir: 'weider-r-shaker' };
  var countIn = function (k) { return P.filter(function (p) { return inCat(p, k); }).length; };
  function tabButtons(box, cur) {
    box.insertAdjacentHTML('beforeend', ['all'].concat(CATS.map(function (c) { return c.k; })).map(function (k) {
      return '<button role="tab" type="button" aria-selected="' + (k === cur) + '" data-tab="' + k + '">' + esc(SHORT[k] || catLabel[k]) + '</button>';
    }).join(''));
    var end = function () { box.classList.toggle('end', box.scrollLeft >= box.scrollWidth - box.clientWidth - 4); };
    box.addEventListener('scroll', end, { passive: true }); addEventListener('resize', end); setTimeout(end, 50);
  }

  /* ---------- cart (localStorage is a convenience; the page works without it) ---------- */
  var cart = (function () { try { return JSON.parse(localStorage.getItem('weider3-cart') || '[]'); } catch (e) { return []; } })()
    .filter(function (i) { return byH[i.h] && i.q > 0; });
  function save() { try { localStorage.setItem('weider3-cart', JSON.stringify(cart)); } catch (e) {} }
  var count = function () { return cart.reduce(function (a, i) { return a + i.q; }, 0); };
  function lineOf(h, vt) { return cart.filter(function (i) { return i.h === h && i.vt === vt; })[0]; }
  function setQty(h, vt, q) {
    var l = lineOf(h, vt);
    if (!l && q > 0) cart.push({ h: h, vt: vt, q: Math.min(q, 20) });
    else if (l && q <= 0) cart.splice(cart.indexOf(l), 1);
    else if (l) l.q = Math.min(q, 20);
    save(); syncCart();
  }
  function add(h, vt, q) { var l = lineOf(h, vt); setQty(h, vt, (l ? l.q : 0) + (q || 1)); bump(); }
  function bump() { $$('.cart-n').forEach(function (n) { n.classList.remove('pop'); void n.offsetWidth; n.classList.add('pop'); }); }

  var drawer = $('#cart'), scrim = $('.scrim'), lastTrigger = null;
  function syncCart() {
    var n = count();
    $$('.cart-n').forEach(function (e) { e.textContent = n; });
    $$('.cart-btn').forEach(function (b) { b.setAttribute('aria-label', 'Karfa, ' + nVara(n)); });
    $$('[data-act]').forEach(function (box) { box.innerHTML = actHTML(byH[box.getAttribute('data-act')]); });
    renderCart();
  }
  function renderCart() {
    if (!drawer) return;
    var list = $('.dr-list', drawer), tot = 0;
    if (!cart.length) {
      list.innerHTML = '<div class="empty"><p>Karfan er tóm.</p><a class="btn ghost" href="vorur.html">Skoða vörur</a></div>';
    } else {
      list.innerHTML = cart.map(function (l, i) {
        var p = byH[l.h], vi = Math.max(0, p.v.map(function (v) { return v.t; }).indexOf(l.vt)), v = p.v[vi]; tot += v.price * l.q;
        var photo = hasPhoto(p) && vi === p.pv;
        return '<div class="line"><span class="ph' + (photo ? '' : ' render') + '"><img src="' + (photo ? photoSrc(p) : renderSrc(p, vi)) + '" alt="" width="72" height="96"></span>' +
          '<div><a class="line-n" href="vara.html?h=' + p.h + '">' + esc(p.t) + '</a>' + (many(p) ? '<div class="line-v">' + esc(l.vt) + '</div>' : '') +
          '<div class="qty"><button type="button" data-dq="' + i + '" aria-label="Fækka: ' + esc(p.t) + '">' + ICON.minus + '</button><span>' + l.q + '</span><button type="button" data-iq="' + i + '" aria-label="Fjölga: ' + esc(p.t) + '">' + ICON.plus + '</button></div></div>' +
          '<div><div class="line-p">' + kr(v.price * l.q) + '</div><button class="rm" type="button" data-rm="' + i + '">Fjarlægja</button></div></div>';
      }).join('');
    }
    $('.dr-total', drawer).textContent = kr(tot);
    $('.dr-go', drawer).disabled = !cart.length;
  }
  function trap(box, e) {
    var f = $$('a[href], button:not([disabled]), input, select', box).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  var lockY = 0;
  function lock(on) {
    if (on) { lockY = scrollY; document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
  }
  function openCart(e) {
    lastTrigger = e && e.currentTarget || null;
    drawer.hidden = false; scrim.hidden = false;
    requestAnimationFrame(function () { drawer.classList.add('on'); scrim.classList.add('on'); });
    lock(true);
    $$('.cart-btn').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    var viaKey = e && e.detail === 0, first = $('.x', drawer);
    (viaKey && first ? first : drawer).focus({ preventScroll: true });
  }
  function closeCart() {
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove('on'); scrim.classList.remove('on');
    $$('.cart-btn').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    lock(false);
    setTimeout(function () { if (!drawer.classList.contains('on')) { drawer.hidden = true; scrim.hidden = true; } }, reduce ? 0 : 520);
    if (lastTrigger && lastTrigger.focus) lastTrigger.focus({ preventScroll: true });
  }
  if (drawer) {
    $$('.cart-btn').forEach(function (b) { b.addEventListener('click', openCart); });
    $('.x', drawer).addEventListener('click', closeCart);
    scrim.addEventListener('click', closeCart);
    drawer.addEventListener('keydown', function (e) { if (e.key === 'Tab') trap(drawer, e); });
    drawer.addEventListener('click', function (e) {
      var t = e.target.closest('[data-dq],[data-iq],[data-rm]'); if (!t) return;
      var i = +(t.dataset.dq || t.dataset.iq || t.dataset.rm), l = cart[i]; if (!l) return;
      var removed = t.dataset.rm || (t.dataset.dq && l.q === 1);
      setQty(l.h, l.vt, t.dataset.rm ? 0 : l.q + (t.dataset.iq ? 1 : -1));
      if (removed) drawer.focus({ preventScroll: true });
      else { var again = $('[data-' + (t.dataset.iq ? 'iq' : 'dq') + '="' + i + '"]', drawer); if (again) again.focus({ preventScroll: true }); }
    });
    $('.dr-go', drawer).addEventListener('click', function () { $('.dr-msg', drawer).textContent = 'Þetta er frumgerð: greiðsla er ekki tengd og ekkert er pantað.'; });
  }

  /* the home wordmark is still large over the hero until it docks: hide it while a menu covers the page */
  function logoOff(on) { document.documentElement.classList.toggle('logo-off', !!on && document.body.classList.contains('home') && scrollY < innerHeight * .6); }

  /* ---------- menu ---------- */
  var mnav = $('#mnav'), menuBtn = $('.menu-btn');
  function closeMenu() {
    if (!mnav || mnav.hidden) return;
    var go = function () { mnav.hidden = true; };
    if (G && !reduce) G.to(mnav, { opacity: 0, duration: .25, onComplete: go }); else go();
    menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Opna valmynd'); logoOff(false);
    lock(false); menuBtn.focus({ preventScroll: true });
  }
  if (mnav && menuBtn) {
    menuBtn.addEventListener('click', function (e) {
      if (!mnav.hidden) { closeMenu(); return; }
      mnav.hidden = false; lock(true); logoOff(true);
      menuBtn.setAttribute('aria-expanded', 'true'); menuBtn.setAttribute('aria-label', 'Loka valmynd');
      var links = $$('nav a', mnav);
      if (G && !reduce) {
        G.fromTo(mnav, { opacity: 0 }, { opacity: 1, duration: .3 });
        G.fromTo(links, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .6, stagger: .04, ease: 'power3.out' });
      }
      (e.detail === 0 ? links[0] : mnav).focus({ preventScroll: true });
    });
    mnav.addEventListener('keydown', function (e) { if (e.key === 'Tab') { var box = mnav; var f = [menuBtn].concat($$('a', box)); var i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } } });
    matchMedia('(min-width: 981px)').addEventListener('change', function (m) { if (m.matches) closeMenu(); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeCart(); closeMenu(); closeMega(true); } });

  /* ---------- shop menu (every category in one panel) ---------- */
  var mega = $('#mega'), shopBtn = $('.shop-btn');
  function closeMega(refocus) {
    if (!mega || mega.hidden) return;
    shopBtn.setAttribute('aria-expanded', 'false'); logoOff(false);
    var go = function () { mega.hidden = true; };
    if (G && !reduce) G.to(mega, { opacity: 0, y: -6, duration: .2, ease: 'power2.in', overwrite: true, onComplete: go }); else go();
    if (refocus && mega.contains(document.activeElement)) shopBtn.focus({ preventScroll: true });
  }
  if (mega && shopBtn) {
    $('.mega-grid', mega).innerHTML = CATS.map(function (c) { return c.k; }).concat(['all']).map(function (k) {
      var p = byH[CAT_IMG[k]], href = k === 'all' ? 'vorur.html' : 'vorur.html?c=' + k;
      return '<a class="mega-c" href="' + href + '">' + ph(p) + '<span><b>' + esc(k === 'all' ? 'Allar vörur' : catLabel[k]) + '</b><span class="n">' + nVara(countIn(k)) + '</span></span></a>';
    }).join('');
    shopBtn.addEventListener('click', function (e) {
      if (!mega.hidden && shopBtn.getAttribute('aria-expanded') === 'true') { closeMega(); return; }
      closeCart(); mega.hidden = false; shopBtn.setAttribute('aria-expanded', 'true'); logoOff(true);
      if (G && !reduce) {
        G.fromTo(mega, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: .35, ease: 'power3.out', overwrite: true });
        G.fromTo($$('.mega-c', mega), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .45, stagger: .03, ease: 'power3.out' });
      }
      (e.detail === 0 ? $('.mega-c', mega) : mega).focus({ preventScroll: true });
    });
    document.addEventListener('click', function (e) { if (!mega.hidden && !mega.contains(e.target) && !shopBtn.contains(e.target)) closeMega(); });
    mega.addEventListener('focusout', function (e) { if (e.relatedTarget && !mega.contains(e.relatedTarget) && e.relatedTarget !== shopBtn) closeMega(); });
    matchMedia('(max-width: 980px)').addEventListener('change', function (m) { if (m.matches) closeMega(); });
  }

  /* ---------- header + nav state ---------- */
  var hdr = $('#hdr'), isHome = document.body.classList.contains('home');
  function hdrState() { if (hdr) hdr.classList.toggle('solid', scrollY > (isHome ? innerHeight * .75 : 30)); }
  addEventListener('scroll', hdrState, { passive: true }); hdrState();
  (function () {
    var c = new URLSearchParams(location.search).get('c'), page = location.pathname.split('/').pop() || 'index.html';
    var key = page === 'vorur.html' ? (c || 'vorur') : page === 'vara.html' && byH[new URLSearchParams(location.search).get('h')] ? byH[new URLSearchParams(location.search).get('h')].cat : '';
    $$('.pills a').forEach(function (a) { if (a.dataset.nav === key) a.setAttribute('aria-current', 'page'); });
  })();

  /* ---------- cards ---------- */
  function actHTML(p) {
    if (!p.avail) return '<button class="bk" type="button" disabled>Uppselt</button>';
    if (many(p)) return '<a class="bk" href="vara.html?h=' + p.h + '" aria-label="Velja ' + esc(p.opts.map(function (o) { return o.name.toLowerCase(); }).join(' og ')) + ': ' + esc(p.t) + '">Velja ' + ICON.arrow + '</a>';
    var l = lineOf(p.h, p.v[0].t);
    if (l) return '<div class="qty"><button type="button" data-cq="-1" data-h="' + p.h + '" aria-label="Fækka: ' + esc(p.t) + '">' + ICON.minus + '</button><span aria-live="polite">' + l.q + ' í körfu</span><button type="button" data-cq="1" data-h="' + p.h + '" aria-label="Fjölga: ' + esc(p.t) + '">' + ICON.plus + '</button></div>';
    return '<button class="bk" type="button" data-add="' + p.h + '">Í körfu ' + ICON.plus + '</button>';
  }
  function pc(p) {
    return '<article class="pc" data-h="' + p.h + '">' + '<a class="ph-l" href="vara.html?h=' + p.h + '" tabindex="-1" aria-hidden="true">' + ph(p) + '</a>' + badge(p) +
      '<div class="pc-b"><span class="pc-c">' + esc(catLabel[p.cat] || '') + '</span><h3 class="pc-n"><a href="vara.html?h=' + p.h + '">' + esc(p.t) + '</a></h3>' +
      '<span class="pc-p">' + priceHTML(p) + '</span><div class="pc-a" data-act="' + p.h + '">' + actHTML(p) + '</div></div></article>';
  }
  function dc(p) {
    var act = many(p) || !p.avail
      ? '<a class="plus" href="vara.html?h=' + p.h + '" aria-label="Velja: ' + esc(p.t) + '">' + ICON.arrow + '</a>'
      : '<button class="plus" type="button" data-quick="' + p.h + '" aria-label="Setja ' + esc(p.t) + ' í körfu">' + ICON.plus + '</button>';
    return '<article class="dc">' + ph(p) + '<div class="dc-b"><div><h3 class="dc-n"><a href="vara.html?h=' + p.h + '">' + esc(p.t) + '</a></h3><span class="dc-p">' + priceHTML(p) + '</span></div>' + act + '</div></article>';
  }
  function arch(p) { return '<a class="arch" href="vara.html?h=' + p.h + '">' + ph(p) + '<span class="arch-n">' + esc(p.t) + '</span><span class="arch-p">' + priceHTML(p) + '</span></a>'; }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-add]');
    if (a) { var p = byH[a.dataset.add]; add(p.h, p.v[0].t, 1); var box = $('[data-act="' + p.h + '"] button', a.closest('.pc') || document); if (box) box.focus({ preventScroll: true }); return; }
    var c = e.target.closest('[data-cq]');
    if (c) {
      var q = byH[c.dataset.h], l = lineOf(q.h, q.v[0].t), d = +c.dataset.cq, wrap = c.closest('.pc-a');
      setQty(q.h, q.v[0].t, (l ? l.q : 0) + d); if (d > 0) bump();
      var nb = wrap && ($('[data-cq="' + d + '"]', wrap) || $('button', wrap)); if (nb) nb.focus({ preventScroll: true });
      return;
    }
    var k = e.target.closest('[data-quick]');
    if (k) {
      var r = byH[k.dataset.quick]; add(r.h, r.v[0].t, 1);
      k.classList.add('ok'); k.innerHTML = ICON.check; k.setAttribute('aria-label', r.t + ' er komið í körfu');
      clearTimeout(k._t); k._t = setTimeout(function () { k.classList.remove('ok'); k.innerHTML = ICON.plus; k.setAttribute('aria-label', 'Setja ' + r.t + ' í körfu'); }, 1400);
    }
  });

  /* ---------- tabs with a sliding pill ---------- */
  function tabs(box, onPick) {
    var ind = $('.tab-ind', box), btns = $$('[role="tab"]', box);
    function place(b, instant) {
      if (!ind || !b) return;
      var x = b.offsetLeft, w = b.offsetWidth;
      if (G && !instant && !reduce) G.to(ind, { x: x, width: w, duration: .55, ease: 'power3.out', overwrite: true });
      else { ind.style.transform = 'translateX(' + x + 'px)'; ind.style.width = w + 'px'; }
    }
    function pick(b, focus) {
      btns.forEach(function (x) { var on = x === b; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; });
      place(b); if (focus) b.focus(); onPick(b.dataset.tab);
      if (b.scrollIntoView && box.scrollWidth > box.clientWidth) b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
    }
    btns.forEach(function (b) {
      b.tabIndex = b.getAttribute('aria-selected') === 'true' ? 0 : -1;
      b.addEventListener('click', function () { if (b.getAttribute('aria-selected') !== 'true') pick(b); });
      b.addEventListener('keydown', function (e) {
        var i = btns.indexOf(b), n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (n) { e.preventDefault(); pick(btns[(i + n + btns.length) % btns.length], true); }
      });
    });
    var cur = function () { return btns.filter(function (b) { return b.getAttribute('aria-selected') === 'true'; })[0]; };
    var set = function () { place(cur(), true); };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(set);
    addEventListener('resize', set);
    return { pick: pick, btns: btns };
  }
  function swapGrid(grid, html) {
    if (!G || reduce || !grid.children.length) { grid.innerHTML = html; return; }
    var old = Array.prototype.slice.call(grid.children);
    G.to(old, { opacity: 0, y: 10, duration: .2, stagger: .015, overwrite: true, onComplete: function () {
      grid.innerHTML = html;
      G.fromTo(grid.children, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .6, stagger: .045, ease: 'power3.out', clearProps: 'transform' });
      if (ST) ST.refresh();
    } });
  }

  /* ---------- rail (drag + arrows) ---------- */
  function rail(el, prev, next) {
    if (!el) return;
    var step = function () { var c = el.children[0]; return c ? (c.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || 16)) * (innerWidth < 760 ? 1 : 2) : 300; };
    var upd = function () { if (prev) prev.disabled = el.scrollLeft < 4; if (next) next.disabled = el.scrollLeft > el.scrollWidth - el.clientWidth - 4; };
    if (prev) prev.addEventListener('click', function () { el.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }); });
    if (next) next.addEventListener('click', function () { el.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }); });
    el.addEventListener('scroll', upd, { passive: true }); upd(); addEventListener('resize', upd);
    var sx = 0, sl = 0, down = false, moved = false;
    el.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = true; moved = false; sx = e.clientX; sl = el.scrollLeft; });
    addEventListener('pointermove', function (e) {
      if (!down) return; var dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 5) { moved = true; el.classList.add('drag'); }
      if (moved) el.scrollLeft = sl - dx;
    });
    addEventListener('pointerup', function () {
      if (!down) return; down = false;
      if (moved) {
        var w = el.children[0] ? el.children[0].getBoundingClientRect().width + 16 : 300, target = Math.round(el.scrollLeft / w) * w;
        el.classList.remove('drag'); el.scrollTo({ left: target, behavior: reduce ? 'auto' : 'smooth' });
      }
    });
    el.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    el.addEventListener('keydown', function (e) { if (e.target === el && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); el.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * step() / 2, behavior: reduce ? 'auto' : 'smooth' }); } });
  }

  /* ---------- reveals ---------- */
  function reveals(sel) {
    var els = $$(sel); if (!els.length) return;
    els.forEach(function (e) { e.classList.add('rv'); });
    if (!G || !ST || reduce) { els.forEach(function (e) { e.style.opacity = 1; }); return; }
    G.set(els, { y: 28 });
    ST.batch(els, { start: 'top 90%', once: true, onEnter: function (b) { G.to(b, { opacity: 1, y: 0, duration: .9, stagger: .07, ease: 'power3.out', overwrite: true, clearProps: 'transform' }); } });
  }

  /* ---------- quick buy (pick flavour + size, add straight to the basket) ---------- */
  function quickBuy(p, root, stage) {
    if (!p || !root) return;
    var img = $('.spot-img', stage), vByT = {}; p.v.forEach(function (v, i) { vByT[v.t] = i; });
    var vi = p.v[p.pv] && p.v[p.pv].avail ? p.pv : Math.max(0, p.v.findIndex(function (v) { return v.avail; }));
    var sel = p.opts.length ? p.v[vi].t.split(' / ') : [], qn = 1;
    var name = p.t.replace(/\s+\d[\d.,]*\s*(g|kg).*$/i, '');
    root.innerHTML = '<p class="kick">Í sviðsljósinu</p><h2 class="h1" id="spot-t">' + esc(name) + '</h2><p class="spot-p">' + esc(short(p)) + '</p>' +
      p.opts.map(function (o, oi) {
        return '<div class="opt" role="group" aria-labelledby="qo' + oi + '"><span class="lbl" id="qo' + oi + '">' + esc(o.name) + ': <span class="ov"></span></span><div class="opt-v">' +
          o.values.map(function (v) { return '<button type="button" data-o="' + oi + '" data-val="' + esc(v) + '">' + esc(v) + '</button>'; }).join('') + '</div></div>';
      }).join('') +
      '<div class="buy"><span class="price-l" data-q-price></span><div class="qty"><button type="button" data-qq="-1" aria-label="Fækka">' + ICON.minus + '</button><span data-q-n>1</span><button type="button" data-qq="1" aria-label="Fjölga">' + ICON.plus + '</button></div><button class="btn red" type="button" data-q-add>Setja í körfu</button></div>' +
      '<p class="avail" data-q-av role="status" aria-live="polite"></p><a class="more-l" href="vara.html?h=' + p.h + '">Allar upplýsingar og innihald ' + ICON.arrow + '</a>';
    function idxFor(s2) { var t = s2.length ? s2.join(' / ') : p.v[0].t; return t in vByT ? vByT[t] : -1; }
    function swap(i) {
      var photo = hasPhoto(p) && i === p.pv, src = photo ? photoSrc(p, true) : renderSrc(p, i);
      if (img.getAttribute('src') === src) return;
      var go = function () { stage.classList.toggle('render', !photo); img.src = src; };
      if (!G || reduce) { go(); return; }
      G.to(img, { opacity: 0, scale: .97, duration: .2, ease: 'power2.in', overwrite: true, onComplete: function () { go(); G.fromTo(img, { opacity: 0, scale: 1.03 }, { opacity: 1, scale: 1, duration: .55, ease: 'power3.out' }); } });
    }
    function state(anim) {
      var i = idxFor(sel); if (i < 0) i = vi; vi = i; var v = p.v[i];
      $('[data-q-price]', root).textContent = kr(v.price * qn); $('[data-q-n]', root).textContent = qn;
      var b = $('[data-q-add]', root); b.disabled = !v.avail; b.textContent = v.avail ? 'Setja í körfu' : 'Uppselt';
      var av = $('[data-q-av]', root); av.textContent = v.avail ? 'Til á lager · sent á 1–2 virkum dögum' : 'Þessi útgáfa er uppseld. Veldu aðra.'; av.classList.toggle('no', !v.avail);
      $$('.opt', root).forEach(function (g, oi) {
        $('.ov', g).textContent = sel[oi];
        $$('button', g).forEach(function (bt) { var s2 = sel.slice(); s2[oi] = bt.dataset.val; var k = idxFor(s2); bt.setAttribute('aria-pressed', bt.dataset.val === sel[oi]); bt.classList.toggle('na', k < 0 || !p.v[k].avail); });
      });
      if (anim !== false) swap(i);
    }
    root.addEventListener('click', function (e) {
      var o = e.target.closest('[data-o]');
      if (o) { var oi = +o.dataset.o, s2 = sel.slice(); s2[oi] = o.dataset.val; if (idxFor(s2) < 0) { var m = p.v.findIndex(function (v) { return v.t.split(' / ')[oi] === o.dataset.val; }); if (m > -1) s2 = p.v[m].t.split(' / '); } sel = s2; state(); return; }
      var q = e.target.closest('[data-qq]'); if (q) { qn = Math.max(1, Math.min(20, qn + +q.dataset.qq)); state(false); return; }
      var a = e.target.closest('[data-q-add]');
      if (a) { add(p.h, p.v[vi].t, qn); a.innerHTML = ICON.check + ' Komið í körfu'; clearTimeout(a._t); a._t = setTimeout(function () { state(false); }, 1500); }
    });
    state(false);
  }

  /* ---------- HOME ---------- */
  function home() {
    var grid = $('#best-grid');
    var bestFor = function (k) { return photoFirst(P.filter(function (p) { return inCat(p, k); })).slice(0, 8).map(pc).join(''); };
    grid.innerHTML = bestFor('all');
    tabButtons($('.best .tabs'), 'all');
    tabs($('.best .tabs'), function (k) { swapGrid(grid, bestFor(k)); });

    var news = P.filter(function (p) { return p.new; });
    $('#new-rail').innerHTML = photoFirst(news).map(pc).join('');
    rail($('#new-rail'), $('.deals .prev'), $('.deals .next'));

    var photos = PHOTO.map(function (h) { return byH[h]; }).filter(Boolean), cols = $$('.cols .col'), nCols = 0;
    function buildCols() {
      var n = innerWidth <= 860 ? 2 : 3; if (n === nCols) return; nCols = n;
      var buckets = [[], [], []]; photos.forEach(function (p, i) { buckets[i % n].push(dc(p)); });
      cols.forEach(function (c, i) { c.innerHTML = buckets[i].join(''); });
      if (ST) ST.refresh();
    }
    buildCols(); addEventListener('resize', buildCols);

    $('.spot .arches').innerHTML = ['gold-whey', 'protein-80-plus', 'plant-based-protein'].map(function (h) { return arch(byH[h]); }).join('');
    var GOALS = [
      ['protein', 'Byggja upp', 'Prótein fyrir og eftir æfingu', 'premium-whey'],
      ['kreatin', 'Meiri kraftur', 'Kreatín í dufti, töflum og gúmmíi', 'micronized-creatine'],
      ['pre', 'Orka á æfingu', 'Pre-workout og orkudrykkir', 'total-rush'],
      ['amino', 'Endurheimt', 'BCAA, EAA og glútamín', 'premium-bcaa-8-1-1-l-glutamine-500gr'],
      ['vitamin', 'Daglega heilsan', 'Vítamín, steinefni og omega', 'omega-3-superior'],
      ['snarl', 'Á ferðinni', 'Próteinstykki, snarl og drykkir', 'whey-wafer']
    ];
    $('#goal-row').innerHTML = GOALS.map(function (g) {
      return '<a class="goal" href="vorur.html?c=' + g[0] + '">' + ph(byH[g[3]]) + '<span class="goal-t"><b>' + esc(g[1]) + '</b><span>' + esc(g[2]) + '</span><small>' + nVara(countIn(g[0])) + '</small></span><i class="goal-a" aria-hidden="true">' + ICON.arrow + '</i></a>';
    }).join('');
    quickBuy(byH['premium-whey'], $('#quick'), $('.spot-l'));

    heroIntro();
    if (G && ST && !reduce) {
      // the cream sheet slides over the sticky hero: hero sinks and darkens underneath (video: panel slides up)
      G.timeline({ scrollTrigger: { trigger: '.sheet', start: 'top bottom', end: 'top top', scrub: .6 } })
        .to('.hero-shade', { opacity: .75, ease: 'none' }, 0)
        .to('.hero-stage', { scale: .93, yPercent: -4, ease: 'none' }, 0);
      // sliding product columns: outer columns rise, middle column sinks
      var amp = function () { return innerWidth <= 860 ? 5 : 9; };
      [['.c1', 1], ['.c2', -1.3], ['.c3', 1.5]].forEach(function (c) {
        G.fromTo(c[0], { yPercent: function () { return amp() * c[1]; } }, { yPercent: function () { return -amp() * c[1]; }, ease: 'none',
          scrollTrigger: { trigger: '.cols-wrap', start: 'top bottom', end: 'bottom top', scrub: .9, invalidateOnRefresh: true } });
      });
      G.fromTo('.spot-img', { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.spot', start: 'top bottom', end: 'bottom bottom', scrub: .6 } });
    }
    reveals('.svc li, .best .sec-h, .best .tabs, .deal-tile, .cols-h > *, .spot-top, .spot-rel, .stat, .goals .sec-h, .goal');
  }

  function heroIntro() {
    var hero = $('.hero'); if (!hero) return;
    var main = $('.hero-main'), img = $('img', main), frame = $('.hero-frame');
    var cards = $$('.hero-card'), ui = $$('.hero-ui > *'), logoA = $('.logo'), logoIn = $('.logo-in'), logoImg = $('.logo img');
    var chrome = $$('.pills, .hdr-r');
    var settled = false;
    function rect() {
      var s = hero.getBoundingClientRect(), f = frame.getBoundingClientRect();
      return { '--ct': (f.top - s.top) + 'px', '--cr': (s.right - f.right) + 'px', '--cb': (s.bottom - f.bottom) + 'px', '--cl': (f.left - s.left) + 'px', '--cr0': '28px' };
    }
    function settle() { var r = rect(); for (var k in r) main.style.setProperty(k, r[k]); }
    addEventListener('resize', function () { if (settled) settle(); });
    if (!G || reduce) { settled = true; settle(); hero.classList.add('go'); return; }

    // the header wordmark starts large in the middle of the hero and glides into its place in the header as you scroll
    function big() {
      var n = logoA.getBoundingClientRect(), phone = innerWidth <= 760;
      var w = phone ? innerWidth * .8 : Math.min(innerWidth * .52, 860);
      w = Math.min(w, innerHeight * .24 * (n.width / n.height)); // short screens (phone landscape): never taller than ~a quarter of the view
      var s = w / n.width, h = n.height * s;
      var cy = phone ? (innerHeight * .29 + 76) / 2 + 6 : innerHeight * .5;
      cy = Math.max(cy, 76 + h / 2 + 12); // keep it clear of the header icons
      return { x: innerWidth / 2 - w / 2 - n.left, y: cy - n.height * s / 2 - n.top, scale: s };
    }
    // the small "Weider — síðan 1936" line steps aside as the wordmark starts to move
    G.to('.hero-k', { opacity: 0, y: -10, ease: 'none', scrollTrigger: { start: 0, end: function () { return innerHeight * .15; }, scrub: .3 } });
    G.fromTo(logoImg, { x: function () { return big().x; }, y: function () { return big().y; }, scale: function () { return big().scale; } },
      { x: 0, y: 0, scale: 1, ease: 'power1.inOut', scrollTrigger: { start: 0, end: function () { return innerHeight * .6; }, scrub: .5, invalidateOnRefresh: true } });

    G.set(main, { '--ct': '0px', '--cr': '0px', '--cb': '0px', '--cl': '0px', '--cr0': '0px' });
    G.set(img, { scale: 1.2 });
    G.set(logoIn, { opacity: 0, y: 40 });
    // start every card fully below the viewport (measured), invisible, so nothing peeks in during the intro
    G.set(cards, { autoAlpha: 0, y: function (i, el) { return innerHeight - el.getBoundingClientRect().top + 80 + i * 60; }, rotate: function (i) { return i ? 6 : -6; } });
    G.set(ui, { opacity: 0, y: 18 });
    G.set(chrome, { opacity: 0 });
    hero.classList.add('go');
    var ready = Promise.race([Promise.all([document.fonts ? document.fonts.ready : 0, img.decode ? img.decode().catch(function () {}) : 0]), new Promise(function (r) { setTimeout(r, 1200); })]);
    ready.then(function () {
      var r = rect();
      var tl = G.timeline({ onComplete: function () {
        settled = true; settle();
        G.to(img, { scale: 1.06, duration: 11, ease: 'sine.inOut', yoyo: true, repeat: -1 }); // hold with a slow drift (video)
        cards.forEach(function (c, i) { G.to(c, { y: i ? 9 : -9, duration: 3.8 + i * .7, ease: 'sine.inOut', yoyo: true, repeat: -1 }); }); // floating
      } });
      tl.to(img, { scale: 1.08, duration: 1.6, ease: 'power2.out' }, 0)
        .to(logoIn, { opacity: 1, y: 0, duration: 1.3, ease: 'power4.out' }, .25)
        .to(main, Object.assign({ duration: 1.5, ease: 'expo.inOut' }, r), 1.05)
        .to(img, { scale: 1, duration: 1.5, ease: 'expo.inOut' }, 1.05)
        .to(cards, { y: 0, rotate: 0, duration: 1.4, stagger: .14, ease: 'power3.out' }, 1.75)
        .to(cards, { autoAlpha: 1, duration: .5, stagger: .14, ease: 'power1.out' }, 1.75)
        .to(chrome, { opacity: 1, duration: .8, ease: 'power2.out', clearProps: 'opacity' }, 1.9)
        .to(ui, { opacity: 1, y: 0, duration: .9, stagger: .09, ease: 'power3.out' }, 2.05);
    });
    // pointer parallax on the floating cards (mouse only)
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var qx = cards.map(function (c) { return G.quickTo(c, 'x', { duration: .9, ease: 'power3' }); });
      var qr = cards.map(function (c) { return G.quickTo(c, 'rotation', { duration: .9, ease: 'power3' }); });
      hero.addEventListener('pointermove', function (e) {
        var dx = e.clientX / innerWidth - .5;
        cards.forEach(function (c, i) { var d = i ? -1 : 1; qx[i](dx * 26 * d); qr[i](dx * 2.4 * d); });
      });
      hero.addEventListener('pointerleave', function () { qx.forEach(function (q) { q(0); }); qr.forEach(function (q) { q(0); }); });
    }
  }

  /* ---------- SHOP ---------- */
  function shop() {
    var grid = $('#shop-grid'), box = $('#shop-tabs'), q = $('#leit'), sort = $('#sort'), out = $('#shop-n');
    var params = new URLSearchParams(location.search), cat = params.get('c');
    if (!catLabel[cat]) cat = 'all';
    tabButtons(box, cat);
    if (params.get('q')) q.value = params.get('q');
    var clr = $('.sclear'), F = {};
    function list() {
      var t = q.value.trim(), s = sort.value;
      var l = t ? find(t).map(function (r) { return r.p; }) : (s === 'pop' ? photoFirst(P) : P.slice());
      l = l.filter(function (p) { return inCat(p, cat) && (!F.stock || p.avail) && (!F.new || p.new) && (!F.vegan || p.vegan); });
      if (s === 'new') l.sort(function (a, b) { return b.new - a.new; });
      if (s === 'lo') l.sort(function (a, b) { return a.price - b.price; });
      if (s === 'hi') l.sort(function (a, b) { return b.price - a.price; });
      if (s === 'az') l.sort(function (a, b) { return a.t.localeCompare(b.t, 'is'); });
      return l;
    }
    function draw(anim) {
      var l = list();
      out.textContent = nVara(l.length) + (cat !== 'all' ? ' í ' + catLabel[cat].toLowerCase() : '') + (q.value.trim() ? ' fyrir „' + q.value.trim() + '“' : '');
      var html = l.length ? l.map(pc).join('') : '<p class="none">Engin vara passar. Prófaðu annað leitarorð eða taktu síu af.</p>';
      if (anim) swapGrid(grid, html); else grid.innerHTML = html;
      document.title = (cat !== 'all' ? catLabel[cat] : 'Vörur') + ' · Weider á Íslandi';
      $('#shop-t').textContent = cat !== 'all' ? catLabel[cat] : 'Vörur';
    }
    tabs(box, function (k) {
      cat = k; var u = new URL(location.href); if (k === 'all') u.searchParams.delete('c'); else u.searchParams.set('c', k);
      history.replaceState(null, '', u); draw(true);
      $$('.pills a').forEach(function (a) { a.toggleAttribute('aria-current', a.dataset.nav === (k === 'all' ? 'vorur' : k)); if (a.hasAttribute('aria-current')) a.setAttribute('aria-current', 'page'); });
    });
    var tq; q.addEventListener('input', function () { clr.hidden = !q.value; clearTimeout(tq); tq = setTimeout(function () { draw(true); }, 160); });
    clr.hidden = !q.value;
    clr.addEventListener('click', function () { q.value = ''; clr.hidden = true; draw(true); q.focus(); });
    $$('.fchip').forEach(function (c) { c.addEventListener('click', function () { var on = c.getAttribute('aria-pressed') !== 'true'; c.setAttribute('aria-pressed', on); F[c.dataset.f] = on; draw(true); }); });
    sort.addEventListener('change', function () { draw(true); });
    draw(false);
    if (location.hash === '#leit') addEventListener('load', function () { setTimeout(function () { q.focus({ preventScroll: true }); }, 0); });
    if (G && !reduce) G.from('.top .h1', { yPercent: 40, opacity: 0, duration: 1.1, ease: 'power4.out' });
  }

  /* ---------- PRODUCT ---------- */
  function stats(p) {
    var b = p.body || '', out = [];
    var per = /per 100\s*g/i.test(b) ? 'í 100 g' : '';
    var pr = b.match(/Prótein:\s*(?:<strong>)?\s*([\d.,]+)\s*g/i), en = b.match(/([\d.]+)\s*kcal/i);
    if (pr && per) out.push(['Prótein', pr[1], 'g', per]);
    if (en && per) out.push(['Orka', en[1], 'kcal', per]);
    if (!out.length && p.opts.length) p.opts.slice(0, 2).forEach(function (o) { out.push([o.name, String(o.values.length), '', o.values.length === 1 ? 'útgáfa' : 'útgáfur']); });
    if (!out.length) return '';
    return '<div class="stat">' + out.map(function (s) { return '<p><span class="lbl">' + esc(s[0]) + '</span><strong>' + esc(s[1]) + (s[2] ? '<small>' + s[2] + '</small>' : '') + '</strong><span class="per">' + s[3] + '</span></p>'; }).join('') + '</div>';
  }
  function short(p) {
    var d = document.createElement('div'); d.innerHTML = p.body || '';
    var first = $$('p', d).map(function (x) { return x.textContent.trim(); }).filter(function (t) { return t.length > 40 && !/^•/.test(t); })[0] || '';
    if (first.length > 260) { var cut = first.slice(0, 260), dot = cut.lastIndexOf('. '); first = dot > 120 ? cut.slice(0, dot + 1) : cut.replace(/\s+\S*$/, '') + '…'; }
    return first;
  }
  function product() {
    var h = new URLSearchParams(location.search).get('h'), p = byH[h], media = $('#pdp-m'), info = $('#pdp-i');
    if (!p) {
      info.innerHTML = '<p class="kick">Vara fannst ekki</p><h1 class="h1">Hmm.</h1><p class="pdp-s">Þessi vara er ekki lengur til eða slóðin er röng.</p><p style="margin-top:24px"><a class="btn red" href="vorur.html">Skoða allar vörur</a></p>';
      media.innerHTML = ''; $('.more').hidden = true; return;
    }
    document.title = p.t + ' · Weider á Íslandi';
    var md = document.querySelector('meta[name="description"]'); if (md) md.setAttribute('content', short(p).slice(0, 155));
    $('#crumb-p').textContent = p.t; var cc = $('#crumb-c'); cc.textContent = catLabel[p.cat]; cc.href = 'vorur.html?c=' + p.cat;
    var vi = p.v[p.pv] && p.v[p.pv].avail ? p.pv : Math.max(0, p.v.findIndex(function (v) { return v.avail; }));
    var sel = p.opts.length ? p.v[vi].t.split(' / ') : [];
    var qn = 1;
    function srcFor(i) { return hasPhoto(p) && i === p.pv ? { s: photoSrc(p, true), photo: true } : { s: renderSrc(p, i), photo: false }; }
    var cur = srcFor(vi);
    var thumbs = [], seen = {};
    if (p.v.length > 1) p.v.forEach(function (v, i) { var s = srcFor(i).s; if (!seen[s]) { seen[s] = 1; thumbs.push(i); } });
    media.innerHTML = '<span class="ph' + (cur.photo ? '' : ' render') + '"><img src="' + cur.s + '" alt="' + esc(p.t) + '" width="1100" height="1467"></span>' + stats(p) +
      (thumbs.length > 1 ? '<div class="thumbs" role="group" aria-label="Útgáfur">' + thumbs.slice(0, 6).map(function (i) {
        return '<button type="button" data-v="' + i + '" aria-pressed="' + (i === vi) + '" aria-label="' + esc(p.v[i].t) + '"><img src="' + renderSrc(p, i) + '" alt="" loading="lazy"></button>';
      }).join('') + '</div>' : '');
    info.innerHTML = '<p class="kick">' + esc(catLabel[p.cat]) + '</p><h1 class="h1">' + esc(p.t) + '</h1><p class="pdp-s">' + esc(short(p)) + '</p>' +
      p.opts.map(function (o, oi) {
        return '<div class="opt" role="group" aria-labelledby="ol' + oi + '"><span class="lbl" id="ol' + oi + '">' + esc(o.name) + ': <span class="ov"></span></span><div class="opt-v">' +
          o.values.map(function (v) { return '<button type="button" data-o="' + oi + '" data-val="' + esc(v) + '">' + esc(v) + '</button>'; }).join('') + '</div></div>';
      }).join('') +
      '<div class="buy"><span class="price-l" id="pp"></span><div class="qty"><button type="button" data-pq="-1" aria-label="Fækka">' + ICON.minus + '</button><span id="pq">1</span><button type="button" data-pq="1" aria-label="Fjölga">' + ICON.plus + '</button></div><button class="btn red" type="button" id="padd">Setja í körfu</button></div>' +
      '<p class="avail" id="pa" role="status" aria-live="polite"></p>' +
      '<div class="acc">' + acc('Vörulýsing', p.body || '<p>Lýsing kemur fljótlega.</p>', true) + acc('Sending og skil', '<p>Sent með Dropp á 1–2 virkum dögum, um allt land.</p><p>14 daga skilaréttur.</p><p>Spurningar? Hringdu í <a href="tel:+3547700295">770 0295</a> eða sendu á <a href="mailto:weidervorur@gmail.com">weidervorur@gmail.com</a>.</p>', false) + '</div>';
    function acc(t, html, open) {
      var id = 'a' + Math.random().toString(36).slice(2, 7);
      return '<div class="acc-i"><button class="acc-b" type="button" aria-expanded="' + open + '" aria-controls="' + id + '">' + t + ICON.plus + '</button><div class="acc-p' + (open ? ' open' : '') + '" id="' + id + '"><div><div class="acc-in">' + html + '</div></div></div></div>';
    }
    var vByT = {}; p.v.forEach(function (v, i) { vByT[v.t] = i; });
    function idxFor(s) { var t = s.length ? s.join(' / ') : p.v[0].t; return t in vByT ? vByT[t] : -1; }
    var want = null; // the latest pick always wins, however fast options are clicked
    function show(i, animate) {
      var n = srcFor(i), box = $('.ph', media), im = $('img', box);
      if ((want ? want.s : im.getAttribute('src')) === n.s) return;
      want = n;
      var go = function () { box.className = 'ph' + (want.photo ? '' : ' render'); im.src = want.s; };
      if (!G || reduce || !animate) { go(); want = null; return; }
      G.to(im, { opacity: 0, x: -16, duration: .22, ease: 'power2.in', overwrite: true, onComplete: function () {
        go(); want = null;
        G.fromTo(im, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: .55, ease: 'power3.out', overwrite: true });
      } });
    }
    function state(animate) {
      var i = idxFor(sel); if (i < 0) i = vi; vi = i; var v = p.v[i];
      $('#pp').innerHTML = kr(v.price * qn);
      $('#pq').textContent = qn;
      var pa = $('#pa'), btn = $('#padd');
      btn.disabled = !v.avail; btn.textContent = v.avail ? 'Setja í körfu' : 'Uppselt';
      pa.textContent = v.avail ? 'Til á lager · sent á 1–2 virkum dögum' : (many(p) ? 'Þessi útgáfa er uppseld. Veldu aðra.' : 'Uppselt í bili.');
      pa.classList.toggle('no', !v.avail);
      $$('.opt', info).forEach(function (g, oi) {
        $('.ov', g).textContent = sel[oi];
        $$('button', g).forEach(function (b) {
          var s = sel.slice(); s[oi] = b.dataset.val; var k = idxFor(s);
          b.setAttribute('aria-pressed', b.dataset.val === sel[oi]);
          b.classList.toggle('na', k < 0 || !p.v[k].avail);
        });
      });
      $$('.thumbs button', media).forEach(function (b) { b.setAttribute('aria-pressed', srcFor(+b.dataset.v).s === srcFor(i).s); });
      show(i, animate);
    }
    info.addEventListener('click', function (e) {
      var o = e.target.closest('[data-o]');
      if (o) {
        var oi = +o.dataset.o, s = sel.slice(); s[oi] = o.dataset.val;
        if (idxFor(s) < 0) { var m = p.v.findIndex(function (v) { return v.t.split(' / ')[oi] === o.dataset.val; }); if (m > -1) s = p.v[m].t.split(' / '); }
        sel = s; state(true); return;
      }
      var q = e.target.closest('[data-pq]');
      if (q) { qn = Math.max(1, Math.min(20, qn + +q.dataset.pq)); state(false); return; }
      if (e.target.closest('#padd')) {
        var b = $('#padd'); add(p.h, p.v[vi].t, qn);
        b.innerHTML = ICON.check + ' Komið í körfu'; b.querySelector('svg').style.cssText = 'width:18px;height:18px';
        clearTimeout(b._t); b._t = setTimeout(function () { state(false); }, 1500);
        return;
      }
      var a = e.target.closest('.acc-b');
      if (a) { var open = a.getAttribute('aria-expanded') !== 'true'; a.setAttribute('aria-expanded', open); document.getElementById(a.getAttribute('aria-controls')).classList.toggle('open', open); }
    });
    media.addEventListener('click', function (e) { var t = e.target.closest('[data-v]'); if (!t) return; vi = +t.dataset.v; sel = p.opts.length ? p.v[vi].t.split(' / ') : []; state(true); });
    state(false);
    var rel = photoFirst(P.filter(function (x) { return x.h !== p.h && inCat(x, p.cat); }));
    if (rel.length < 4) rel = rel.concat(photoFirst(P.filter(function (x) { return x.h !== p.h && rel.indexOf(x) < 0 && hasPhoto(x); }))).slice(0, 4);
    $('#more').innerHTML = rel.slice(0, 4).map(arch).join('');
    var ma = $('#more-a'); ma.href = 'vorur.html?c=' + p.cat; ma.textContent = 'Sjá allt í ' + catLabel[p.cat].toLowerCase();
    if (G && !reduce) {
      G.from('.pdp-m .ph img', { scale: 1.08, opacity: 0, duration: 1.2, ease: 'power3.out' });
      G.from($$('.pdp-i > *'), { y: 22, opacity: 0, duration: .8, stagger: .06, ease: 'power3.out', delay: .1 });
    }
    reveals('.more .sec-h, .more .arch');
  }

  /* ---------- newsletter ---------- */
  $$('.news').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var i = $('input', f), m = $('.news-msg', f);
      m.textContent = i.checkValidity() && i.value ? 'Takk! Þetta er frumgerð, svo ekkert var skráð.' : 'Sláðu inn gilt netfang.';
    });
  });

  /* ---------- search engine (shared by the palette and the shop page) ---------- */
  var norm = function (s) { return String(s).toLowerCase().replace(/þ/g, 'th').replace(/æ/g, 'ae').replace(/ð/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var SYN = { kreatin: ['creatin'], creatin: ['kreatin'], creatine: ['kreatin'], protin: ['protein'], gummi: ['gumm'], gummies: ['gumm'], shaker: ['hristibrus'], hristibrusi: ['shaker'], vitamin: ['vitamin'], orka: ['pre', 'rush'], amino: ['amin', 'bcaa', 'eaa'] };
  function lev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) d[i] = [i];
    for (j = 0; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  var IDX = P.map(function (p) {
    var t = norm(p.t), fl = [];
    p.opts.forEach(function (o) { if (/bragð|geschmack/i.test(o.name)) o.values.forEach(function (v) { fl.push({ n: norm(v), raw: v }); }); });
    return { p: p, t: t, w: t.split(/[^a-z0-9]+/).filter(Boolean), f: fl, c: norm(p.cats.map(function (k) { return catLabel[k] || ''; }).join(' ')) };
  });
  function find(q) {
    var terms = norm(q).split(/\s+/).filter(Boolean); if (!terms.length) return [];
    var out = [];
    IDX.forEach(function (it) {
      var total = 0, flav = null;
      for (var k = 0; k < terms.length; k++) {
        var best = 0, vs = [terms[k]].concat(SYN[terms[k]] || []);
        vs.forEach(function (v) {
          var s = 0;
          if (it.w[0] && it.w[0].indexOf(v) === 0) s = 14;
          else if (it.w.some(function (w) { return w.indexOf(v) === 0; })) s = 10;
          else if (it.t.indexOf(v) > -1) s = 7;
          else {
            var fv = it.f.filter(function (x) { return x.n.indexOf(v) > -1; })[0];
            if (fv) { s = 5; flav = fv.raw; }
            else if (it.c.indexOf(v) > -1) s = 3;
            else if (v.length >= 4 && it.w.some(function (w) { return lev(v, w.slice(0, v.length)) <= 1; })) s = 2;
            else if (v.length >= 4) { var ft = it.f.filter(function (x) { return x.n.split(/\s+/).some(function (w) { return lev(v, w.slice(0, v.length)) <= 1 || lev(v, w) <= 1; }); })[0]; if (ft) { s = 2; flav = ft.raw; } }
          }
          if (s > best) best = s;
        });
        if (!best) return;
        total += best;
      }
      out.push({ p: it.p, flav: flav, s: total + (hasPhoto(it.p) ? .5 : 0) + (it.p.popular ? .3 : 0) + (it.p.avail ? .2 : 0) });
    });
    return out.sort(function (a, b) { return b.s - a.s; });
  }
  // highlight what matched, accent-insensitive, on the original text
  var ACC = { a: '[aáàä]', e: '[eéè]', i: '[ií]', o: '[oóö]', u: '[uúü]', y: '[yý]', d: '[dð]' };
  function mark(text, q) {
    var terms = norm(q).split(/\s+/).filter(function (t) { return t.length > 1; }); if (!terms.length) return esc(text);
    var src = terms.map(function (t) {
      return t.replace(/th|ae|[a-z0-9]|./g, function (c) { return c === 'th' ? '(?:th|þ)' : c === 'ae' ? '(?:ae|æ)' : ACC[c] || c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
    }).join('|');
    var re = new RegExp('(' + src + ')', 'gi'), html = '', last = 0, m;
    while ((m = re.exec(text))) { if (!m[0]) { re.lastIndex++; continue; } html += esc(text.slice(last, m.index)) + '<mark>' + esc(m[0]) + '</mark>'; last = m.index + m[0].length; }
    return html + esc(text.slice(last));
  }

  /* ---------- search palette (⌘K, /, header icon) ---------- */
  var srch = $('#srch');
  if (srch) (function () {
    var input = $('#sq'), body = $('#srch-b'), panel = $('.srch-p', srch), live = $('#srch-live'), trigger = null, act = -1, opts = [];
    var POPQ = ['Kreatín', 'Whey', 'Gúmmí', 'Pre-workout', 'Vanilla', 'Vegan'];
    var row = function (p, q, flav, i) {
      return '<li role="option" class="so" id="so-' + i + '" aria-selected="false" data-href="vara.html?h=' + p.h + '">' + ph(p, false, false) +
        '<span class="so-t"><b>' + mark(p.t, q) + '</b><small>' + esc(catLabel[p.cat] || '') + (flav ? ' · Bragð: ' + mark(flav, q) : '') + (!p.avail ? ' · <em>Uppselt</em>' : '') + '</small></span>' +
        '<span class="so-p">' + priceHTML(p) + '</span>' + ICON.arrow + '</li>';
    };
    var chips = function (title, list) { return '<p class="srch-h">' + title + '</p><div class="schips">' + list.map(function (c) { return '<button type="button" class="schip" data-q="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>'; };
    function render() {
      var q = input.value.trim(), html = '', i = 0;
      if (!q) {
        var pop = PHOTO.slice(0, 5).map(function (h) { return byH[h]; });
        html = chips('Vinsæl leit', POPQ) + '<p class="srch-h">Vinsælar vörur</p><ul class="so-l" role="listbox" id="srch-l" aria-label="Vinsælar vörur">' + pop.map(function (p) { return row(p, '', null, i++); }).join('') + '</ul>';
        live.textContent = '';
      } else {
        var res = find(q), nq = norm(q);
        var cats = CATS.filter(function (c) { return norm(c.label).indexOf(nq) > -1 || norm(SHORT[c.k] || '').indexOf(nq) === 0; });
        if (cats.length) html += '<p class="srch-h">Flokkar</p><div class="schips">' + cats.map(function (c) { return '<a class="schip cat" href="vorur.html?c=' + c.k + '">' + esc(c.label) + ' <span>' + countIn(c.k) + '</span></a>'; }).join('') + '</div>';
        if (res.length) {
          html += '<p class="srch-h">Vörur <span>' + res.length + '</span></p><ul class="so-l" role="listbox" id="srch-l" aria-label="Niðurstöður">' + res.slice(0, 7).map(function (r) { return row(r.p, q, r.flav, i++); }).join('') + '</ul>' +
            '<a class="so-all" id="so-' + (i++) + '" role="option" aria-selected="false" data-href="vorur.html?q=' + encodeURIComponent(q) + '" href="vorur.html?q=' + encodeURIComponent(q) + '">Sjá allar ' + nVara(res.length) + ' fyrir „' + esc(q) + '“ ' + ICON.arrow + '</a>';
        } else if (!cats.length) {
          html += '<div class="srch-none"><p>Ekkert fannst fyrir „' + esc(q) + '“.</p><p>Prófaðu styttra orð eða veldu hér:</p></div>' + chips('Vinsæl leit', POPQ);
        }
        live.textContent = res.length ? nVara(res.length) + ' fundust' : 'Ekkert fannst';
      }
      body.innerHTML = html;
      opts = $$('[role="option"]', body); act = -1; input.removeAttribute('aria-activedescendant');
      if (G && !reduce) G.fromTo(opts, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .35, stagger: .025, ease: 'power2.out', overwrite: true });
    }
    function setAct(i) {
      if (!opts.length) return;
      act = (i + opts.length) % opts.length;
      opts.forEach(function (o, k) { o.setAttribute('aria-selected', k === act); });
      input.setAttribute('aria-activedescendant', opts[act].id);
      opts[act].scrollIntoView({ block: 'nearest' });
    }
    function go(o) { if (o) location.href = o.getAttribute('data-href'); }
    function open(e, val) {
      if (!srch.hidden) return;
      trigger = e && e.currentTarget && e.currentTarget.focus ? e.currentTarget : document.activeElement;
      closeMega(); closeMenu(); closeCart();
      srch.hidden = false; lock(true);
      $$('.srch-btn').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
      input.value = val || ''; render();
      if (G && !reduce) {
        G.fromTo('.srch-scrim', { opacity: 0 }, { opacity: 1, duration: .3 });
        G.fromTo(panel, { opacity: 0, y: -14, scale: .985 }, { opacity: 1, y: 0, scale: 1, duration: .45, ease: 'power3.out' });
      }
      input.focus({ preventScroll: true });
    }
    function close() {
      if (srch.hidden) return;
      $$('.srch-btn').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      var done = function () { srch.hidden = true; lock(false); if (trigger && trigger.focus) trigger.focus({ preventScroll: true }); };
      if (G && !reduce) { G.to(panel, { opacity: 0, y: -8, duration: .18, ease: 'power2.in' }); G.to('.srch-scrim', { opacity: 0, duration: .2, onComplete: done }); } else done();
    }
    $$('.srch-btn').forEach(function (b) { b.addEventListener('click', open); });
    $('.srch-scrim', srch).addEventListener('click', close);
    $('.srch-x', srch).addEventListener('click', close);
    var t; input.addEventListener('input', function () { clearTimeout(t); t = setTimeout(render, 90); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setAct(act + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setAct(act - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); if (act > -1) go(opts[act]); else if (input.value.trim()) location.href = 'vorur.html?q=' + encodeURIComponent(input.value.trim()); }
    });
    body.addEventListener('click', function (e) {
      var c = e.target.closest('button.schip'); if (c) { input.value = c.getAttribute('data-q'); render(); input.focus(); return; }
      var o = e.target.closest('li[role="option"]'); if (o) go(o);
    });
    body.addEventListener('pointermove', function (e) { var o = e.target.closest('[role="option"]'); if (o && e.pointerType === 'mouse') { var i = opts.indexOf(o); if (i !== act) setAct(i); } });
    srch.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      if (e.key === 'Tab') trap(panel, e);
    });
    document.addEventListener('keydown', function (e) {
      var typing = /input|textarea|select/i.test((document.activeElement || {}).tagName || '') || (document.activeElement || {}).isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); srch.hidden ? open(null) : close(); }
      else if (e.key === '/' && !typing && srch.hidden) { e.preventDefault(); open(null); }
    });
  })();

  /* ---------- boot ---------- */
  syncCart();
  if (document.body.classList.contains('home')) home();
  if (document.body.classList.contains('shop')) shop();
  if (document.body.classList.contains('product')) product();
})();

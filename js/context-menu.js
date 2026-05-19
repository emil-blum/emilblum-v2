/* =====================================================
   EMIL BLUM — CUSTOM CONTEXT MENU
   Right-click anywhere: branded nav menu + message modal.
   Loaded dynamically by nav.js — works on every page.
   ===================================================== */

(function () {
  'use strict';

  /* ── Config ─────────────────────────────────────── */
  var CAL_URL    = 'https://cal.com/emil-blum/45min';
  var EJS_PK     = 'cijU6bF6jCaCq_Gvg';
  var EJS_SVC    = 'service_63g8jca';
  var EJS_TPL    = 'template_s99c2na';

  var PAGES = [
    { label: 'Featured', href: '/featured', sub: [
      { label: 'Hard Rock Hotels',       href: '/featured/hard-rock-hotel' },
      { label: 'Oxfam: Republic of You', href: '/featured/oxfam-republic-of-you' },
      { label: 'Daydream Believers',     href: '/featured/daydream-believers' },
      { label: 'Unseen',                 href: '/featured/unseen' },
      { label: 'FISGA',                  href: '/featured/fisga' },
      { label: 'Stewart Brewing',        href: '/featured/stewart-brewing' },
      { label: 'Game Masters',           href: '/featured/game-masters' }
    ]},
    { label: 'Code',    href: '/code' },
    { label: 'Art',     href: '/art' },
    { label: 'Moments', href: '/moments' },
    { label: 'Swarf',   href: '/swarf' },
    { label: 'About',   href: '/about' },
    { label: 'Play',    href: '/play' }
  ];

  /* ── Styles ─────────────────────────────────────── */
  function injectStyles() {
    var s = document.createElement('style');
    s.textContent = [
      /* ── Menu shell ── */
      '.ctx-menu{position:fixed;z-index:99998;background:var(--cream,#fffbf3);border:1px solid rgba(30,30,40,.12);border-radius:4px;box-shadow:0 8px 40px rgba(30,30,40,.14),0 2px 8px rgba(30,30,40,.06);padding:4px 0;min-width:228px;font-family:var(--font-meta,"Space Grotesk",sans-serif);font-size:12px;letter-spacing:.04em;color:var(--dark,#1e1e28);opacity:0;transform:scale(.96) translateY(-4px);transform-origin:top left;transition:opacity .13s ease,transform .13s ease;pointer-events:none;user-select:none;}',
      '.ctx-menu.is-visible{opacity:1;transform:scale(1) translateY(0);pointer-events:auto;}',

      /* ── Items ── */
      '.ctx-item{position:relative;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:9px 14px;cursor:pointer;white-space:nowrap;color:var(--dark,#1e1e28);transition:background .1s ease,color .1s ease;}',
      '.ctx-item:hover{background:var(--maroon,#6e0a0a);color:var(--cream,#fffbf3);}',
      '.ctx-item.ctx-dim{color:rgba(30,30,40,.38);}',
      '.ctx-item.ctx-dim:hover{background:none;color:rgba(30,30,40,.38);cursor:default;}',
      '.ctx-divider{height:1px;background:rgba(30,30,40,.08);margin:4px 0;}',
      '.ctx-chev{flex-shrink:0;opacity:.4;}',
      '.ctx-item:hover .ctx-chev{opacity:.75;}',

      /* ── Submenus ── */
      '.ctx-sub{position:absolute;top:-4px;left:calc(100% + 4px);background:var(--cream,#fffbf3);border:1px solid rgba(30,30,40,.12);border-radius:4px;box-shadow:0 8px 32px rgba(30,30,40,.13);padding:4px 0;min-width:200px;opacity:0;pointer-events:none;transform:translateX(-6px);transition:opacity .12s ease,transform .12s ease;z-index:99999;}',
      '.ctx-item:hover>.ctx-sub{opacity:1;pointer-events:auto;transform:translateX(0);}',
      '.ctx-sub.flip{left:auto;right:calc(100% + 4px);transform:translateX(6px);}',
      '.ctx-item:hover>.ctx-sub.flip{transform:translateX(0);}',

      /* ── Modal backdrop ── */
      '.ctx-bg{position:fixed;inset:0;z-index:99999;background:rgba(30,30,40,.42);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .22s ease;pointer-events:none;}',
      '.ctx-bg.is-visible{opacity:1;pointer-events:auto;}',

      /* ── Modal box ── */
      '.ctx-box{background:var(--cream,#fffbf3);border-radius:4px;padding:40px;width:min(460px,90vw);position:relative;overflow:hidden;transform:translateY(14px);transition:transform .28s cubic-bezier(.16,1,.3,1);}',
      '.ctx-bg.is-visible .ctx-box{transform:translateY(0);}',
      '.ctx-close{position:absolute;top:14px;right:14px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;color:rgba(30,30,40,.35);border-radius:2px;transition:color .15s ease;}',
      '.ctx-close:hover{color:var(--dark,#1e1e28);}',
      '.ctx-modal-title{font-family:var(--font-body,"Manrope",sans-serif);font-size:20px;font-weight:500;letter-spacing:-.02em;color:var(--dark,#1e1e28);margin:0 0 6px;}',
      '.ctx-modal-sub{font-family:var(--font-body,"Manrope",sans-serif);font-size:13px;color:rgba(30,30,40,.5);margin:0 0 28px;line-height:1.55;}',

      /* ── Form fields ── */
      '.ctx-field{display:flex;flex-direction:column;gap:5px;margin-bottom:14px;}',
      '.ctx-field label{font-family:var(--font-meta,"Space Grotesk",sans-serif);font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:rgba(30,30,40,.42);}',
      '.ctx-field input,.ctx-field textarea{width:100%;box-sizing:border-box;background:rgba(30,30,40,.04);border:1px solid rgba(30,30,40,.11);border-radius:3px;padding:10px 12px;font-family:var(--font-body,"Manrope",sans-serif);font-size:14px;color:var(--dark,#1e1e28);outline:none;transition:border-color .15s ease;cursor:none;}',
      '.ctx-field input:focus,.ctx-field textarea:focus{border-color:var(--maroon,#6e0a0a);}',
      '.ctx-field input:-webkit-autofill,.ctx-field input:-webkit-autofill:hover,.ctx-field input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 1000px rgba(30,30,40,.04) inset;-webkit-text-fill-color:var(--dark,#1e1e28);border-color:rgba(30,30,40,.11);transition:background-color 5000s ease;}',
      '.ctx-field.is-error input,.ctx-field.is-error textarea{border-color:var(--maroon,#6e0a0a);background:rgba(110,10,10,.04);}',
      '.ctx-field.is-error label{color:var(--maroon,#6e0a0a);}',
      '.ctx-field textarea{height:96px;min-height:64px;resize:vertical;}',

      /* ── Send button ── */
      '.ctx-submit{width:100%;padding:12px;margin-top:6px;background:var(--maroon,#6e0a0a);color:var(--cream,#fffbf3);border:none;border-radius:3px;font-family:var(--font-meta,"Space Grotesk",sans-serif);font-size:11px;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;transition:opacity .2s ease;}',
      '.ctx-submit:hover{opacity:.82;}',
      '.ctx-submit:disabled{opacity:.4;cursor:default;}',

      /* ── Send state: form dims while sending ── */
      '.ctx-form-wrap{transition:opacity .35s ease;}',
      '.ctx-box.is-sending .ctx-form-wrap{opacity:.2;pointer-events:none;}',
      '.ctx-box.is-sent .ctx-form-wrap{opacity:0;pointer-events:none;}',

      /* ── Confirmation overlay ── */
      '.ctx-confirm{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;gap:12px;opacity:0;pointer-events:none;transition:opacity .45s ease .15s;}',
      '.ctx-box.is-sent .ctx-confirm{opacity:1;pointer-events:auto;}',
      '.ctx-confirm-icon{width:44px;height:44px;border-radius:50%;background:rgba(110,10,10,.08);display:flex;align-items:center;justify-content:center;color:var(--maroon,#6e0a0a);margin-bottom:4px;}',
      '.ctx-confirm-title{font-family:var(--font-body,"Manrope",sans-serif);font-size:18px;font-weight:500;letter-spacing:-.02em;color:var(--dark,#1e1e28);margin:0;}',
      '.ctx-confirm-sub{font-family:var(--font-body,"Manrope",sans-serif);font-size:13px;color:rgba(30,30,40,.5);margin:0;line-height:1.5;}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ── EmailJS lazy-load ──────────────────────────── */
  var ejsReady = false;

  function loadEJS(cb) {
    if (ejsReady) { cb(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    s.onload = function () {
      /* global emailjs */
      emailjs.init(EJS_PK);
      ejsReady = true;
      cb();
    };
    document.head.appendChild(s);
  }

  /* ── SVG helpers ─────────────────────────────────── */
  function chev() {
    return '<svg class="ctx-chev" width="6" height="10" viewBox="0 0 6 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1 1l4 4-4 4"/></svg>';
  }

  function xIcon() {
    return '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg>';
  }

  /* ── Menu DOM ────────────────────────────────────── */
  var menu  = null;
  var newTabEl = null;

  function buildMenu() {
    var m = document.createElement('div');
    m.className = 'ctx-menu';
    m.setAttribute('role', 'menu');

    /* Open in New Tab */
    newTabEl = makeItem('Open Link in New Tab');
    m.appendChild(newTabEl);

    /* Copy Link */
    var copyEl = makeItem('Copy Link for Sharing');
    copyEl.addEventListener('click', function () {
      navigator.clipboard.writeText(window.location.href).catch(function () {
        var ta = document.createElement('textarea');
        ta.value = window.location.href;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      });
      hide();
    });
    m.appendChild(copyEl);

    m.appendChild(divider());

    /* Go to... */
    var gotoEl = makeItem('Go to…', { hasChev: true });
    var gotoSub = document.createElement('div');
    gotoSub.className = 'ctx-sub';

    PAGES.forEach(function (page) {
      if (page.sub) {
        /* Featured with sub-submenu */
        var featEl  = makeItem(page.label, { hasChev: true });
        var featSub = document.createElement('div');
        featSub.className = 'ctx-sub';

        page.sub.forEach(function (cs) {
          var el = makeItem(cs.label);
          el.addEventListener('click', function () { navigate(cs.href); });
          featSub.appendChild(el);
        });

        featEl.appendChild(featSub);
        featEl.addEventListener('mouseenter', function () { flipCheck(featSub); });
        gotoSub.appendChild(featEl);
      } else {
        var el = makeItem(page.label);
        el.addEventListener('click', function () { navigate(page.href); });
        gotoSub.appendChild(el);
      }
    });

    gotoEl.appendChild(gotoSub);
    gotoEl.addEventListener('mouseenter', function () { flipCheck(gotoSub); });
    m.appendChild(gotoEl);

    m.appendChild(divider());

    /* Let's Meet */
    var meetEl = makeItem("Let’s Meet");
    meetEl.addEventListener('click', function () {
      window.open(CAL_URL, '_blank', 'noopener');
      hide();
    });
    m.appendChild(meetEl);

    /* Send Message */
    var msgEl = makeItem('Send Message');
    msgEl.addEventListener('click', function () {
      hide();
      openModal();
    });
    m.appendChild(msgEl);

    document.body.appendChild(m);
    return m;
  }

  function makeItem(label, opts) {
    opts = opts || {};
    var el = document.createElement('div');
    el.className = 'ctx-item';
    el.setAttribute('role', 'menuitem');
    el.innerHTML = label + (opts.hasChev ? chev() : '');
    return el;
  }

  function divider() {
    var el = document.createElement('div');
    el.className = 'ctx-divider';
    return el;
  }

  /* Flip submenu left if it would overflow the right edge */
  function flipCheck(sub) {
    sub.classList.remove('flip');
    /* Force layout so getBoundingClientRect is accurate */
    var rect = sub.getBoundingClientRect();
    if (rect.right > window.innerWidth - 8) sub.classList.add('flip');
  }

  /* ── Show / hide ─────────────────────────────────── */
  function show(x, y, linkHref) {
    if (!menu) menu = buildMenu();

    /* Wire up "Open in New Tab" */
    newTabEl.classList.toggle('ctx-dim', !linkHref);
    newTabEl.innerHTML = (linkHref ? 'Open Link in New Tab' : 'Open Page in New Tab');
    newTabEl.onclick = function () {
      window.open(linkHref || window.location.href, '_blank', 'noopener');
      hide();
    };

    /* Initial position */
    menu.style.left = x + 'px';
    menu.style.top  = y + 'px';
    menu.style.transformOrigin = 'top left';

    requestAnimationFrame(function () {
      menu.classList.add('is-visible');

      /* Flip if near viewport edges */
      var r = menu.getBoundingClientRect();
      if (r.right  > window.innerWidth  - 8) {
        menu.style.left = (x - r.width)  + 'px';
        menu.style.transformOrigin = 'top right';
      }
      if (r.bottom > window.innerHeight - 8) {
        menu.style.top  = (y - r.height) + 'px';
      }
    });
  }

  function hide() {
    if (menu) menu.classList.remove('is-visible');
  }

  function navigate(href) {
    hide();
    window.location.href = href;
  }

  /* ── Modal ───────────────────────────────────────── */
  var modal = null;

  function buildModal() {
    var bg = document.createElement('div');
    bg.className = 'ctx-bg';
    bg.setAttribute('role', 'dialog');
    bg.setAttribute('aria-modal', 'true');

    var box = document.createElement('div');
    box.className = 'ctx-box';
    box.innerHTML =
      '<button class="ctx-close" aria-label="Close">' + xIcon() + '</button>' +
      '<div class="ctx-form-wrap">' +
        '<p class="ctx-modal-title">Send Emīl a message</p>' +
        '<p class="ctx-modal-sub">I\'ll get back to you in 48h.</p>' +
        '<form id="ctx-form" novalidate>' +
          '<div class="ctx-field"><label for="ctx-name">Name</label>' +
            '<input id="ctx-name" type="text" placeholder="Your name" required></div>' +
          '<div class="ctx-field"><label for="ctx-email">Email</label>' +
            '<input id="ctx-email" type="email" placeholder="your@email.com" required></div>' +
          '<div class="ctx-field"><label for="ctx-subject">Subject</label>' +
            '<input id="ctx-subject" type="text" placeholder="What\'s it about?"></div>' +
          '<div class="ctx-field"><label for="ctx-msg">Message</label>' +
            '<textarea id="ctx-msg" placeholder="Say hello…" required></textarea></div>' +
          '<button type="submit" class="ctx-submit">Send message</button>' +
          '<p id="ctx-error" style="margin-top:10px;font-size:13px;color:var(--maroon,#6e0a0a);min-height:0;"></p>' +
        '</form>' +
      '</div>' +
      '<div class="ctx-confirm" aria-live="polite">' +
        '<div class="ctx-confirm-icon">' +
          '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 10 8 15 17 5"/></svg>' +
        '</div>' +
        '<p class="ctx-confirm-title">Message sent.</p>' +
        '<p class="ctx-confirm-sub">I\'ll be in touch within 48 hours.</p>' +
      '</div>';

    bg.appendChild(box);

    /* Close triggers — X button only */
    box.querySelector('.ctx-close').addEventListener('click', closeModal);
    document.addEventListener('keydown', onEscModal);

    /* Submit */
    box.querySelector('#ctx-form').addEventListener('submit', function (e) {
      e.preventDefault();
      sendMsg(this);
    });

    document.body.appendChild(bg);
    return bg;
  }

  function openModal() {
    if (!modal) modal = buildModal();
    var box  = modal.querySelector('.ctx-box');
    var form = modal.querySelector('#ctx-form');
    var btn  = modal.querySelector('.ctx-submit');
    var err  = modal.querySelector('#ctx-error');

    /* Reset animation state */
    box.classList.remove('is-sending', 'is-sent');
    if (form) {
      form.reset();
      form.querySelectorAll('.ctx-field').forEach(function (f) { f.classList.remove('is-error'); });
    }
    if (btn)  { btn.disabled = false; btn.textContent = 'Send message'; }
    if (err)  err.textContent = '';

    scrollLock();
    requestAnimationFrame(function () { modal.classList.add('is-visible'); });
  }

  function closeModal() {
    if (modal) modal.classList.remove('is-visible');
    scrollUnlock();
  }

  var _scrollY = 0;

  function scrollLock() {
    _scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top      = -_scrollY + 'px';
    document.body.style.left     = '0';
    document.body.style.right    = '0';
    document.body.style.overflow = 'hidden';
  }

  function scrollUnlock() {
    document.body.style.position = '';
    document.body.style.top      = '';
    document.body.style.left     = '';
    document.body.style.right    = '';
    document.body.style.overflow = '';
    window.scrollTo(0, _scrollY);
  }

  function onEscModal(e) {
    if (e.key === 'Escape') closeModal();
  }

  /* ── EmailJS send ─────────────────────────────────── */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function fieldOf(el) { return el.closest('.ctx-field'); }

  function setError(el, yes) {
    var f = fieldOf(el);
    if (f) f.classList.toggle('is-error', yes);
  }

  function clearErrorOnInput(el) {
    el.addEventListener('input', function () { setError(el, false); }, { once: true });
  }

  function sendMsg(form) {
    var box       = modal.querySelector('.ctx-box');
    var btn       = form.querySelector('.ctx-submit');
    var errorEl   = form.querySelector('#ctx-error');
    var nameEl    = form.querySelector('#ctx-name');
    var emailEl   = form.querySelector('#ctx-email');
    var subjEl    = form.querySelector('#ctx-subject');
    var msgEl     = form.querySelector('#ctx-msg');

    var name  = nameEl.value.trim();
    var email = emailEl.value.trim();
    var subj  = subjEl.value.trim();
    var msg   = msgEl.value.trim();

    /* Per-field validation */
    var valid = true;
    var firstError = null;

    [nameEl, subjEl, msgEl].forEach(function (el) {
      var empty = !el.value.trim();
      setError(el, empty);
      if (empty) { valid = false; firstError = firstError || el; clearErrorOnInput(el); }
    });

    var badEmail = !email || !EMAIL_RE.test(email);
    setError(emailEl, badEmail);
    if (badEmail) {
      valid = false;
      firstError = firstError || emailEl;
      clearErrorOnInput(emailEl);
    }

    if (!valid) {
      errorEl.textContent = !email || !name || !subj || !msg
        ? 'Please fill in all fields.'
        : 'Please enter a valid email address.';
      if (firstError) firstError.focus();
      return;
    }

    errorEl.textContent = '';
    btn.disabled        = true;
    btn.textContent     = 'Sending…';
    box.classList.add('is-sending');

    loadEJS(function () {
      emailjs.send(EJS_SVC, EJS_TPL, {
        name:    name,
        email:   email,
        title:   subj || 'Message via emilblum.com',
        time:    new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }),
        message: msg
      }).then(function () {
        box.classList.replace('is-sending', 'is-sent');
        setTimeout(closeModal, 3000);
      }, function () {
        box.classList.remove('is-sending');
        btn.disabled    = false;
        btn.textContent = 'Send message';
        error.textContent = 'Something went wrong. Try again or email me directly.';
      });
    });
  }

  /* ── Global event listeners ─────────────────────── */
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    var anchor = e.target.closest('a[href]');
    show(e.clientX, e.clientY, anchor ? anchor.href : null);
  });

  document.addEventListener('click', function (e) {
    if (menu && !menu.contains(e.target)) hide();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hide();
  });

  window.addEventListener('scroll', hide, { passive: true });

  /* ── Init ──────────────────────────────────────── */
  injectStyles();

})();

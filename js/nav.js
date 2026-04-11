/* =====================================================
   EMIL BLUM — NAVIGATION JS
   Floating nav: init, active state, scroll behaviour,
   mobile menu toggle, custom cursor
   ===================================================== */

(function () {
  'use strict';

  /* ── NAV INIT ── */
  function initNav() {
    const nav         = document.querySelector('.site-nav');
    const outsideLogo = document.querySelector('.nav-logo-outside');
    if (!nav) return;

    // Mark active link based on current page filename
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    nav.querySelectorAll('.nav-link, .nav-dropdown-item').forEach(link => {
      const href = link.getAttribute('href');
      if (href && currentPage.includes(href.replace('.html', '').split('?')[0])) {
        link.classList.add('is-active');
      }
      if (currentPage === 'index.html' && href === 'index.html') {
        link.classList.add('is-active');
      }
    });

    // Animate nav + outside logo + fixed CTA in after brief delay
    const fixedCta = document.querySelector('.nav-cta-fixed');
    setTimeout(() => {
      nav.classList.add('is-visible');
      if (outsideLogo) outsideLogo.classList.add('is-visible');
      if (fixedCta) fixedCta.classList.add('is-visible');
    }, 300);

    // Scroll-based opacity
    window.addEventListener('scroll', () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 80);
    }, { passive: true });
  }

  /* ── MOBILE MENU TOGGLE ── */
  function initMobileMenu() {
    const nav    = document.querySelector('.site-nav');
    const toggle = document.querySelector('.nav-menu-toggle');
    if (!nav || !toggle) return;

    toggle.addEventListener('click', () => {
      nav.classList.toggle('is-open');
      const expanded = nav.classList.contains('is-open');
      toggle.setAttribute('aria-expanded', expanded);
    });

    // Close menu when a nav link is tapped
    nav.querySelectorAll('.nav-link, .nav-dropdown-item').forEach(link => {
      link.addEventListener('click', () => nav.classList.remove('is-open'));
    });

    // Close menu when clicking outside the nav
    document.addEventListener('click', e => {
      if (!nav.contains(e.target)) {
        nav.classList.remove('is-open');
      }
    });
  }

  /* ── DROPDOWN — handled entirely by CSS :hover on desktop.
       Mobile always shows sub-items via display:flex in nav.css.
       No JS click-toggle needed. ── */

  /* ── CUSTOM CURSOR ── */
  function initCursor() {
    const cursor = document.getElementById('cursor');
    const label  = document.getElementById('cursor-label');
    if (!cursor) return;

    // Don't run on touch devices
    if (window.matchMedia('(hover: none)').matches) {
      cursor.style.display = 'none';
      return;
    }

    let mouseX = -100, mouseY = -100;
    let curX   = -100, curY   = -100;

    function tick() {
      const ease = 0.18;
      curX += (mouseX - curX) * ease;
      curY += (mouseY - curY) * ease;
      cursor.style.left = curX + 'px';
      cursor.style.top  = curY + 'px';
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Expand cursor with label — skip nav items
    document.addEventListener('mouseover', e => {
      const target = e.target.closest('[data-cursor]');
      if (target && !target.closest('.site-nav')) {
        if (label) label.textContent = target.getAttribute('data-cursor') || '';
        document.body.classList.add('cursor-hover');
      }
    });

    document.addEventListener('mouseout', e => {
      const target = e.target.closest('[data-cursor]');
      if (target && !target.closest('.site-nav') && !target.contains(e.relatedTarget)) {
        document.body.classList.remove('cursor-hover');
        if (label) label.textContent = '';
      }
    });

    document.body.style.cursor = 'none';
  }

  /* ── SCROLL REVEAL ── */
  function initReveal() {
    const elements = document.querySelectorAll('[data-reveal]');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(el => observer.observe(el));
  }

  /* ── BOOT ── */
  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initMobileMenu();
    initCursor();
    initReveal();
  });

})();

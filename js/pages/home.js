/* =====================================================
   EMIL BLUM — HOME PAGE JS
   Fluid sequence — all steps overlap:
   · Emil slides up
   · 0.4s later Blum slides up (while Emil is still settling)
   · Image box starts expanding immediately after Blum begins
   · Images cycle during the scale-up
   · Slide up happens 0.4s after last image has cycled
   ===================================================== */

(function () {
  'use strict';

  function initLoader() {
    const loader      = document.getElementById('loader');
    const emilImg     = document.getElementById('wm-emil');
    const blumImg     = document.getElementById('wm-blum');
    const box         = document.getElementById('loader-box');
    const imageGrow   = document.getElementById('loader-image-grow');
    const wordStart   = document.querySelector('.loader-word-start');
    const wordEnd     = document.querySelector('.loader-word-end');
    const extras      = document.querySelectorAll('.loader-img-extra');
    const homeContent = document.getElementById('home-content');

    if (!loader || !emilImg || !blumImg) return;

    const boxInner = document.querySelector('.loader-box-inner');
    const targetW  = boxInner ? boxInner.offsetWidth : 420;

    const DUR = 1.0;    // per-word slide duration
    const STAGGER = 0.4; // gap between Emil and Blum starts

    const tl = gsap.timeline({
      defaults: { ease: 'expo.out' },
      delay: 0.2
    });

    /* Emil slides up */
    tl.from(emilImg, { yPercent: 110, duration: DUR });

    /* Blum starts 0.4s after Emil — viewer gets a beat to register each word */
    tl.from(blumImg, { yPercent: 110, duration: DUR }, `-=${DUR - STAGGER}`);

    /* Box expands immediately after Blum begins (no gap) */
    tl.fromTo(box,
      { width: 0 },
      { width: targetW, duration: 0.9, ease: 'expo.inOut' },
      `-=${DUR - 0.05}`
    );

    /* Image scales up at the same time as box */
    tl.fromTo(imageGrow,
      { scale: 0, transformOrigin: 'center center' },
      { scale: 1, duration: 0.9, ease: 'expo.inOut' },
      '<'
    );

    /* Names nudge outward as box opens */
    tl.fromTo(wordStart, { x: 0 }, { x: -6, duration: 1.0 }, '<');
    tl.fromTo(wordEnd,   { x: 0 }, { x:  6, duration: 1.0 }, '<');

    /* Images cycle DURING the scale-up — start early, each visible ~0.28s */
    if (extras.length) {
      tl.to(extras, {
        opacity: 0,
        duration: 0.06,
        ease: 'none',
        stagger: 0.28
      }, '<+=0.15');
    }

    /* Slide up 0.4s after last image — short hold then exit */
    const cycleEnd = extras.length * 0.28 + 0.15 + 0.06; // approx time cycling takes
    tl.to({}, { duration: 0.4 }); // 0.4s beat after last image

    /* Loader exits upward */
    tl.to(loader, {
      yPercent: -105,
      duration: 0.85,
      ease: 'expo.inOut',
      onComplete: () => { loader.style.display = 'none'; }
    });

    /* Home content fades in overlapping with loader exit */
    tl.to(homeContent, {
      opacity: 1,
      duration: 0.7,
      ease: 'power2.out',
      onStart: () => {
        homeContent && homeContent.classList.add('is-visible');
        // Cascade hero [data-reveal] elements in DOM order
        const heroEls = Array.from(document.querySelectorAll('.hero [data-reveal]'));
        heroEls.forEach((el, i) => {
          setTimeout(() => {
            el.style.transitionDelay = '0ms';
            el.classList.add('is-visible');
          }, i * 65);
        });
      }
    }, '-=0.45');
  }

  // ── HOVER SCATTER ──────────────────────────────────────────
  const HOVER_PREVIEWS = {
    featured: [
      'assets/images/hover-previews/featured/placeholder-1.jpg',
      'assets/images/hover-previews/featured/placeholder-2.jpg',
      'assets/images/hover-previews/featured/placeholder-3.jpg',
    ],
    code: [
      'assets/images/hover-previews/code/placeholder-4.jpg',
      'assets/images/hover-previews/code/placeholder-5.jpg',
      'assets/images/hover-previews/code/placeholder-6.png',
    ],
    art: [
      'assets/images/hover-previews/art/placeholder-7.png',
      'assets/images/hover-previews/art/placeholder-8.jpg',
      'assets/images/hover-previews/art/placeholder-9.png',
    ],
    moments: [
      'assets/images/hover-previews/moments/placeholder-10.png',
      'assets/images/hover-previews/moments/placeholder-11.png',
      'assets/images/hover-previews/moments/placeholder-12.jpg',
      'assets/images/hover-previews/moments/placeholder-4.jpg',
      'assets/images/hover-previews/moments/placeholder-5.jpg',
      'assets/images/hover-previews/moments/placeholder-6.png',
    ],
    swarf: [
      'assets/images/hover-previews/swarf/placeholder-13.jpg',
      'assets/images/hover-previews/swarf/placeholder-14.jpg',
      'assets/images/hover-previews/swarf/placeholder-15.jpg',
    ],
    about: [
      'assets/images/hover-previews/about/placeholder-16.gif',
      'assets/images/hover-previews/about/placeholder-17.gif',
      'assets/images/hover-previews/about/placeholder-18.jpg',
      'assets/images/hover-previews/about/05_eb-home-archive-AAguitars.webp',
      'assets/images/hover-previews/about/06_eb-home-archive-Mindful-illustrations.webp',
      'assets/images/hover-previews/about/07_eb-home-archive-GType.webp',
      'assets/images/hover-previews/about/08_eb-home-archive-FTLOTGTitles.webp',
    ],
    play: [
      'assets/images/hover-previews/play/placeholder-19.jpg',
      'assets/images/hover-previews/play/placeholder-20.webp',
      'assets/images/hover-previews/play/placeholder-21.webp',
    ],
    connect: [
      'assets/images/hover-previews/connect/placeholder-22.webp',
      'assets/images/hover-previews/connect/placeholder-23.webp',
      'assets/images/hover-previews/connect/placeholder-24.webp',
      'assets/images/hover-previews/connect/placeholder-7.png',
      'assets/images/hover-previews/connect/placeholder-8.jpg',
      'assets/images/hover-previews/connect/placeholder-9.png',
    ],
  };

  // Widths for three size tiers (px) — varies each image for natural feel
  const SIZE_TIERS = [400, 480, 580];
  // How many images to show per hover (picked randomly from the full pool)
  const SCATTER_COUNT = 3;

  function initScatter() {
    const container = document.getElementById('hover-scatter');
    if (!container) return;

    // No hover interaction on touch-only devices — skip entirely
    if (!window.matchMedia('(hover: hover)').matches) return;

    // Preload during browser idle time so it doesn't compete with page load
    const preloadAll = () => {
      Object.values(HOVER_PREVIEWS).flat().forEach(src => { new Image().src = src; });
    };
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadAll, { timeout: 4000 });
    } else {
      setTimeout(preloadAll, 2500);
    }

    const FADE_IN_MS   = 600;  // duration of each image fade-in
    const FADE_OUT_MS  = 300;  // duration of each image fade-out
    const IN_STAGGER   = 400;  // ms between each successive image appearing
    const OUT_STAGGER  = 200;  // ms between each successive image disappearing

    let currentKey = null;
    let allTimers  = [];

    function clearTimers() {
      allTimers.forEach(clearTimeout);
      allTimers = [];
    }

    function later(fn, ms) {
      const t = setTimeout(fn, ms);
      allTimers.push(t);
    }

    // Divide viewport into a 3×2 grid of zones, shuffle, return one position per image.
    function spreadPositions(count) {
      const COLS = 3, ROWS = 2;
      const cells = [];
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) cells.push([c, r]);
      for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
      }
      const cw = 75 / COLS, ch = 70 / ROWS;
      return cells.slice(0, count).map(([c, r]) => ({
        x: 3 + c * cw + Math.random() * cw * 0.65,
        y: 5 + r * ch + Math.random() * ch * 0.70,
      }));
    }

    function pickRandom(arr, n) {
      const pool = [...arr];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      return pool.slice(0, Math.min(n, pool.length));
    }

    function showSection(key) {
      if (key === currentKey) return;
      clearTimers();

      // Fade out + remove any existing images, with per-image stagger
      const existing = Array.from(container.querySelectorAll('.scatter-img'));
      existing.forEach((img, i) => {
        const opacity = parseFloat(img.style.opacity || '0');
        if (opacity <= 0.01) {
          // Not yet visible — remove immediately, no transition needed
          img.remove();
        } else {
          img.style.transition = `opacity ${FADE_OUT_MS}ms ease`;
          later(() => { img.style.opacity = '0'; }, i * OUT_STAGGER);
          later(() => { img.remove(); }, i * OUT_STAGGER + FADE_OUT_MS + 40);
        }
      });

      currentKey = key;
      if (!key) return;

      const pool = HOVER_PREVIEWS[key];
      if (!pool || !pool.length) return;

      const srcs      = pickRandom(pool, SCATTER_COUNT);
      const positions = spreadPositions(srcs.length);

      srcs.forEach((src, i) => {
        const img = document.createElement('img');
        img.src       = src;
        img.className = 'scatter-img';
        img.alt       = '';
        img.draggable = false;

        const { x, y } = positions[i];
        const rot = (Math.random() - 0.5) * 30; // ±15°
        const w   = SIZE_TIERS[i % SIZE_TIERS.length];

        img.style.cssText = [
          `left:${x}%`,
          `top:${y}%`,
          `width:${w}px`,
          `transform:rotate(${rot}deg)`,
          `opacity:0`,
          `transition:opacity ${FADE_IN_MS}ms ease`,
        ].join(';');

        container.appendChild(img);

        // Stagger each image's fade-in start by IN_STAGGER ms
        later(() => { img.style.opacity = '1'; }, i * IN_STAGGER);
      });
    }

    // Use mousemove on the grid rather than per-cell mouseenter —
    // mouseenter can be skipped on fast pointer movements, mousemove never is.
    const grid = document.querySelector('.home-nav-grid');
    if (!grid) return;

    grid.addEventListener('mousemove', e => {
      const item = e.target.closest('.home-nav-item[data-section]');
      const key  = item ? item.dataset.section : null;
      // Only respond to real sections; null (gap between cells) is ignored
      if (key && key !== currentKey) showSection(key);
    });

    grid.addEventListener('mouseleave', () => showSection(null));
  }
  // ────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', () => {
    initScatter();
    if (typeof gsap !== 'undefined') {
      initLoader();
    } else {
      const loader = document.getElementById('loader');
      const homeContent = document.getElementById('home-content');
      if (loader) {
        setTimeout(() => {
          loader.style.display = 'none';
          if (homeContent) homeContent.classList.add('is-visible');
          const heroEls = Array.from(document.querySelectorAll('.hero [data-reveal]'));
          heroEls.forEach((el, i) => {
            setTimeout(() => {
              el.style.transitionDelay = '0ms';
              el.classList.add('is-visible');
            }, i * 65);
          });
        }, 600);
      }
    }
  });

})();

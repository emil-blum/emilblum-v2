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
      Object.values(HOVER_PREVIEWS).flat().forEach(src => {
        new Image().src = src;
      });
    };
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadAll, { timeout: 4000 });
    } else {
      setTimeout(preloadAll, 2500);
    }

    let hideTimer = null;

    // Divide viewport into a 3×2 grid of zones, shuffle, return one position per image.
    // Guarantees images are always spread across the screen rather than clustering.
    function spreadPositions(count) {
      const COLS = 3, ROWS = 2;
      const cells = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) cells.push([c, r]);
      }
      // Fisher-Yates shuffle
      for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
      }
      // Each zone is cw×ch percent of viewport; jitter places image within its zone
      const cw = 75 / COLS;   // 25% per column
      const ch = 70 / ROWS;   // 35% per row
      return cells.slice(0, count).map(([c, r]) => ({
        x: 3 + c * cw + Math.random() * cw * 0.65,
        y: 5 + r * ch + Math.random() * ch * 0.70,
      }));
    }

    // Pick n random items from an array without mutating it
    function pickRandom(arr, n) {
      const pool = [...arr];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      return pool.slice(0, Math.min(n, pool.length));
    }

    function showScatter(key) {
      clearTimeout(hideTimer);
      container.innerHTML = '';

      const all  = HOVER_PREVIEWS[key];
      if (!all || !all.length) return;
      const srcs = pickRandom(all, SCATTER_COUNT);

      const positions = spreadPositions(srcs.length);

      srcs.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'scatter-img';
        img.alt = '';
        img.draggable = false;

        const { x, y } = positions[i];
        const rot = (Math.random() - 0.5) * 30; // ±15°
        const w   = SIZE_TIERS[i % SIZE_TIERS.length];

        img.style.cssText = `left:${x}%;top:${y}%;width:${w}px;transform:rotate(${rot}deg);`;

        container.appendChild(img);

        // Double rAF so the opacity transition fires after element is painted
        requestAnimationFrame(() => requestAnimationFrame(() => {
          img.style.opacity = '1';
        }));
      });
    }

    function hideScatter() {
      clearTimeout(hideTimer);
      // Short debounce so moving between adjacent grid cells doesn't flicker
      hideTimer = setTimeout(() => {
        const imgs = container.querySelectorAll('.scatter-img');
        imgs.forEach(img => { img.style.opacity = '0'; });
        setTimeout(() => { container.innerHTML = ''; }, 240);
      }, 80);
    }

    document.querySelectorAll('.home-nav-item[data-section]').forEach(item => {
      item.addEventListener('mouseenter', () => showScatter(item.dataset.section));
      item.addEventListener('mouseleave', hideScatter);
    });
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

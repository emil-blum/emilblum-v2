/* =====================================================
   EMIL BLUM — FAVES PAGE JS
   Holographic card carousel with Spring physics,
   3D tilt, holographic effects, gyroscope, drag,
   keyboard navigation. Loads from content/faves.json.
   ===================================================== */

'use strict';

/* ── UTILITIES ── */
function clamp(value, min = 0, max = 100) { return Math.min(Math.max(value, min), max); }
function round(value, decimals = 2) { return Math.round(value * 10 ** decimals) / 10 ** decimals; }
function adjust(value, fromMin, fromMax, toMin, toMax) { return toMin + ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin); }

/* ── SPRING CLASS ── */
class Spring {
  constructor(initialValue, stiffness = 0.066, damping = 0.25) {
    this.stiffness = stiffness;
    this.damping = damping;
    if (typeof initialValue === 'object' && initialValue !== null) {
      this.value = { ...initialValue };
      this.target = { ...initialValue };
      this.velocity = {};
      for (const key of Object.keys(initialValue)) { this.velocity[key] = 0; }
      this.isObject = true;
    } else {
      this.value = initialValue;
      this.target = initialValue;
      this.velocity = 0;
      this.isObject = false;
    }
  }
  set(target) {
    if (this.isObject) { Object.assign(this.target, target); }
    else { this.target = target; }
  }
  setHard(target) {
    if (this.isObject) {
      Object.assign(this.target, target);
      Object.assign(this.value, target);
      for (const key of Object.keys(this.velocity)) { this.velocity[key] = 0; }
    } else {
      this.target = target;
      this.value = target;
      this.velocity = 0;
    }
  }
  update() {
    if (this.isObject) {
      let settled = true;
      for (const key of Object.keys(this.value)) {
        const displacement = this.value[key] - this.target[key];
        const springForce = -this.stiffness * displacement;
        const dampingForce = -this.damping * this.velocity[key];
        this.velocity[key] += springForce + dampingForce;
        this.value[key] += this.velocity[key];
        if (Math.abs(this.velocity[key]) > 0.001 || Math.abs(displacement) > 0.001) { settled = false; }
      }
      return !settled;
    } else {
      const displacement = this.value - this.target;
      const springForce = -this.stiffness * displacement;
      const dampingForce = -this.damping * this.velocity;
      this.velocity += springForce + dampingForce;
      this.value += this.velocity;
      return Math.abs(this.velocity) > 0.001 || Math.abs(displacement) > 0.001;
    }
  }
}

/* ── CONSTANTS ── */
const INTERACT_STIFFNESS = 0.066, INTERACT_DAMPING = 0.25;
const SNAP_STIFFNESS = 0.01, SNAP_DAMPING = 0.06;
const GYRO_NATURAL_BETA = 60, GYRO_CLAMP = 30, GYRO_DEAD_ZONE = 2, GYRO_SMOOTH = 0.2;

/* ── STATE ── */
let projects = [];
let currentIndex = 0;
let cardEls = [];   // .card elements in DOM order
let slotEls = [];   // .card-slot elements in DOM order

// Per-card spring state
let cardSprings = []; // array of { rx: Spring, ry: Spring, raf: null, isInteracting: false }

// Carousel
let trackEl = null;
let carouselEl = null;

// Drag state
let drag = { active: false, startX: 0, startTranslate: 0 };
let targetTranslate = 0;
let currentTranslate = 0;
let carouselSpring = null;

// Gyro
let gyroSmoothed = { x: 0, y: 0 };
let gyroEnabled = false;
let gyroRaf = null;

// Resize debounce
let resizeTimer = null;

/* ── CARD HTML BUILDER ── */
function createCardHTML(project, index, total) {
  const rarityCount = (index % 2 === 0) ? 2 : 3;
  const dots = Array.from({ length: rarityCount }, (_, i) =>
    `<span class="${i < rarityCount ? 'filled' : ''}"></span>`
  ).join('');

  const padded = String(index + 1).padStart(2, '0');
  const totalPadded = String(total).padStart(2, '0');

  return `
    <div class="card-slot" data-index="${index}">
      <div class="card" data-holo="${project.holoVariant || 'classic'}">
        <div class="card__inner">
          <div class="card__face">
            <div class="card__image">
              <img src="${project.thumbnail}" alt="${project.title}" draggable="false" loading="lazy">
              <span class="card__badge">${project.category}</span>
            </div>
            <div class="card__stats">
              <div class="card__title">${project.title}</div>
              <div class="card__meta-grid">
                <div class="card__meta-item">
                  <span class="card__meta-label">Year</span>
                  <span class="card__meta-value">${project.year}</span>
                </div>
                <div class="card__meta-item">
                  <span class="card__meta-label">Type</span>
                  <span class="card__meta-value">${(project.tags && project.tags[0]) || project.category}</span>
                </div>
              </div>
              <div class="card__divider"></div>
              <div class="card__number">
                <span>${padded} / ${totalPadded}</span>
                <div class="rarity-dots">${dots}</div>
              </div>
            </div>
          </div>
          <div class="card__shine"></div>
          <div class="card__glare"></div>
          <div class="card__sparkle"></div>
        </div>
      </div>
      <button class="card__info-btn" data-project-id="${project.id}" aria-label="View case study for ${project.title}">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 10L10 2M10 2H4M10 2v6"/>
        </svg>
      </button>
    </div>
  `;
}

/* ── CARD INTERACTION: CSS VAR UPDATE ── */
function updateCardStyle(cardEl, vars) {
  if (vars.pointerX !== undefined) cardEl.style.setProperty('--pointer-x', `${round(vars.pointerX)}%`);
  if (vars.pointerY !== undefined) cardEl.style.setProperty('--pointer-y', `${round(vars.pointerY)}%`);
  if (vars.pointerFromCenter !== undefined) cardEl.style.setProperty('--pointer-from-center', `${round(vars.pointerFromCenter, 4)}`);
  if (vars.pointerFromTop !== undefined) cardEl.style.setProperty('--pointer-from-top', `${round(vars.pointerFromTop, 4)}`);
  if (vars.pointerFromLeft !== undefined) cardEl.style.setProperty('--pointer-from-left', `${round(vars.pointerFromLeft, 4)}`);
  if (vars.rotateX !== undefined) cardEl.style.setProperty('--rotate-x', `${round(vars.rotateX)}deg`);
  if (vars.rotateY !== undefined) cardEl.style.setProperty('--rotate-y', `${round(vars.rotateY)}deg`);
  if (vars.bgX !== undefined) cardEl.style.setProperty('--bg-x', `${round(vars.bgX)}%`);
  if (vars.bgY !== undefined) cardEl.style.setProperty('--bg-y', `${round(vars.bgY)}%`);
  if (vars.cardOpacity !== undefined) cardEl.style.setProperty('--card-opacity', `${round(vars.cardOpacity, 4)}`);
}

/* ── CARD INTERACTION: ANIMATE SPRING ── */
function animateCard(index) {
  const spring = cardSprings[index];
  const cardEl = cardEls[index];
  if (!spring || !cardEl) return;

  const rx = spring.rx;
  const ry = spring.ry;

  function tick() {
    const rxActive = rx.update();
    const ryActive = ry.update();

    const rotX = rx.value;
    const rotY = ry.value;

    // Pointer position derived from tilt values (map rotation to 0-100%)
    const pointerX = adjust(rotX, -20, 20, 0, 100);
    const pointerY = adjust(rotY, -20, 20, 0, 100);
    const fromLeft = pointerX / 100;
    const fromTop = pointerY / 100;
    const fromCenter = Math.sqrt((fromLeft - 0.5) ** 2 + (fromTop - 0.5) ** 2) * 2;

    updateCardStyle(cardEl, {
      pointerX,
      pointerY,
      pointerFromCenter: clamp(fromCenter, 0, 1),
      pointerFromTop: fromTop,
      pointerFromLeft: fromLeft,
      rotateX: rotX,
      rotateY: rotY,
      bgX: pointerX,
      bgY: pointerY,
      cardOpacity: spring.isInteracting ? clamp(fromCenter * 1.2, 0, 1) : 0
    });

    if (rxActive || ryActive) {
      spring.raf = requestAnimationFrame(tick);
    } else {
      spring.raf = null;
    }
  }

  if (spring.raf) cancelAnimationFrame(spring.raf);
  spring.raf = requestAnimationFrame(tick);
}

/* ── CARD INTERACTION: HANDLE INTERACT ── */
function handleInteract(index, x, y) {
  const cardEl = cardEls[index];
  if (!cardEl) return;
  const spring = cardSprings[index];

  const rect = cardEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const maxRot = 20;

  const rx = clamp((x - cx) / (rect.width / 2) * maxRot, -maxRot, maxRot);
  const ry = clamp((y - cy) / (rect.height / 2) * maxRot, -maxRot, maxRot);

  spring.isInteracting = true;
  spring.rx.stiffness = INTERACT_STIFFNESS;
  spring.rx.damping = INTERACT_DAMPING;
  spring.ry.stiffness = INTERACT_STIFFNESS;
  spring.ry.damping = INTERACT_DAMPING;
  spring.rx.set(rx);
  spring.ry.set(ry);

  cardEl.classList.add('interacting');
  animateCard(index);
}

/* ── CARD INTERACTION: HANDLE INTERACT END ── */
function handleInteractEnd(index) {
  const cardEl = cardEls[index];
  if (!cardEl) return;
  const spring = cardSprings[index];

  spring.isInteracting = false;
  spring.rx.stiffness = SNAP_STIFFNESS;
  spring.rx.damping = SNAP_DAMPING;
  spring.ry.stiffness = SNAP_STIFFNESS;
  spring.ry.damping = SNAP_DAMPING;
  spring.rx.set(0);
  spring.ry.set(0);

  cardEl.classList.remove('interacting');
  animateCard(index);
}

/* ── CAROUSEL: CALCULATE TRANSLATE ── */
function getTranslateForIndex(index) {
  if (!trackEl || slotEls.length === 0) return 0;
  const slot = slotEls[index];
  if (!slot) return 0;
  const carouselWidth = carouselEl ? carouselEl.offsetWidth : window.innerWidth;
  const slotLeft = slot.offsetLeft;
  const slotWidth = slot.offsetWidth;
  return -(slotLeft - (carouselWidth / 2) + (slotWidth / 2));
}

/* ── CAROUSEL: UPDATE COUNTER ── */
function updateCounter() {
  const el = document.getElementById('card-counter');
  if (!el) return;
  const total = projects.length;
  el.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
}

/* ── CAROUSEL: GO TO INDEX ── */
function goTo(index) {
  const n = projects.length;
  currentIndex = ((index % n) + n) % n;

  // Update active class
  slotEls.forEach((slot, i) => {
    slot.classList.toggle('active', i === currentIndex);
  });

  // Move track
  const translate = getTranslateForIndex(currentIndex);
  if (trackEl) {
    trackEl.style.transform = `translateX(${translate}px)`;
  }

  updateCounter();
}

function goPrev() { goTo(currentIndex - 1); }
function goNext() { goTo(currentIndex + 1); }

/* ── POINTER EVENTS: CARD HOVER/LEAVE ── */
function bindCardPointerEvents() {
  document.addEventListener('pointermove', e => {
    // Only interact with the active card
    const activeSlot = slotEls[currentIndex];
    if (!activeSlot) return;
    const card = activeSlot.querySelector('.card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    if (
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top && e.clientY <= rect.bottom
    ) {
      handleInteract(currentIndex, e.clientX, e.clientY);
    } else if (cardSprings[currentIndex] && cardSprings[currentIndex].isInteracting) {
      handleInteractEnd(currentIndex);
    }
  });

  document.addEventListener('pointerleave', () => {
    if (cardSprings[currentIndex]) handleInteractEnd(currentIndex);
  });
}

/* ── DRAG ── */
function bindDrag() {
  if (!carouselEl) return;

  carouselEl.addEventListener('pointerdown', e => {
    // Don't hijack button clicks
    if (e.target.closest('.card__info-btn')) return;
    drag.active = true;
    drag.startX = e.clientX;
    drag.startTranslate = getTranslateForIndex(currentIndex);
    carouselEl.classList.add('grabbing');
    carouselEl.setPointerCapture(e.pointerId);
  });

  carouselEl.addEventListener('pointermove', e => {
    if (!drag.active) return;
    const dx = e.clientX - drag.startX;
    if (trackEl) {
      trackEl.style.transition = 'none';
      trackEl.style.transform = `translateX(${drag.startTranslate + dx}px)`;
    }
  });

  const endDrag = e => {
    if (!drag.active) return;
    drag.active = false;
    carouselEl.classList.remove('grabbing');
    if (trackEl) {
      trackEl.style.transition = '';
    }
    const dx = e.clientX - drag.startX;
    const threshold = 60;
    if (dx < -threshold) goNext();
    else if (dx > threshold) goPrev();
    else goTo(currentIndex); // snap back
  };

  carouselEl.addEventListener('pointerup', endDrag);
  carouselEl.addEventListener('pointercancel', endDrag);

  // Touch swipe
  let touchStartX = 0;
  carouselEl.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  carouselEl.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (dx < -50) goNext();
    else if (dx > 50) goPrev();
  }, { passive: true });
}

/* ── KEYBOARD ── */
function bindKeyboard() {
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
  });
}

/* ── GYROSCOPE ── */
function bindGyroscope() {
  if (!window.DeviceOrientationEvent) return;

  window.addEventListener('deviceorientation', e => {
    if (e.beta === null || e.gamma === null) return;
    gyroEnabled = true;

    const rawBeta  = e.beta  - GYRO_NATURAL_BETA;  // tilt forward/back
    const rawGamma = e.gamma;                        // tilt left/right

    const clampedBeta  = clamp(rawBeta,  -GYRO_CLAMP, GYRO_CLAMP);
    const clampedGamma = clamp(rawGamma, -GYRO_CLAMP, GYRO_CLAMP);

    // Dead zone
    const filteredBeta  = Math.abs(clampedBeta)  > GYRO_DEAD_ZONE ? clampedBeta  : 0;
    const filteredGamma = Math.abs(clampedGamma) > GYRO_DEAD_ZONE ? clampedGamma : 0;

    // Smooth
    gyroSmoothed.x += (filteredGamma - gyroSmoothed.x) * GYRO_SMOOTH;
    gyroSmoothed.y += (filteredBeta  - gyroSmoothed.y) * GYRO_SMOOTH;
  });

  // Drive active card spring from gyro when no pointer interaction
  function gyroTick() {
    if (gyroEnabled && cardSprings[currentIndex] && !cardSprings[currentIndex].isInteracting) {
      const spring = cardSprings[currentIndex];
      spring.rx.set(gyroSmoothed.x);
      spring.ry.set(-gyroSmoothed.y);
      animateCard(currentIndex);
    }
    gyroRaf = requestAnimationFrame(gyroTick);
  }
  gyroTick();
}

/* ── INFO BTN CLICK ── */
function bindInfoButtons() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.card__info-btn');
    if (!btn) return;
    const id = btn.dataset.projectId;
    if (id) window.location.href = `case-study.html?id=${id}`;
  });
}

/* ── ENTRANCE ANIMATION ── */
function entranceAnimation() {
  slotEls.forEach((slot, i) => {
    slot.style.opacity = '0';
    slot.style.transform = slot.classList.contains('active') ? 'scale(0.9)' : 'scale(0.8)';
    setTimeout(() => {
      slot.style.transition = 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1), filter 0.6s cubic-bezier(0.16,1,0.3,1)';
      slot.style.opacity = '';
      slot.style.transform = '';
    }, 80 + i * 60);
  });
}

/* ── RESIZE HANDLER ── */
function onResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    goTo(currentIndex);
  }, 150);
}

/* ── INIT ── */
function init(loadedProjects) {
  projects = loadedProjects;
  const track = document.getElementById('carouselTrack');
  carouselEl = document.getElementById('carousel');
  trackEl = track;

  if (!track || !carouselEl) return;

  // Build HTML
  track.innerHTML = projects.map((p, i) => createCardHTML(p, i, projects.length)).join('');

  // Collect DOM refs
  slotEls = Array.from(track.querySelectorAll('.card-slot'));
  cardEls = Array.from(track.querySelectorAll('.card'));

  // Init springs for each card
  cardSprings = slotEls.map(() => ({
    rx: new Spring(0, INTERACT_STIFFNESS, INTERACT_DAMPING),
    ry: new Spring(0, INTERACT_STIFFNESS, INTERACT_DAMPING),
    raf: null,
    isInteracting: false
  }));

  // Nav buttons
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (prevBtn) prevBtn.addEventListener('click', goPrev);
  if (nextBtn) nextBtn.addEventListener('click', goNext);

  // Go to initial index (triggers active class + counter)
  goTo(0);

  // Bind interactions
  bindCardPointerEvents();
  bindDrag();
  bindKeyboard();
  bindGyroscope();
  bindInfoButtons();

  // Entrance animation
  entranceAnimation();

  // Resize
  window.addEventListener('resize', onResize);
}

/* ── INLINE DATA (fallback for file:// local dev; fetch takes priority on server) ── */
const FAVES_INLINE = [
  { id: 'hard-rock-vinyl',   title: 'Hard Rock Hotels',     year: '2019', category: 'Print & Craft',            holoVariant: 'galaxy',    thumbnail: 'assets/images/01_eb-home-archive-friendapp.webp',      tags: ['Print','Craft','Experiential'] },
  { id: 'daydream-believers',title: 'Daydream Believers',   year: '2019', category: 'Brand Identity & Digital', holoVariant: 'rainbow',   thumbnail: 'assets/images/02_eb-home-archive-kombucha.webp',       tags: ['Brand','Web','Identity'] },
  { id: 'oxfam-republic',    title: 'Republic of You',      year: '2015–2016', category: 'Digital & Interactive', holoVariant: 'radiant', thumbnail: 'assets/images/03_eb-home-archive-RType.webp',          tags: ['Interactive','Game Design','Campaign'] },
  { id: 'stewart-brewing',   title: 'Stewart Brewing',      year: '2019', category: 'Packaging & Brand',        holoVariant: 'prismatic', thumbnail: 'assets/images/04_eb-home-archive-africanwoman.webp',   tags: ['Packaging','Brand','AR'] },
  { id: 'sgma-solgelica',    title: 'SgMA / Solgelica',     year: '2025', category: 'Brand & Identity',         holoVariant: 'classic',   thumbnail: 'assets/images/05_eb-home-archive-AAguitars.webp',      tags: ['Brand','Biotech','Identity'] },
  { id: 'calumma-design',    title: 'Calumma Design',       year: 'Ongoing', category: 'Brand & Web',           holoVariant: 'galaxy',    thumbnail: 'assets/images/06_eb-home-archive-Mindful-illustrations.webp', tags: ['Brand','Web','Interior'] }
];

/* ── BOOTSTRAP ── */
document.addEventListener('DOMContentLoaded', () => {
  fetch('content/faves.json')
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(data => init(data))
    .catch(() => init(FAVES_INLINE));
});

// Equirectangular 360° video player
// Three.js (ES module) and hls.js are lazy-loaded from local assets on first use.

(function () {

  const THREE_SRC = '/assets/js/three.module.min.js';
  const HLS_SRC   = '/assets/js/hls.min.js';

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  function fmtTime(s) {
    if (!isFinite(s) || s < 0) return '0:00';
    const m  = Math.floor(s / 60);
    const ss = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${ss}`;
  }

  class Video360Player {
    constructor(container, src) {
      this.container = container;
      this.src       = src;
      this.THREE     = null;   // stored after dynamic import
      this.renderer  = null;
      this.scene     = null;
      this.camera    = null;
      this.video     = null;
      this.texture   = null;
      this.rafId     = null;
      this.canvas    = null;
      this._hls      = null;
      this._ro       = null;

      // Orbit state
      this.lon = 0;
      this.lat = 0;
      this.isDragging = false;
      this.lastX = 0;
      this.lastY = 0;

      // Gyro
      this.gyroEnabled   = false;
      this._gyroListener = null;
      this._gyroBase     = null;

      // Bound event refs for cleanup
      this._onMouseMove = null;
      this._onMouseUp   = null;

      // Controls auto-hide
      this._hideTimer  = null;
      this._controlsEl = null;
    }

    async init() {
      // Dynamic ES module import for Three.js — no global needed
      const [THREE] = await Promise.all([
        import(THREE_SRC),
        loadScript(HLS_SRC),
      ]);
      this.THREE = THREE;

      this.video = document.createElement('video');
      this.video.crossOrigin = 'anonymous';
      this.video.playsInline = true;
      this.video.loop = true;
      this.video.muted = false;

      if (window.Hls && Hls.isSupported()) {
        const hls = new Hls({ enableWorker: false, startLevel: -1 });
        hls.loadSource(this.src);
        hls.attachMedia(this.video);
        this._hls = hls;
      } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari)
        this.video.src = this.src;
      } else {
        throw new Error('HLS not supported in this browser.');
      }

      this._setupScene();
      this._bindDrag();
      this._startRender();
      await this.video.play();
    }

    _setupScene() {
      const T = this.THREE;
      const W = this.container.offsetWidth  || 800;
      const H = this.container.offsetHeight || 450;

      this.renderer = new T.WebGLRenderer({ antialias: false });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setSize(W, H);

      this.canvas = this.renderer.domElement;
      this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab;z-index:1;';
      this.container.appendChild(this.canvas);

      this.camera = new T.PerspectiveCamera(75, W / H, 0.1, 1100);
      this.camera.position.set(0, 0, 0.0001);

      this.scene = new T.Scene();

      this.texture = new T.VideoTexture(this.video);
      this.texture.colorSpace = T.SRGBColorSpace;

      // Inside-out sphere — scale X by -1 flips normals so we see the inside surface
      const geo = new T.SphereGeometry(500, 60, 40);
      geo.scale(-1, 1, 1);
      const mat = new T.MeshBasicMaterial({ map: this.texture });
      this.scene.add(new T.Mesh(geo, mat));

      this._ro = new ResizeObserver(() => this._onResize());
      this._ro.observe(this.container);
    }

    _onResize() {
      if (!this.renderer) return;
      const W = this.container.offsetWidth;
      const H = this.container.offsetHeight;
      this.renderer.setSize(W, H);
      this.camera.aspect = W / H;
      this.camera.updateProjectionMatrix();
    }

    _bindDrag() {
      const canvas = this.canvas;

      canvas.addEventListener('mousedown', e => {
        this.isDragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        canvas.style.cursor = 'grabbing';
      });

      this._onMouseMove = e => {
        this._showControls();
        if (!this.isDragging) return;
        this.lon -= (e.clientX - this.lastX) * 0.25;
        this.lat  = Math.max(-85, Math.min(85, this.lat + (e.clientY - this.lastY) * 0.25));
        this.lastX = e.clientX;
        this.lastY = e.clientY;
      };
      window.addEventListener('mousemove', this._onMouseMove);

      this._onMouseUp = () => {
        this.isDragging = false;
        if (canvas) canvas.style.cursor = 'grab';
      };
      window.addEventListener('mouseup', this._onMouseUp);

      // Touch drag
      let lx = 0, ly = 0;
      canvas.addEventListener('touchstart', e => {
        this._showControls();
        if (e.touches.length === 1) { lx = e.touches[0].clientX; ly = e.touches[0].clientY; }
      }, { passive: true });
      canvas.addEventListener('touchmove', e => {
        if (e.touches.length !== 1 || this.gyroEnabled) return;
        this.lon -= (e.touches[0].clientX - lx) * 0.3;
        this.lat  = Math.max(-85, Math.min(85, this.lat + (e.touches[0].clientY - ly) * 0.3));
        lx = e.touches[0].clientX;
        ly = e.touches[0].clientY;
      }, { passive: true });

      // Ctrl/Cmd + scroll to zoom FOV (plain scroll is reserved for page scrolling)
      canvas.addEventListener('wheel', e => {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        this.camera.fov = Math.max(30, Math.min(100, this.camera.fov + e.deltaY * 0.05));
        this.camera.updateProjectionMatrix();
      }, { passive: false });
    }

    _startRender() {
      const T = this.THREE;

      const tick = () => {
        this.rafId = requestAnimationFrame(tick);

        if (this.video.readyState >= this.video.HAVE_CURRENT_DATA) {
          this.texture.needsUpdate = true;
        }

        const phi   = T.MathUtils.degToRad(90 - this.lat);
        const theta = T.MathUtils.degToRad(this.lon);
        this.camera.lookAt(
          500 * Math.sin(phi) * Math.cos(theta),
          500 * Math.cos(phi),
          500 * Math.sin(phi) * Math.sin(theta)
        );

        this.renderer.render(this.scene, this.camera);
      };

      tick();
    }

    // ── Controls ─────────────────────────────────────

    initControls(controlsEl) {
      this._controlsEl = controlsEl;
      const video = this.video;

      const ppBtn      = controlsEl.querySelector('.cs-360-pp-btn');
      const scrubTrack = controlsEl.querySelector('.cs-360-scrub-track');
      const scrubFill  = controlsEl.querySelector('.cs-360-scrub-fill');
      const scrubThumb = controlsEl.querySelector('.cs-360-scrub-thumb');
      const timeEl     = controlsEl.querySelector('.cs-360-time');
      const muteBtn    = controlsEl.querySelector('.cs-360-mute-btn');

      // Play / pause
      const updatePP = () => {
        ppBtn.setAttribute('aria-label', video.paused ? 'Play' : 'Pause');
        ppBtn.querySelector('svg').innerHTML = video.paused
          ? '<path d="M5 3l14 9-14 9V3z" fill="currentColor"/>'
          : '<rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/>';
      };
      ppBtn.addEventListener('click', () => { video.paused ? video.play() : video.pause(); });
      video.addEventListener('play',  () => { updatePP(); this._scheduleHide(); });
      video.addEventListener('pause', () => { updatePP(); this._showControls(true); });
      updatePP();

      // Scrubber
      let isScrubbing = false;

      const updateScrub = () => {
        if (!video.duration || isScrubbing) return;
        const pct = (video.currentTime / video.duration) * 100;
        scrubFill.style.width = pct + '%';
        scrubThumb.style.left = pct + '%';
        timeEl.textContent = fmtTime(video.currentTime) + ' / ' + fmtTime(video.duration);
      };
      video.addEventListener('timeupdate', updateScrub);
      video.addEventListener('durationchange', updateScrub);

      const scrubTo = clientX => {
        const rect = scrubTrack.getBoundingClientRect();
        const pct  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        scrubFill.style.width = (pct * 100) + '%';
        scrubThumb.style.left = (pct * 100) + '%';
        if (video.duration) {
          video.currentTime = pct * video.duration;
          timeEl.textContent = fmtTime(video.currentTime) + ' / ' + fmtTime(video.duration);
        }
      };

      scrubTrack.addEventListener('mousedown', e => {
        isScrubbing = true;
        scrubTo(e.clientX);
        const onMove = e => { if (isScrubbing) scrubTo(e.clientX); };
        const onUp   = () => { isScrubbing = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      });
      scrubTrack.addEventListener('touchstart', e => { isScrubbing = true; scrubTo(e.touches[0].clientX); }, { passive: true });
      scrubTrack.addEventListener('touchmove',  e => { if (isScrubbing) scrubTo(e.touches[0].clientX); }, { passive: true });
      scrubTrack.addEventListener('touchend',   () => { isScrubbing = false; }, { passive: true });

      // Mute
      const updateMute = () => {
        muteBtn.setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute');
        muteBtn.querySelector('svg').innerHTML = video.muted
          ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" stroke-width="1.5"/><line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" stroke-width="1.5"/>'
          : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';
      };
      muteBtn.addEventListener('click', () => { video.muted = !video.muted; updateMute(); });
      updateMute();

      // Reveal controls on interaction anywhere inside the wrapper
      controlsEl.addEventListener('mousemove',  () => this._showControls());
      controlsEl.addEventListener('touchstart', () => this._showControls(), { passive: true });

      this._showControls();
    }

    _showControls(keepOpen = false) {
      if (!this._controlsEl) return;
      this._controlsEl.classList.add('is-visible');
      clearTimeout(this._hideTimer);
      if (!keepOpen) this._scheduleHide();
    }

    _scheduleHide() {
      clearTimeout(this._hideTimer);
      this._hideTimer = setTimeout(() => {
        if (this._controlsEl && !this.video?.paused) {
          this._controlsEl.classList.remove('is-visible');
        }
      }, 3000);
    }

    // ── Gyroscope ────────────────────────────────────

    async enableGyro() {
      if (this.gyroEnabled) { this._disableGyro(); return false; }

      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        const perm = await DeviceOrientationEvent.requestPermission().catch(() => 'denied');
        if (perm !== 'granted') return false;
      }

      this._gyroBase = null;
      this._gyroListener = e => {
        if (this._gyroBase === null) this._gyroBase = e.alpha || 0;
        const alpha = ((e.alpha || 0) - this._gyroBase + 360) % 360;
        this.lon = alpha > 180 ? -(360 - alpha) : -alpha;
        this.lat = Math.max(-85, Math.min(85, (e.beta || 90) - 90));
      };
      window.addEventListener('deviceorientation', this._gyroListener);
      this.gyroEnabled = true;
      return true;
    }

    _disableGyro() {
      if (this._gyroListener) {
        window.removeEventListener('deviceorientation', this._gyroListener);
        this._gyroListener = null;
      }
      this._gyroBase = null;
      this.gyroEnabled = false;
    }

    destroy() {
      clearTimeout(this._hideTimer);
      if (this.rafId) cancelAnimationFrame(this.rafId);
      if (this._ro) this._ro.disconnect();
      if (this._onMouseMove) window.removeEventListener('mousemove', this._onMouseMove);
      if (this._onMouseUp)   window.removeEventListener('mouseup',   this._onMouseUp);
      this._disableGyro();
      if (this._hls)  { this._hls.destroy(); this._hls = null; }
      if (this.video) { this.video.pause(); this.video.src = ''; this.video = null; }
      if (this.renderer) { this.renderer.dispose(); this.renderer = null; }
      if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
      this.canvas = null;
    }
  }

  window.Video360Player = Video360Player;

})();

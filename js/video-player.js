/* =====================================================
   EMIL BLUM — REGULAR VIDEO PLAYER
   HLS.js + custom controls for .cs-block-video.
   Reuses all .cs-360-* control CSS — identical to video360.js.
   ===================================================== */

(function () {
  'use strict';

  const HLS_SRC   = '/assets/js/hls.min.js';
  const HIDE_DELAY = 3000;

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

  class VideoPlayer {
    constructor(wrap) {
      this.wrap        = wrap;
      this.video       = wrap.querySelector('.cs-video-el');
      this.overlay     = wrap.querySelector('.cs-video-overlay');
      this.controls    = wrap.querySelector('.cs-360-controls');
      this.hlsSrc      = wrap.dataset.src;
      this._hls        = null;
      this._hideTimer  = null;
      this._controlsEl = null;
      this._started    = false;

      this._bindPlayButton();
    }

    _bindPlayButton() {
      const playBtn = this.wrap.querySelector('.cs-video-play');
      if (playBtn) playBtn.addEventListener('click', () => this._start());
    }

    async _start() {
      if (this._started) return;
      this._started = true;
      this.wrap.classList.add('is-playing');
      this._initControls(this.controls);
      this._showControls();
      await this._loadHls();
    }

    async _loadHls() {
      await loadScript(HLS_SRC);
      /* global Hls */
      const video = this.video;
      if (Hls.isSupported()) {
        this._hls = new Hls({ enableWorker: false });
        this._hls.loadSource(this.hlsSrc);
        this._hls.attachMedia(video);
        this._hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play(); });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari / iOS)
        video.src = this.hlsSrc;
        video.play();
      }
    }

    _initControls(controlsEl) {
      this._controlsEl = controlsEl;
      const video = this.video;

      const ppBtn      = controlsEl.querySelector('.cs-360-pp-btn');
      const scrubTrack = controlsEl.querySelector('.cs-360-scrub-track');
      const scrubFill  = controlsEl.querySelector('.cs-360-scrub-fill');
      const scrubThumb = controlsEl.querySelector('.cs-360-scrub-thumb');
      const timeEl     = controlsEl.querySelector('.cs-360-time');
      const muteBtn    = controlsEl.querySelector('.cs-360-mute-btn');
      const fsBtn      = controlsEl.querySelector('.cs-360-fs-btn');

      // ── Play / pause ──────────────────────────────────
      const updatePP = () => {
        ppBtn.setAttribute('aria-label', video.paused ? 'Play' : 'Pause');
        ppBtn.querySelector('svg').innerHTML = video.paused
          ? '<path d="M5 3l14 9-14 9V3z" fill="currentColor"/>'
          : '<rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/>';
      };
      ppBtn.addEventListener('click', () => { video.paused ? video.play() : video.pause(); });
      video.addEventListener('play',  () => { updatePP(); this._scheduleHide(); });
      video.addEventListener('pause', () => { updatePP(); this._showControls(true); });
      video.addEventListener('ended', () => {
        this._started = false;
        this.wrap.classList.remove('is-playing');
        if (this.overlay) this.overlay.style.display = '';
        controlsEl.classList.remove('is-visible');
      });
      updatePP();

      // ── Scrubber ──────────────────────────────────────
      let isScrubbing = false;

      const updateScrub = () => {
        if (!video.duration || isScrubbing) return;
        const pct = (video.currentTime / video.duration) * 100;
        scrubFill.style.width  = pct + '%';
        scrubThumb.style.left  = pct + '%';
        timeEl.textContent = fmtTime(video.currentTime) + ' / ' + fmtTime(video.duration);
      };
      video.addEventListener('timeupdate',     updateScrub);
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

      // ── Mute ─────────────────────────────────────────
      const updateMute = () => {
        muteBtn.setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute');
        muteBtn.querySelector('svg').innerHTML = video.muted
          ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" stroke-width="1.5"/><line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" stroke-width="1.5"/>'
          : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';
      };
      muteBtn.addEventListener('click', () => { video.muted = !video.muted; updateMute(); });
      updateMute();

      // ── Fullscreen ────────────────────────────────────
      if (fsBtn) {
        fsBtn.addEventListener('click', () => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            const el = this.wrap;
            (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
          }
        });
        document.addEventListener('fullscreenchange', () => {
          const icon = fsBtn.querySelector('svg');
          if (document.fullscreenElement) {
            icon.innerHTML = '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>';
          } else {
            icon.innerHTML = '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>';
          }
        });
      }

      // ── Show controls on hover ────────────────────────
      this.wrap.addEventListener('mousemove',   () => this._showControls());
      this.wrap.addEventListener('touchstart',  () => this._showControls(), { passive: true });
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
      }, HIDE_DELAY);
    }
  }

  function initVideoPlayers() {
    document.querySelectorAll('.cs-video-wrap').forEach(wrap => {
      if (wrap.querySelector('.cs-video-el') && wrap.dataset.src) {
        new VideoPlayer(wrap);
      }
    });
  }

  window.initVideoPlayers = initVideoPlayers;

})();

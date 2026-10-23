/**
 * Industrial-Strength KDS & KOT Audio Controller
 * Engineered specifically for loud restaurant kitchens:
 * - Dual Engine: Web Audio API synthesized resonant chime (853Hz + 960Hz) + HTML5 audio element
 * - Works 100% offline with synthesized chime if sound files fail to load
 * - Mobile Touch/Tap Unlock protocol (bypasses iOS Safari and Android Chrome autoplay restrictions)
 * - Device Haptic Vibration integration for mobile/tablet devices
 * - Continuous Ringing Siren until kitchen staff accepts or acknowledges the ticket
 */

class KDSAudioController {
  constructor() {
    this.ctx = null;
    this.audioElement = null;
    this.isRinging = false;
    this.ringInterval = null;
    this.isUnlocked = false;
    this.listeners = new Set();
    this.soundMuted = false;

    if (typeof window !== 'undefined') {
      this.initAudioElement();
      this.setupAutoUnlock();
    }
  }

  initAudioElement() {
    try {
      this.audioElement = new Audio('/sounds/kot_bell.wav');
      this.audioElement.preload = 'auto';
      this.audioElement.volume = 1.0;
    } catch (e) {
      console.warn('[KDS Audio] HTML5 Audio init note:', e);
    }
  }

  getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    return this.ctx;
  }

  async unlock() {
    if (this.isUnlocked) return true;
    try {
      const ctx = this.getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        // Play silent microscopic buffer to satisfy mobile browser autoplay policy
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }

      if (this.audioElement) {
        this.audioElement.muted = true;
        const playPromise = this.audioElement.play();
        if (playPromise !== undefined) {
          await playPromise.catch(() => {});
          this.audioElement.pause();
          this.audioElement.currentTime = 0;
          this.audioElement.muted = false;
        }
      }

      this.isUnlocked = true;
      this.notifyListeners();
      console.log('[KDS Audio] Kitchen Audio Engine Unlocked Successfully');
      return true;
    } catch (err) {
      console.warn('[KDS Audio] Unlock attempt note:', err);
      return false;
    }
  }

  setupAutoUnlock() {
    const handleGesture = () => {
      this.unlock();
      ['click', 'touchstart', 'touchend', 'keydown'].forEach(ev => {
        window.removeEventListener(ev, handleGesture, true);
      });
    };
    ['click', 'touchstart', 'touchend', 'keydown'].forEach(ev => {
      window.addEventListener(ev, handleGesture, { capture: true, once: true });
    });
  }

  playSynthesizedChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      // High-penetration resonant frequencies (853Hz + 960Hz) used in European train & kitchen bells
      const freqs = [853, 960];
      freqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Sharp strike, long resonant sustain
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.25);
      });
    } catch (e) {
      console.warn('[KDS Audio] Synthesizer note:', e);
    }
  }

  playSingleChime() {
    if (this.soundMuted) return;

    // Trigger haptic vibration for mobile/tablets
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch (e) {}
    }

    // Try HTML5 WAV audio
    if (this.audioElement) {
      this.audioElement.currentTime = 0;
      this.audioElement.volume = 1.0;
      const promise = this.audioElement.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // Fallback to Web Audio synthesis if HTML5 element is blocked
          this.playSynthesizedChime();
        });
      }
    } else {
      this.playSynthesizedChime();
    }
  }

  startContinuousAlert() {
    if (this.soundMuted) return;
    if (this.isRinging) return;

    this.isRinging = true;
    this.notifyListeners();
    this.playSingleChime();

    // Repeat alert every 4 seconds until acknowledged/accepted
    this.ringInterval = setInterval(() => {
      if (this.isRinging && !this.soundMuted) {
        this.playSingleChime();
      }
    }, 4000);
  }

  stopContinuousAlert() {
    this.isRinging = false;
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (e) {}
    }
    this.notifyListeners();
  }

  setMuted(muted) {
    this.soundMuted = muted;
    if (muted) {
      this.stopContinuousAlert();
    }
    this.notifyListeners();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener({
      isUnlocked: this.isUnlocked,
      isRinging: this.isRinging,
      isMuted: this.soundMuted,
    });
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    const state = {
      isUnlocked: this.isUnlocked,
      isRinging: this.isRinging,
      isMuted: this.soundMuted,
    };
    this.listeners.forEach(fn => fn(state));
  }
}

export const kdsAudio = new KDSAudioController();

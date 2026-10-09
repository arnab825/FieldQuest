/**
 * Web Audio API sensory chime generator
 * Generates an organic, warm harmonic meditative bell chime without any external audio files.
 */
export function playSensoryChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Harmonic frequencies for an organic singing bell (F# major chord warmth)
    const freqs = [370, 740, 1110, 1480];
    const gains = [0.25, 0.12, 0.06, 0.02];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Gentle natural bell decay envelope
      gain.gain.setValueAtTime(gains[idx], now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.8);
    });
  } catch {
    // Graceful silent fallback if AudioContext is blocked by browser policy
  }
}

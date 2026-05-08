type AudioStep = {
  frequency: number;
  durationMs: number;
  gain?: number;
  type?: OscillatorType;
};

type WebkitAudioContextConstructor = new () => AudioContext;

let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  const AudioContextCtor =
    globalThis.AudioContext ??
    (
      globalThis as typeof globalThis & {
        webkitAudioContext?: WebkitAudioContextConstructor;
      }
    ).webkitAudioContext;

  if (!AudioContextCtor) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextCtor();
  }

  return audioContext;
};

const playSequence = async (steps: AudioStep[]) => {
  const context = getAudioContext();

  if (!context) {
    return;
  }

  try {
    if (context.state === "suspended") {
      await context.resume();
    }

    let startAt = context.currentTime;

    steps.forEach(({ frequency, durationMs, gain = 0.06, type = "sine" }) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      const durationSeconds = durationMs / 1000;

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startAt);

      gainNode.gain.setValueAtTime(0.0001, startAt);
      gainNode.gain.exponentialRampToValueAtTime(gain, startAt + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        startAt + durationSeconds
      );

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(startAt);
      oscillator.stop(startAt + durationSeconds);

      startAt += durationSeconds + 0.03;
    });
  } catch (error) {
    console.warn("Scanner sound playback failed", error);
  }
};

export const playScanSuccessSound = () =>
  void playSequence([
    { frequency: 740, durationMs: 70, type: "triangle", gain: 0.05 },
    { frequency: 988, durationMs: 110, type: "triangle", gain: 0.07 },
  ]);

export const playScanErrorSound = () =>
  void playSequence([
    { frequency: 310, durationMs: 120, type: "sawtooth", gain: 0.05 },
    { frequency: 220, durationMs: 180, type: "sawtooth", gain: 0.045 },
  ]);

export const playGentleClickSound = () =>
  void playSequence([{ frequency: 520, durationMs: 45, type: "sine", gain: 0.025 }]);

export const playWaterLogSound = () =>
  void playSequence([
    { frequency: 420, durationMs: 55, type: "sine", gain: 0.035 },
    { frequency: 660, durationMs: 70, type: "triangle", gain: 0.04 },
  ]);

export const playAchievementSound = () =>
  void playSequence([
    { frequency: 660, durationMs: 65, type: "triangle", gain: 0.045 },
    { frequency: 880, durationMs: 85, type: "triangle", gain: 0.05 },
    { frequency: 1180, durationMs: 115, type: "sine", gain: 0.045 },
  ]);

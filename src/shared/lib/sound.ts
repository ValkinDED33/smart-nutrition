import { Howl } from "howler";

type AudioStep = {
  frequency: number;
  durationMs: number;
  gain?: number;
  type?: OscillatorType;
};

type WebkitAudioContextConstructor = new () => AudioContext;

export const uiTickSoundDataUrl =
  "data:audio/wav;base64,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";

let audioContext: AudioContext | null = null;
let uiTickHowl: Howl | null = null;

const getUiTickHowl = () => {
  uiTickHowl ??= new Howl({
    src: [uiTickSoundDataUrl],
    volume: 0.22,
    preload: true,
  });

  return uiTickHowl;
};

export const playHowlerBlip = () => {
  try {
    getUiTickHowl().play();
  } catch {
    playGentleClickSound();
  }
};

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

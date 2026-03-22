let audio: HTMLAudioElement | null = null;

export const playScanSound = () => {
  if (!audio) {
    audio = new Audio("/beep.mp3");
  }

  audio.currentTime = 0;
  audio.play().catch(() => {
    console.warn("Audio playback blocked by browser");
  });
};

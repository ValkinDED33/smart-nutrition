/// <reference types="vite/client" />

declare module "canvas-confetti" {
  export interface Options {
    colors?: string[];
    origin?: { x?: number; y?: number };
    particleCount?: number;
    spread?: number;
  }

  const confetti: (options?: Options) => Promise<unknown> | null;

  export default confetti;
}

declare module "howler" {
  export interface HowlOptions {
    preload?: boolean;
    src: string[];
    volume?: number;
  }

  export class Howl {
    constructor(options: HowlOptions);
    play(): number;
  }
}

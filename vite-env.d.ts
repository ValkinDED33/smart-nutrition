/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SMART_NUTRITION_API_BASE_URL?: string;
  readonly VITE_ELEVENLABS_API_KEY?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_POSTHOG_HOST?: string;
  readonly VITE_POSTHOG_KEY?: string;
}

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

declare module "matter-js" {
  interface MatterBody {
    position: {
      x: number;
      y: number;
    };
  }

  interface MatterComposite {
    bodies?: MatterBody[];
  }

  interface MatterEngine {
    gravity: {
      x: number;
      y: number;
      scale: number;
    };
    world: MatterComposite;
  }

  interface MatterBodyOptions {
    frictionAir?: number;
    isStatic?: boolean;
    restitution?: number;
  }

  const Matter: {
    Bodies: {
      circle: (
        x: number,
        y: number,
        radius: number,
        options?: MatterBodyOptions
      ) => MatterBody;
      rectangle: (
        x: number,
        y: number,
        width: number,
        height: number,
        options?: MatterBodyOptions
      ) => MatterBody;
    };
    Composite: {
      add: (
        composite: MatterComposite,
        bodies: MatterBody | MatterBody[]
      ) => void;
      allBodies: (composite: MatterComposite) => MatterBody[];
    };
    Engine: {
      create: () => MatterEngine;
      update: (engine: MatterEngine, delta?: number) => void;
    };
  };

  export default Matter;
}

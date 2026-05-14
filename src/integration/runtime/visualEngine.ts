import Matter from "matter-js";
import { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

let particlesEngineReady: Promise<void> | null = null;

export const preloadParticlesEngine = () => {
  particlesEngineReady ??= initParticlesEngine(async (engine) => {
    await loadSlim(engine);
  });

  return particlesEngineReady;
};

export const createNutritionMatterWorld = () => {
  const engine = Matter.Engine.create();
  engine.gravity.y = 0.7;

  const plate = Matter.Bodies.rectangle(0, 90, 260, 14, { isStatic: true });
  const protein = Matter.Bodies.circle(-36, -48, 16, {
    frictionAir: 0.02,
    restitution: 0.72,
  });
  const greens = Matter.Bodies.circle(34, -66, 18, {
    frictionAir: 0.02,
    restitution: 0.68,
  });

  Matter.Composite.add(engine.world, [plate, protein, greens]);
  Matter.Engine.update(engine, 1000 / 60);

  return {
    bodyCount: Matter.Composite.allBodies(engine.world).length,
    engine,
    samplePosition: {
      x: protein.position.x,
      y: protein.position.y,
    },
  };
};

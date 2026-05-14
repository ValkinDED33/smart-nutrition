import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import Particles from "@tsparticles/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import { Color } from "three";
import { preloadParticlesEngine } from "./visualEngine";

export const AnimatedSurface = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.28, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

export const NutritionParticles = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    preloadParticlesEngine()
      .then(() => {
        if (isMounted) {
          setIsReady(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsReady(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const options = useMemo(
    () => ({
      background: { color: "transparent" },
      fpsLimit: 60,
      particles: {
        color: { value: ["#14b8a6", "#84cc16", "#38bdf8"] },
        links: {
          color: "#94a3b8",
          distance: 115,
          enable: true,
          opacity: 0.22,
        },
        move: {
          direction: "none" as const,
          enable: true,
          outModes: { default: "bounce" as const },
          speed: 0.45,
        },
        number: {
          density: { enable: true },
          value: 24,
        },
        opacity: { value: 0.45 },
        size: { value: { min: 1, max: 3 } },
      },
    }),
    []
  );

  if (!isReady) {
    return null;
  }

  return <Particles id="nutrition-particles" options={options} />;
};

export const NutritionThreePreview = () => {
  const color = useMemo(() => new Color("#14b8a6"), []);

  return (
    <Canvas camera={{ position: [0, 0, 3.4], fov: 45 }}>
      <ambientLight intensity={0.75} />
      <directionalLight intensity={1.1} position={[2, 2, 3]} />
      <Sphere args={[1, 48, 48]}>
        <meshStandardMaterial color={color} roughness={0.46} metalness={0.08} />
      </Sphere>
      <OrbitControls enablePan={false} enableZoom={false} />
    </Canvas>
  );
};

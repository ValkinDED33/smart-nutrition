import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei/core/ContactShadows";
import { Float } from "@react-three/drei/core/Float";
import { Box } from "@mui/material";
import { DoubleSide, type Group } from "three";
import type { AssistantCompanionKind } from "@domain/profile/types";
import type {
  AssistantAvatarMood,
  AssistantAvatarProps,
} from "@shared/components/assistantAvatarTypes";

interface ModelPalette {
  body: string;
  head: string;
  accent: string;
  muzzle: string;
  eye: string;
  detail: string;
  shadow: string;
}

type Vector3Tuple = [number, number, number];

const palettes: Record<AssistantCompanionKind, ModelPalette> = {
  robot: {
    body: "#0f766e",
    head: "#2563eb",
    accent: "#a3e635",
    muzzle: "#dbeafe",
    eye: "#e0f2fe",
    detail: "#94a3b8",
    shadow: "rgba(37,99,235,0.28)",
  },
  cat: {
    body: "#fb923c",
    head: "#f97316",
    accent: "#fed7aa",
    muzzle: "#fff7ed",
    eye: "#fff7ed",
    detail: "#7c2d12",
    shadow: "rgba(249,115,22,0.28)",
  },
  dog: {
    body: "#b45309",
    head: "#92400e",
    accent: "#fde68a",
    muzzle: "#fef3c7",
    eye: "#fef3c7",
    detail: "#451a03",
    shadow: "rgba(146,64,14,0.28)",
  },
  fox: {
    body: "#f97316",
    head: "#ea580c",
    accent: "#ffedd5",
    muzzle: "#fff7ed",
    eye: "#fff7ed",
    detail: "#111827",
    shadow: "rgba(234,88,12,0.28)",
  },
  panda: {
    body: "#111827",
    head: "#f8fafc",
    accent: "#111827",
    muzzle: "#ffffff",
    eye: "#f8fafc",
    detail: "#020617",
    shadow: "rgba(15,23,42,0.28)",
  },
  owl: {
    body: "#92400e",
    head: "#ca8a04",
    accent: "#fef3c7",
    muzzle: "#fef3c7",
    eye: "#fff7ed",
    detail: "#f97316",
    shadow: "rgba(120,53,15,0.28)",
  },
  human: {
    body: "#0f766e",
    head: "#14b8a6",
    accent: "#dbeafe",
    muzzle: "#ccfbf1",
    eye: "#eff6ff",
    detail: "#0f172a",
    shadow: "rgba(20,184,166,0.28)",
  },
  capybara: {
    body: "#b45309",
    head: "#d97706",
    accent: "#fef3c7",
    muzzle: "#fef3c7",
    eye: "#fef3c7",
    detail: "#78350f",
    shadow: "rgba(180,83,9,0.28)",
  },
  dragon: {
    body: "#16a34a",
    head: "#22c55e",
    accent: "#fde68a",
    muzzle: "#dcfce7",
    eye: "#fefce8",
    detail: "#7c3aed",
    shadow: "rgba(34,197,94,0.3)",
  },
};

const headScaleByVariant: Record<AssistantCompanionKind, Vector3Tuple> = {
  robot: [0.58, 0.5, 0.5],
  cat: [0.58, 0.52, 0.5],
  dog: [0.6, 0.52, 0.52],
  fox: [0.56, 0.5, 0.5],
  panda: [0.6, 0.56, 0.52],
  owl: [0.62, 0.56, 0.46],
  human: [0.55, 0.54, 0.48],
  capybara: [0.64, 0.5, 0.52],
  dragon: [0.58, 0.5, 0.52],
};

const bodyScaleByVariant: Record<AssistantCompanionKind, Vector3Tuple> = {
  robot: [0.48, 0.44, 0.42],
  cat: [0.44, 0.5, 0.4],
  dog: [0.5, 0.48, 0.42],
  fox: [0.46, 0.48, 0.38],
  panda: [0.54, 0.5, 0.42],
  owl: [0.56, 0.6, 0.4],
  human: [0.45, 0.48, 0.38],
  capybara: [0.58, 0.46, 0.42],
  dragon: [0.5, 0.5, 0.42],
};

const moodLift: Record<AssistantAvatarMood, number> = {
  idle: 0,
  happy: 0.03,
  coach: 0.01,
  concerned: -0.02,
  sleepy: -0.05,
  celebrate: 0.06,
};

const clampLookOffset = (value: number) => Math.max(Math.min(value, 1), -1);

const getMotionIntensity = (mood: AssistantAvatarMood, active: boolean) => {
  if (mood === "sleepy" || mood === "concerned") {
    return 0.35;
  }

  if (mood === "celebrate") {
    return 1.15;
  }

  return active ? 0.78 : 0.5;
};

const Material = ({
  color,
  roughness = 0.72,
  metalness = 0.04,
}: {
  color: string;
  roughness?: number;
  metalness?: number;
}) => (
  <meshStandardMaterial
    color={color}
    roughness={roughness}
    metalness={metalness}
  />
);

const Sphere = ({
  color,
  position,
  scale,
}: {
  color: string;
  position: Vector3Tuple;
  scale: Vector3Tuple;
}) => (
  <mesh position={position} scale={scale}>
    <sphereGeometry args={[1, 32, 24]} />
    <Material color={color} />
  </mesh>
);

const BoxPart = ({
  color,
  position,
  scale,
  rotation = [0, 0, 0],
}: {
  color: string;
  position: Vector3Tuple;
  scale: Vector3Tuple;
  rotation?: Vector3Tuple;
}) => (
  <mesh position={position} rotation={rotation} scale={scale}>
    <boxGeometry args={[1, 1, 1]} />
    <Material color={color} />
  </mesh>
);

const Cone = ({
  color,
  position,
  scale,
  rotation = [0, 0, 0],
  radialSegments = 4,
}: {
  color: string;
  position: Vector3Tuple;
  scale: Vector3Tuple;
  rotation?: Vector3Tuple;
  radialSegments?: number;
}) => (
  <mesh position={position} rotation={rotation} scale={scale}>
    <coneGeometry args={[1, 1, radialSegments]} />
    <Material color={color} />
  </mesh>
);

const Eye = ({
  side,
  palette,
  mood,
  lookOffset,
}: {
  side: "left" | "right";
  palette: ModelPalette;
  mood: AssistantAvatarMood;
  lookOffset: { x: number; y: number };
}) => {
  const sleepy = mood === "sleepy";
  const concerned = mood === "concerned";
  const x = side === "left" ? -0.18 : 0.18;
  const lookX = clampLookOffset(lookOffset.x) * 0.035;
  const lookY = clampLookOffset(lookOffset.y) * 0.028;

  return (
    <group position={[x + lookX, 0.3 + lookY, 0.47]}>
      <mesh scale={[0.07, sleepy ? 0.018 : 0.07, 0.026]}>
        <sphereGeometry args={[1, 20, 12]} />
        <Material color={palette.eye} roughness={0.44} />
      </mesh>
      {concerned ? (
        <BoxPart
          color={palette.detail}
          position={[side === "left" ? 0.01 : -0.01, 0.075, 0.016]}
          rotation={[0, 0, side === "left" ? -0.34 : 0.34]}
          scale={[0.11, 0.018, 0.018]}
        />
      ) : null}
    </group>
  );
};

const Mouth = ({
  palette,
  mood,
}: {
  palette: ModelPalette;
  mood: AssistantAvatarMood;
}) => {
  if (mood === "concerned") {
    return (
      <BoxPart
        color={palette.muzzle}
        position={[0, 0.05, 0.49]}
        rotation={[0, 0, -0.16]}
        scale={[0.18, 0.02, 0.018]}
      />
    );
  }

  const isBigSmile = mood === "happy" || mood === "celebrate";

  return (
    <mesh
      position={[0, isBigSmile ? 0.06 : 0.07, 0.5]}
      rotation={[0, 0, Math.PI]}
      scale={[1, isBigSmile ? 1 : 0.72, 1]}
    >
      <torusGeometry args={[0.13, 0.012, 8, 28, Math.PI]} />
      <Material color={palette.muzzle} roughness={0.48} />
    </mesh>
  );
};

const AnimalEars = ({
  variant,
  palette,
}: {
  variant: AssistantCompanionKind;
  palette: ModelPalette;
}) => {
  if (variant === "dog") {
    return (
      <>
        <Sphere color={palette.detail} position={[-0.48, 0.32, -0.02]} scale={[0.16, 0.36, 0.08]} />
        <Sphere color={palette.detail} position={[0.48, 0.32, -0.02]} scale={[0.16, 0.36, 0.08]} />
      </>
    );
  }

  if (variant === "panda" || variant === "capybara") {
    return (
      <>
        <Sphere color={palette.accent} position={[-0.43, 0.58, -0.02]} scale={[0.18, 0.18, 0.08]} />
        <Sphere color={palette.accent} position={[0.43, 0.58, -0.02]} scale={[0.18, 0.18, 0.08]} />
      </>
    );
  }

  if (variant === "cat" || variant === "fox") {
    return (
      <>
        <Cone color={palette.accent} position={[-0.35, 0.62, 0.02]} rotation={[0, 0, -0.28]} scale={[0.14, 0.3, 0.12]} />
        <Cone color={palette.accent} position={[0.35, 0.62, 0.02]} rotation={[0, 0, 0.28]} scale={[0.14, 0.3, 0.12]} />
      </>
    );
  }

  return null;
};

const OwlDetails = ({ palette }: { palette: ModelPalette }) => (
  <>
    <Cone color={palette.accent} position={[-0.34, 0.6, 0.02]} rotation={[0, 0, -0.18]} scale={[0.16, 0.28, 0.1]} />
    <Cone color={palette.accent} position={[0.34, 0.6, 0.02]} rotation={[0, 0, 0.18]} scale={[0.16, 0.28, 0.1]} />
    <Sphere color={palette.accent} position={[-0.18, 0.28, 0.45]} scale={[0.16, 0.14, 0.02]} />
    <Sphere color={palette.accent} position={[0.18, 0.28, 0.45]} scale={[0.16, 0.14, 0.02]} />
    <Cone color={palette.detail} position={[0, 0.15, 0.52]} rotation={[Math.PI, 0, 0]} scale={[0.08, 0.12, 0.07]} radialSegments={3} />
  </>
);

const DragonDetails = ({ palette }: { palette: ModelPalette }) => (
  <>
    <Cone color={palette.accent} position={[-0.28, 0.64, 0.02]} rotation={[0, 0, -0.18]} scale={[0.08, 0.28, 0.08]} />
    <Cone color={palette.accent} position={[0.28, 0.64, 0.02]} rotation={[0, 0, 0.18]} scale={[0.08, 0.28, 0.08]} />
    <Cone color={palette.detail} position={[-0.62, -0.12, -0.04]} rotation={[0, 0.18, 1.18]} scale={[0.42, 0.56, 0.04]} radialSegments={3} />
    <Cone color={palette.detail} position={[0.62, -0.12, -0.04]} rotation={[0, -0.18, -1.18]} scale={[0.42, 0.56, 0.04]} radialSegments={3} />
    {[0, 1, 2].map((index) => (
      <Cone
        key={index}
        color={palette.accent}
        position={[0, 0.48 - index * 0.19, -0.35]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.06, 0.14, 0.06]}
        radialSegments={3}
      />
    ))}
  </>
);

const RobotDetails = ({ palette }: { palette: ModelPalette }) => (
  <>
    <BoxPart color={palette.detail} position={[0, 0.18, 0.48]} scale={[0.5, 0.05, 0.03]} />
    <BoxPart color={palette.accent} position={[0, 0.68, 0]} scale={[0.04, 0.28, 0.04]} />
    <Sphere color={palette.accent} position={[0, 0.86, 0]} scale={[0.08, 0.08, 0.08]} />
  </>
);

const HumanDetails = ({ palette }: { palette: ModelPalette }) => (
  <>
    <Sphere color={palette.detail} position={[0, 0.54, 0.06]} scale={[0.42, 0.17, 0.09]} />
    <Sphere color={palette.muzzle} position={[0, 0.03, 0.5]} scale={[0.19, 0.12, 0.025]} />
  </>
);

const Tail = ({
  variant,
  palette,
}: {
  variant: AssistantCompanionKind;
  palette: ModelPalette;
}) => {
  if (variant === "dragon") {
    return (
      <Cone color={palette.detail} position={[0.52, -0.54, -0.18]} rotation={[0, 0, -1.18]} scale={[0.12, 0.7, 0.12]} />
    );
  }

  if (variant === "fox") {
    return (
      <>
        <Cone color={palette.head} position={[0.5, -0.46, -0.18]} rotation={[0, 0, -0.92]} scale={[0.2, 0.72, 0.16]} />
        <Cone color={palette.muzzle} position={[0.76, -0.25, -0.17]} rotation={[0, 0, -0.92]} scale={[0.12, 0.24, 0.1]} />
      </>
    );
  }

  if (variant === "cat" || variant === "dog" || variant === "capybara") {
    return (
      <Sphere color={palette.accent} position={[0.48, -0.46, -0.18]} scale={[0.1, 0.42, 0.08]} />
    );
  }

  return null;
};

const SpeciesDetails = ({
  variant,
  palette,
}: {
  variant: AssistantCompanionKind;
  palette: ModelPalette;
}) => {
  if (variant === "owl") {
    return <OwlDetails palette={palette} />;
  }

  if (variant === "dragon") {
    return <DragonDetails palette={palette} />;
  }

  if (variant === "robot") {
    return <RobotDetails palette={palette} />;
  }

  if (variant === "human") {
    return <HumanDetails palette={palette} />;
  }

  return <AnimalEars variant={variant} palette={palette} />;
};

const CompanionModel = ({
  name,
  variant,
  mood,
  lookOffset,
  active,
}: Required<Pick<AssistantAvatarProps, "name" | "variant" | "mood" | "lookOffset" | "active">>) => {
  const groupRef = useRef<Group>(null);
  const palette = palettes[variant];
  const intensity = getMotionIntensity(mood, active);

  useFrame(({ clock }) => {
    const group = groupRef.current;

    if (!group) {
      return;
    }

    const elapsed = clock.getElapsedTime();
    group.position.y =
      moodLift[mood] + Math.sin(elapsed * (1.5 + intensity)) * 0.025 * intensity;
    group.rotation.y =
      clampLookOffset(lookOffset.x) * 0.16 +
      Math.sin(elapsed * 0.7) * 0.08 * intensity;
    group.rotation.x = clampLookOffset(lookOffset.y) * -0.08;
    group.rotation.z =
      mood === "celebrate" ? Math.sin(elapsed * 3.2) * 0.07 : 0;
  });

  return (
    <Float
      speed={mood === "sleepy" ? 0.65 : 1.2}
      rotationIntensity={mood === "sleepy" ? 0.08 : 0.18}
      floatIntensity={mood === "celebrate" ? 0.36 : 0.18}
    >
      <group ref={groupRef} scale={0.9}>
        <Tail variant={variant} palette={palette} />
        <Sphere
          color={palette.body}
          position={[0, -0.42, 0]}
          scale={bodyScaleByVariant[variant]}
        />
        <Sphere
          color={palette.head}
          position={[0, 0.18, 0]}
          scale={headScaleByVariant[variant]}
        />
        <SpeciesDetails variant={variant} palette={palette} />
        <Sphere color={palette.muzzle} position={[0, 0.02, 0.47]} scale={[0.22, 0.14, 0.04]} />
        <Eye side="left" palette={palette} mood={mood} lookOffset={lookOffset} />
        <Eye side="right" palette={palette} mood={mood} lookOffset={lookOffset} />
        <Mouth palette={palette} mood={mood} />
        <Sphere color={palette.accent} position={[-0.2, -0.78, 0.24]} scale={[0.14, 0.08, 0.08]} />
        <Sphere color={palette.accent} position={[0.2, -0.78, 0.24]} scale={[0.14, 0.08, 0.08]} />
      </group>
      <mesh position={[0, -0.95, -0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.62, 48]} />
        <meshBasicMaterial color={palette.shadow} transparent opacity={0.5} side={DoubleSide} />
      </mesh>
      {name ? null : null}
    </Float>
  );
};

export const CompanionCanvas = ({
  name,
  size = 64,
  variant = "robot",
  mood = "idle",
  lookOffset = { x: 0, y: 0 },
  active = false,
}: AssistantAvatarProps) => {
  const initial = name.trim()[0]?.toUpperCase() ?? "A";
  const showInitial = variant === "robot" || variant === "human";

  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        position: "relative",
        filter: `drop-shadow(0 ${Math.round(size * 0.18)}px ${Math.round(
          size * 0.28
        )}px ${palettes[variant].shadow})`,
      }}
    >
      <Canvas
        dpr={[1, 1.8]}
        camera={{ position: [0, 0.1, 4.2], fov: 32 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={1.35} />
        <directionalLight position={[2, 3, 4]} intensity={1.4} />
        <pointLight position={[-2, 1.5, 3]} intensity={0.8} color="#ccfbf1" />
        <CompanionModel
          name={name}
          variant={variant}
          mood={mood}
          lookOffset={lookOffset}
          active={active}
        />
        <ContactShadows
          position={[0, -1.05, 0]}
          opacity={0.22}
          scale={2.2}
          blur={1.5}
          far={1.8}
        />
      </Canvas>
      {showInitial ? (
        <Box
          component="span"
          sx={{
            position: "absolute",
            left: "50%",
            bottom: Math.max(Math.round(size * 0.07), 4),
            transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.88)",
            fontSize: Math.max(Math.round(size * 0.16), 10),
            fontWeight: 900,
            lineHeight: 1,
            pointerEvents: "none",
            textShadow: "0 1px 6px rgba(15,23,42,0.25)",
          }}
        >
          {initial}
        </Box>
      ) : null}
    </Box>
  );
};

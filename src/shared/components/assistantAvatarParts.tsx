import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { AssistantCompanionKind } from "@domain/profile/types";
import type { CompanionVisual } from "./assistantAvatarVisuals";

interface CompanionPartsProps {
  variant: AssistantCompanionKind;
  size: number;
  visual: CompanionVisual;
}

const SHINE_BORDER = "1px solid rgba(255,255,255,0.34)";
const SOFT_DARK = "rgba(15,23,42,0.48)";
const CENTER_X_TRANSFORM = "translateX(-50%)";

const round = (value: number) => Math.round(value);

const scaled = (size: number, ratio: number, min = 1) =>
  Math.max(round(size * ratio), min);

const Part = ({ sx }: { sx: SxProps<Theme> }) => <Box sx={sx} />;

const animalEarVariants = new Set<AssistantCompanionKind>([
  "cat",
  "dog",
  "fox",
  "panda",
  "capybara",
  "raccoon",
  "corgi",
  "wolf",
  "tiger",
  "bear",
  "rabbit",
  "chameleon",
  "lion",
  "otter",
  "hedgehog",
  "koala",
  "deer",
  "turtle",
  "axolotl",
]);

const animalNoseVariants = new Set<AssistantCompanionKind>([
  "cat",
  "dog",
  "fox",
  "panda",
  "capybara",
  "raccoon",
  "corgi",
  "wolf",
  "tiger",
  "bear",
  "rabbit",
  "chameleon",
  "lion",
  "otter",
  "hedgehog",
  "koala",
  "deer",
  "turtle",
  "axolotl",
]);

const AnimalEars = ({ variant, size, visual }: CompanionPartsProps) => {
  if (!animalEarVariants.has(variant)) {
    return null;
  }

  const earSize = scaled(size, variant === "dog" ? 0.24 : 0.23, 10);
  const isPointed =
    variant === "cat" ||
    variant === "fox" ||
    variant === "corgi" ||
    variant === "wolf" ||
    variant === "tiger" ||
    variant === "rabbit" ||
    variant === "deer";
  const isRound =
    variant === "panda" ||
    variant === "capybara" ||
    variant === "bear" ||
    variant === "koala" ||
    variant === "raccoon" ||
    variant === "otter" ||
    variant === "hedgehog";
  const top = isRound ? scaled(size, 0.06) : -scaled(size, 0.025);
  const offset = variant === "panda" ? scaled(size, 0.07) : scaled(size, 0.11);
  const earHeight = variant === "dog" ? scaled(size, 0.36, 16) : earSize;
  const borderRadius = isPointed
    ? "70% 30% 58% 42%"
    : variant === "dog"
      ? "62% 62% 74% 74%"
      : "50%";

  return (
    <>
      {(["left", "right"] as const).map((side) => (
        <Part
          key={side}
          sx={{
            position: "absolute",
            top,
            [side]: offset,
            width: earSize,
            height: earHeight,
            borderRadius,
            background: visual.detail,
            border: SHINE_BORDER,
            transform:
              side === "left"
                ? `rotate(${isPointed ? -28 : -12}deg)`
                : `rotate(${isPointed ? 28 : 12}deg) scaleX(-1)`,
            opacity: 0.92,
            zIndex: 1,
          }}
        />
      ))}
    </>
  );
};

const OwlTufts = ({ size, visual }: Pick<CompanionPartsProps, "size" | "visual">) => (
  <>
    {(["left", "right"] as const).map((side) => (
      <Part
        key={side}
        sx={{
          position: "absolute",
          top: -scaled(size, 0.035),
          [side]: scaled(size, 0.16),
          width: scaled(size, 0.25),
          height: scaled(size, 0.27),
          background: visual.detail,
          clipPath:
            side === "left"
              ? "polygon(50% 0, 100% 100%, 0 78%)"
              : "polygon(50% 0, 100% 78%, 0 100%)",
          transform: `rotate(${side === "left" ? -10 : 10}deg)`,
          zIndex: 1,
        }}
      />
    ))}
  </>
);

const DragonHead = ({ size, visual }: Pick<CompanionPartsProps, "size" | "visual">) => {
  const hornSize = scaled(size, 0.17, 8);

  return (
    <>
      {(["left", "right"] as const).map((side) => (
        <Part
          key={`wing-${side}`}
          sx={{
            position: "absolute",
            top: scaled(size, 0.2),
            [side]: -scaled(size, 0.2),
            width: scaled(size, 0.46),
            height: scaled(size, 0.48),
            background:
              side === "left"
                ? "linear-gradient(135deg, rgba(187,247,208,0.9), rgba(34,197,94,0.6) 45%, rgba(124,58,237,0.78))"
                : "linear-gradient(225deg, rgba(187,247,208,0.9), rgba(34,197,94,0.6) 45%, rgba(124,58,237,0.78))",
            clipPath:
              side === "left"
                ? "polygon(100% 6%, 8% 32%, 58% 50%, 0 78%, 100% 94%)"
                : "polygon(0 6%, 92% 32%, 42% 50%, 100% 78%, 0 94%)",
            borderRadius: side === "left" ? "22% 0 0 54%" : "0 22% 54% 0",
            opacity: 0.92,
            filter: "drop-shadow(0 8px 12px rgba(22,163,74,0.22))",
            zIndex: 0,
          }}
        />
      ))}

      {(["left", "right"] as const).map((side) => (
        <Part
          key={`horn-${side}`}
          sx={{
            position: "absolute",
            top: -scaled(size, 0.08),
            [side]: scaled(size, 0.2),
            width: round(hornSize * 1.1),
            height: round(hornSize * 1.24),
            clipPath:
              side === "left"
                ? "polygon(50% 0, 100% 100%, 0 78%)"
                : "polygon(50% 0, 100% 78%, 0 100%)",
            borderRadius: "20%",
            background: visual.detail,
            transform: `rotate(${side === "left" ? -22 : 22}deg)`,
            border: "1px solid rgba(255,255,255,0.42)",
            zIndex: 3,
          }}
        />
      ))}

      {[0, 1, 2].map((index) => (
        <Part
          key={`spine-${index}`}
          sx={{
            position: "absolute",
            top: round(size * (0.09 + index * 0.105)),
            left: "50%",
            width: scaled(size, 0.11),
            height: scaled(size, 0.12),
            backgroundColor: visual.detail,
            clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
            transform: CENTER_X_TRANSFORM,
            opacity: 0.92 - index * 0.12,
            zIndex: 3,
          }}
        />
      ))}
    </>
  );
};

const RobotAntenna = ({ size, visual }: Pick<CompanionPartsProps, "size" | "visual">) => (
  <Part
    sx={{
      position: "absolute",
      top: -scaled(size, 0.02),
      left: "50%",
      width: scaled(size, 0.04, 2),
      height: scaled(size, 0.18, 9),
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.72)",
      transform: CENTER_X_TRANSFORM,
      "&::after": {
        content: '""',
        position: "absolute",
        top: -scaled(size, 0.04, 2),
        left: "50%",
        width: scaled(size, 0.09, 5),
        height: scaled(size, 0.09, 5),
        borderRadius: "50%",
        backgroundColor: visual.detail,
        transform: CENTER_X_TRANSFORM,
        boxShadow: "0 0 12px rgba(219,234,254,0.72)",
      },
    }}
  />
);

const HumanHair = ({ size }: Pick<CompanionPartsProps, "size">) => (
  <Part
    sx={{
      position: "absolute",
      top: scaled(size, 0.09),
      left: "50%",
      width: scaled(size, 0.48),
      height: scaled(size, 0.2),
      borderRadius: "999px 999px 55% 55%",
      backgroundColor: "rgba(15,23,42,0.34)",
      transform: CENTER_X_TRANSFORM,
    }}
  />
);

export const CompanionHeadParts = (props: CompanionPartsProps) => {
  if (props.variant === "owl") {
    return <OwlTufts size={props.size} visual={props.visual} />;
  }

  if (
    props.variant === "dragon" ||
    props.variant === "phoenix" ||
    props.variant === "forest_spirit" ||
    props.variant === "cosmic_beast"
  ) {
    return <DragonHead size={props.size} visual={props.visual} />;
  }

  if (props.variant === "robot") {
    return <RobotAntenna size={props.size} visual={props.visual} />;
  }

  if (props.variant === "human") {
    return <HumanHair size={props.size} />;
  }

  return <AnimalEars {...props} />;
};

const bodyVariants = new Set<AssistantCompanionKind>([
  "cat",
  "dog",
  "fox",
  "panda",
  "owl",
  "capybara",
  "dragon",
  "raccoon",
  "corgi",
  "wolf",
  "tiger",
  "bear",
  "rabbit",
  "chameleon",
  "lion",
  "otter",
  "hedgehog",
  "koala",
  "deer",
  "turtle",
  "axolotl",
  "phoenix",
  "forest_spirit",
  "cosmic_beast",
]);

const tailVariants = new Set<AssistantCompanionKind>([
  "cat",
  "dog",
  "fox",
  "capybara",
  "dragon",
  "raccoon",
  "corgi",
  "wolf",
  "tiger",
  "rabbit",
  "chameleon",
  "lion",
  "otter",
  "deer",
  "phoenix",
  "forest_spirit",
  "cosmic_beast",
]);

const BodyPaws = ({ variant, size, visual }: CompanionPartsProps) => {
  if (!bodyVariants.has(variant)) {
    return null;
  }

  return (
    <>
      {(["left", "right"] as const).map((side) => (
        <Part
          key={`paw-${side}`}
          sx={{
            position: "absolute",
            bottom: -scaled(size, 0.035),
            [side]: scaled(size, 0.22),
            width: scaled(size, variant === "dragon" ? 0.2 : 0.18),
            height: scaled(size, 0.14),
            borderRadius: "58% 58% 46% 46%",
            background:
              variant === "panda"
                ? "rgba(15,23,42,0.82)"
                : `linear-gradient(180deg, ${visual.detail} 0%, ${visual.muzzle} 100%)`,
            border: SHINE_BORDER,
            boxShadow: "0 8px 16px rgba(15,23,42,0.14)",
            transform: `rotate(${side === "left" ? -8 : 8}deg)`,
            zIndex: 2,
          }}
        />
      ))}
    </>
  );
};

const BodyTail = ({ variant, size, visual }: CompanionPartsProps) => {
  if (!tailVariants.has(variant)) {
    return null;
  }

  const isDragon = variant === "dragon";
  const isFox = variant === "fox";

  return (
    <Part
      sx={{
        position: "absolute",
        right: isDragon ? -scaled(size, 0.2) : -scaled(size, 0.14),
        bottom: isDragon ? scaled(size, 0.04) : scaled(size, 0.02),
        width: scaled(size, isDragon ? 0.48 : 0.38),
        height: scaled(size, isDragon ? 0.26 : 0.2),
        borderRadius: isDragon ? "10% 80% 80% 20%" : "999px",
        borderTop: `${scaled(size, isDragon ? 0.075 : 0.08, 3)}px solid ${
          isFox ? "rgba(255,237,213,0.95)" : visual.detail
        }`,
        borderRight: `${scaled(size, isDragon ? 0.055 : 0.065, 2)}px solid ${
          isDragon ? "rgba(124,58,237,0.82)" : visual.detail
        }`,
        transform: `rotate(${isDragon ? 22 : 20}deg)`,
        filter: "drop-shadow(0 8px 12px rgba(15,23,42,0.16))",
        opacity: 0.94,
        zIndex: 0,
      }}
    />
  );
};

export const CompanionBodyParts = (props: CompanionPartsProps) => (
  <>
    <BodyTail {...props} />
    <BodyPaws {...props} />
  </>
);

const getMainMuzzleBackground = (
  variant: AssistantCompanionKind,
  visual: CompanionVisual
) => {
  if (variant === "panda") {
    return "linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.54) 100%)";
  }

  if (variant === "owl") {
    return "radial-gradient(circle at 30% 38%, rgba(255,255,255,0.5) 0 18%, transparent 19%), radial-gradient(circle at 70% 38%, rgba(255,255,255,0.5) 0 18%, transparent 19%), linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)";
  }

  return `linear-gradient(180deg, ${visual.muzzle} 0%, rgba(255,255,255,0.08) 100%)`;
};

const MainMuzzle = ({ variant, size, visual }: CompanionPartsProps) => (
  <Part
    sx={{
      position: "absolute",
      inset: Math.max(round(size * 0.2), 10),
      top: Math.max(round(size * 0.22), 10),
      bottom: Math.max(round(size * 0.16), 8),
      borderRadius:
        variant === "fox"
          ? "42% 42% 68% 68%"
          : variant === "robot"
            ? "24%"
            : variant === "capybara"
              ? "48% 48% 42% 42%"
              : "46% 46% 52% 52%",
      background: getMainMuzzleBackground(variant, visual),
      border: "1px solid rgba(255,255,255,0.24)",
      zIndex: 1,
    }}
  />
);

const RobotVisorPanel = ({ size }: Pick<CompanionPartsProps, "size">) => (
  <Box
    data-assistant-avatar-robot-visor="true"
    sx={{
      position: "absolute",
      top: scaled(size, 0.3),
      left: "50%",
      width: scaled(size, 0.58, 24),
      height: scaled(size, 0.34, 16),
      transform: CENTER_X_TRANSFORM,
      borderRadius: "38% 38% 44% 44%",
      background:
        "radial-gradient(circle at 30% 34%, rgba(94,234,212,0.2), transparent 18%), radial-gradient(circle at 70% 34%, rgba(134,239,172,0.18), transparent 18%), linear-gradient(180deg, #020617 0%, #082f49 48%, #031827 100%)",
      border: "1px solid rgba(125, 211, 252, 0.34)",
      boxShadow:
        "inset 0 8px 14px rgba(255,255,255,0.08), inset 0 -10px 18px rgba(0,0,0,0.38), 0 0 18px rgba(34,211,238,0.24)",
      zIndex: 4,
      "&::before": {
        content: '""',
        position: "absolute",
        inset: scaled(size, 0.04, 2),
        borderRadius: "inherit",
        borderTop: "1px solid rgba(255,255,255,0.26)",
        opacity: 0.86,
      },
    }}
  />
);

const SpeciesFaceMarks = ({ variant, size, visual }: CompanionPartsProps) => {
  if (variant === "fox") {
    return (
      <>
        <Part
          sx={{
            position: "absolute",
            left: "50%",
            bottom: scaled(size, 0.2),
            width: scaled(size, 0.28),
            height: scaled(size, 0.22),
            transform: CENTER_X_TRANSFORM,
            backgroundColor: visual.muzzle,
            clipPath: "polygon(50% 100%, 0 0, 100% 0)",
            zIndex: 2,
          }}
        />
        <Part
          sx={{
            position: "absolute",
            right: -scaled(size, 0.1),
            bottom: scaled(size, 0.04),
            width: scaled(size, 0.42),
            height: scaled(size, 0.2),
            borderRadius: "0 999px 999px 0",
            borderRight: `${scaled(size, 0.05, 2)}px solid rgba(255,237,213,0.9)`,
            borderBottom: `${scaled(size, 0.05, 2)}px solid rgba(255,237,213,0.72)`,
            transform: "rotate(18deg)",
            zIndex: 0,
          }}
        />
      </>
    );
  }

  if (variant === "dog") {
    return (
      <Part
        sx={{
          position: "absolute",
          left: "50%",
          top: scaled(size, 0.5),
          width: scaled(size, 0.26),
          height: scaled(size, 0.17),
          transform: CENTER_X_TRANSFORM,
          borderRadius: "50%",
          backgroundColor: visual.muzzle,
          zIndex: 2,
        }}
      />
    );
  }

  if (variant === "cat") {
    return (
      <>
        {[-1, 0, 1].map((index) => (
          <Part
            key={index}
            sx={{
              position: "absolute",
              top: scaled(size, 0.19 + Math.abs(index) * 0.035),
              left: "50%",
              width: scaled(size, 0.055),
              height: scaled(size, 0.14),
              borderRadius: 999,
              backgroundColor: "rgba(255,237,213,0.56)",
              transform: `translateX(${index * scaled(size, 0.08)}px) rotate(${index * 12}deg)`,
              zIndex: 2,
            }}
          />
        ))}
      </>
    );
  }

  if (variant === "panda") {
    return (
      <>
        {(["left", "right"] as const).map((side) => (
          <Part
            key={side}
            sx={{
              position: "absolute",
              top: scaled(size, 0.31),
              [side]: scaled(size, 0.24),
              width: scaled(size, 0.24),
              height: scaled(size, 0.22),
              borderRadius: "50%",
              backgroundColor: "rgba(15,23,42,0.78)",
              transform: `rotate(${side === "left" ? -16 : 16}deg)`,
              zIndex: 2,
            }}
          />
        ))}
      </>
    );
  }

  if (variant === "owl") {
    return (
      <Part
        sx={{
          position: "absolute",
          top: scaled(size, 0.49),
          left: "50%",
          width: scaled(size, 0.15),
          height: scaled(size, 0.13),
          transform: CENTER_X_TRANSFORM,
          clipPath: "polygon(50% 100%, 0 0, 100% 0)",
          backgroundColor: "#f97316",
          filter: "drop-shadow(0 2px 2px rgba(15,23,42,0.18))",
          zIndex: 3,
        }}
      />
    );
  }

  if (variant === "dragon") {
    return (
      <>
        <Part
          sx={{
            position: "absolute",
            top: scaled(size, 0.17),
            right: scaled(size, 0.04),
            width: scaled(size, 0.13),
            height: scaled(size, 0.56),
            background:
              "repeating-linear-gradient(180deg, rgba(253,230,138,0.96) 0 7px, rgba(124,58,237,0.78) 7px 13px)",
            clipPath:
              "polygon(100% 0, 0 12%, 100% 24%, 0 36%, 100% 48%, 0 60%, 100% 72%, 0 84%, 100% 100%)",
            opacity: 0.9,
            zIndex: 3,
          }}
        />
        <Part
          sx={{
            position: "absolute",
            left: -scaled(size, 0.1),
            bottom: scaled(size, 0.05),
            width: scaled(size, 0.44),
            height: scaled(size, 0.2),
            borderRadius: "999px 0 0 999px",
            borderLeft: `${scaled(size, 0.045, 2)}px solid rgba(253,230,138,0.86)`,
            borderBottom: `${scaled(size, 0.045, 2)}px solid rgba(253,230,138,0.76)`,
            transform: "rotate(-16deg)",
            opacity: 0.88,
            zIndex: 0,
          }}
        />
        <Part
          sx={{
            position: "absolute",
            left: "50%",
            bottom: scaled(size, 0.15),
            width: scaled(size, 0.42),
            height: scaled(size, 0.22),
            transform: CENTER_X_TRANSFORM,
            borderRadius: "55% 55% 70% 70%",
            backgroundColor: visual.muzzle,
            border: "1px solid rgba(255,255,255,0.26)",
            zIndex: 3,
            "&::before, &::after": {
              content: '""',
              position: "absolute",
              top: "46%",
              width: scaled(size, 0.035),
              height: scaled(size, 0.035),
              borderRadius: "50%",
              backgroundColor: SOFT_DARK,
            },
            "&::before": {
              left: "33%",
            },
            "&::after": {
              right: "33%",
            },
          }}
        />
      </>
    );
  }

  return null;
};

const AnimalNose = ({ variant, size }: Pick<CompanionPartsProps, "variant" | "size">) => {
  if (!animalNoseVariants.has(variant)) {
    return null;
  }

  return (
    <>
      <Part
        sx={{
          position: "absolute",
          top: scaled(size, 0.51),
          left: "50%",
          width: scaled(size, 0.1),
          height: scaled(size, 0.075),
          transform: CENTER_X_TRANSFORM,
          borderRadius:
            variant === "dog" || variant === "panda" ? "50%" : "55% 55% 70% 70%",
          backgroundColor:
            variant === "panda" ? "rgba(15,23,42,0.86)" : "rgba(15,23,42,0.42)",
          zIndex: 4,
        }}
      />

      {(variant === "cat" || variant === "fox") &&
        ([-1, 1] as const).map((direction) => (
          <Part
            key={direction}
            sx={{
              position: "absolute",
              top: scaled(size, 0.55),
              left: direction < 0 ? scaled(size, 0.18) : "auto",
              right: direction > 0 ? scaled(size, 0.18) : "auto",
              width: scaled(size, 0.22),
              height: 1,
              backgroundColor: "rgba(255,255,255,0.68)",
              boxShadow: `0 ${scaled(size, 0.045)}px 0 rgba(255,255,255,0.5)`,
              transform: `rotate(${direction < 0 ? "8deg" : "-8deg"})`,
              transformOrigin: direction < 0 ? "100% 50%" : "0 50%",
              zIndex: 4,
            }}
          />
        ))}
    </>
  );
};

export const CompanionFaceParts = (props: CompanionPartsProps) => (
  <>
    {props.variant === "robot" ? (
      <RobotVisorPanel size={props.size} />
    ) : (
      <>
        <MainMuzzle {...props} />
        <SpeciesFaceMarks {...props} />
        <AnimalNose variant={props.variant} size={props.size} />
      </>
    )}
  </>
);

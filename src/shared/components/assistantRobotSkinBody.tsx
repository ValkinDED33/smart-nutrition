import { Box } from "@mui/material";
import { motion } from "framer-motion";
import type { AssistantCompanionKind } from "@domain/profile/types";
import { assistantEyeBlinkTransition } from "@shared/ui/motion/assistant";
import { getRobotSkinPalette } from "./assistantAvatarVisuals";
import type { AssistantAvatarMood } from "./assistantAvatarTypes";
const R = (v: number) => Math.round(v);
const CX = "translateX(-50%)";
export interface SkinBodyProps {
  size: number;
  mood: AssistantAvatarMood;
  variant: AssistantCompanionKind;
  eyeX: number;
  eyeY: number;
  lineWidth: number;
  active: boolean;
}
type Skin = ReturnType<typeof getRobotSkinPalette>;
const shellOf = (s: Skin) => `radial-gradient(circle at 46% 20%, rgba(255,255,255,0.95), transparent 30%), linear-gradient(180deg, ${s.shellHighlight} 0%, ${s.shell} 58%, ${s.shellShadow} 100%)`;
const Glow = ({ s, n, active }: { s: Skin; n: number; active: boolean }) => (
  <>
    <Box sx={{ position: "absolute", left: "50%", bottom: 0, width: R(n * 1.02), height: R(n * 0.16), transform: CX, borderRadius: "50%", background: `radial-gradient(ellipse at center, ${s.coreGlow} 0%, transparent 68%)`, opacity: active ? 0.95 : 0.7 }} />
    <Box sx={{ position: "absolute", left: "50%", bottom: R(n * 0.035), width: R(n * 0.82), height: R(n * 0.075), transform: CX, borderRadius: "50%", border: `1px solid ${s.coreGlow}`, background: "rgba(2,8,20,0.45)" }} />
  </>
);
const Legs = ({ s, n }: { s: Skin; n: number }) => (
  <>
    {(["left", "right"] as const).map((side) => (
      <Box key={side} sx={{ position: "absolute", bottom: R(n * 0.08), [side]: R(n * 0.27), width: R(n * 0.19), height: R(n * 0.28), borderRadius: "40% 40% 46% 46%", background: shellOf(s), border: "1px solid rgba(255,255,255,0.45)" }}>
        <Box sx={{ position: "absolute", left: "50%", bottom: -R(n * 0.025), width: R(n * 0.23), height: R(n * 0.1), transform: CX, borderRadius: 999, background: shellOf(s), border: "1px solid rgba(255,255,255,0.4)" }} />
      </Box>
    ))}
  </>
);
const Arms = ({ s, n }: { s: Skin; n: number }) => (
  <Box data-assistant-avatar-robot-arms="true" sx={{ position: "absolute", inset: 0 }}>
    {(["left", "right"] as const).map((side) => (
      <Box key={side} sx={{ position: "absolute", top: R(n * 0.62), [side]: R(n * 0.055), width: R(n * 0.17), height: R(n * 0.34), borderRadius: 999, background: shellOf(s), border: "1px solid rgba(255,255,255,0.45)", transform: side === "left" ? "rotate(18deg)" : "rotate(-18deg)", transformOrigin: "50% 12%" }}>
        <Box sx={{ position: "absolute", left: "50%", bottom: R(n * 0.03), width: R(n * 0.12), height: R(n * 0.12), transform: CX, borderRadius: "50%", background: shellOf(s) }} />
      </Box>
    ))}
  </Box>
);
const Torso = ({ s, n }: { s: Skin; n: number }) => (
  <Box data-assistant-avatar-robot-shell="true" sx={{ position: "absolute", left: "50%", top: R(n * 0.58), width: R(n * 0.62), height: R(n * 0.52), transform: CX, borderRadius: "44% 44% 40% 40%", background: shellOf(s), border: "1px solid rgba(255,255,255,0.55)" }}>
    <Box data-assistant-avatar-heart-core="true" sx={{ position: "absolute", left: "50%", top: R(n * 0.16), width: R(n * 0.3), height: R(n * 0.3), transform: "translateX(-50%) rotate(-45deg)", borderRadius: "30%", background: `linear-gradient(135deg, ${s.core}, ${s.shellHighlight})`, boxShadow: `0 0 ${R(n * 0.14)}px ${s.coreGlow}` }} />
  </Box>
);
const Ears = ({ s, n }: { s: Skin; n: number }) => (
  <Box data-assistant-avatar-robot-headset="true" sx={{ position: "absolute", inset: 0 }}>
    {(["left", "right"] as const).map((side) => (
      <Box key={side} sx={{ position: "absolute", top: R(n * 0.24), [side]: R(n * 0.085), width: R(n * 0.1), height: R(n * 0.24), borderRadius: 999, background: shellOf(s), border: "1px solid rgba(255,255,255,0.55)", "&::after": { content: '""', position: "absolute", inset: 2, borderRadius: "inherit", background: `linear-gradient(180deg, ${s.sideLight}, ${s.core})`, opacity: 0.9 } }} />
    ))}
  </Box>
);
const Head = (q: { s: Skin; n: number; mood: AssistantAvatarMood; sleepy: boolean; eyeX: number; eyeY: number; lineWidth: number }) => {
  const { s, n } = q;
  const celeb = q.mood === "celebrate";
  const concerned = q.mood === "concerned";
  const headBg = celeb ? `linear-gradient(145deg, #fff 0%, ${s.shell} 50%, ${s.core} 100%)` : shellOf(s);
  const eyeW = Math.max(R(n * 0.11), 6);
  const eyeH = Math.max(R(n * 0.085), 5);
  return (
    <Box sx={{ position: "absolute", left: "50%", top: R(n * 0.02), width: R(n * 0.78), height: R(n * 0.6), transform: CX, borderRadius: "46% 46% 44% 44%", background: headBg, overflow: "hidden" }}>
      <Box sx={{ position: "absolute", left: "50%", top: R(n * 0.12), width: R(n * 0.62), height: R(n * 0.4), transform: CX, borderRadius: "48%", background: `linear-gradient(180deg, ${s.visor}, #0b1628)`, border: `1px solid ${s.coreGlow}` }}>
        {(["left", "right"] as const).map((side) => (
          <Box key={side} component={motion.span} animate={{ scaleY: q.sleepy ? 0.25 : [1, 1, 0.12, 1, 1] }} transition={q.sleepy ? { duration: 0.18 } : assistantEyeBlinkTransition} sx={{ position: "absolute", top: "34%", [side]: "20%", width: eyeW, height: concerned ? 2 : eyeH, borderRadius: 999, background: `linear-gradient(180deg, #fff, ${s.eye} 45%, ${s.core})`, transform: `translate(${R(q.eyeX)}px, ${R(q.eyeY)}px)` }} />
        ))}
        <Box sx={{ position: "absolute", left: "50%", bottom: "16%", width: celeb ? R(n * 0.17) : R(n * 0.13), height: concerned ? 0 : 3, transform: CX, borderRadius: 999, borderBottom: concerned ? "none" : `${q.lineWidth}px solid rgba(255,255,255,0.92)`, borderTop: concerned ? `${q.lineWidth}px solid #fff` : "none" }} />
      </Box>
    </Box>
  );
};
export const RobotSkinBody = (p: SkinBodyProps) => {
  const s = getRobotSkinPalette(p.variant);
  const n = p.size;
  return (
    <Box sx={{ position: "relative", width: n, height: n * 1.48, transform: `translateY(${R(n * 0.1)}px)` }}>
      <Glow s={s} n={n} active={p.active} />
      <Legs s={s} n={n} />
      <Arms s={s} n={n} />
      <Torso s={s} n={n} />
      <Ears s={s} n={n} />
      <Head s={s} n={n} mood={p.mood} sleepy={p.mood === "sleepy"} eyeX={p.eyeX} eyeY={p.eyeY} lineWidth={p.lineWidth} />
    </Box>
  );
};
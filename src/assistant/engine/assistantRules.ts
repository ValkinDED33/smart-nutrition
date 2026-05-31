import type { AssistantRuleMap } from "./assistantTypes";

export const assistantRules: AssistantRuleMap = {
  OPEN_APP: {
    young: {
      scene: "home",
      prop: "phone",
      animation: "smoke_in",
      mood: "happy",
      reaction: "nod",
    },
    adult: {
      scene: "office",
      prop: "laptop",
      animation: "smoke_in",
      mood: "focused",
      reaction: "typing",
    },
    elder: {
      scene: "classic_office",
      prop: "typewriter",
      animation: "smoke_in",
      mood: "calm",
      reaction: "slow_think",
    },
  },
  WATER_DRANK: {
    young: {
      scene: "home",
      prop: "tablet",
      animation: "smoke_in",
      mood: "happy",
      reaction: "drink",
    },
    adult: {
      scene: "office",
      prop: "laptop",
      animation: "smoke_in",
      mood: "focused",
      reaction: "nod",
    },
    elder: {
      scene: "classic_office",
      prop: "typewriter",
      animation: "smoke_in",
      mood: "calm",
      reaction: "slow_drink",
    },
  },
  MEAL_ADDED: {
    young: {
      scene: "kitchen",
      prop: "phone",
      animation: "smoke_in",
      mood: "happy",
      reaction: "typing",
    },
    adult: {
      scene: "office",
      prop: "laptop",
      animation: "typing",
      mood: "focused",
      reaction: "typing",
    },
    elder: {
      scene: "classic_office",
      prop: "typewriter",
      animation: "slow_think",
      mood: "calm",
      reaction: "slow_think",
    },
  },
  WORKOUT_DONE: {
    young: {
      scene: "gym",
      prop: "phone",
      animation: "smoke_in",
      mood: "happy",
      reaction: "nod",
    },
    adult: {
      scene: "gym",
      prop: "tablet",
      animation: "smoke_in",
      mood: "focused",
      reaction: "nod",
    },
    elder: {
      scene: "home",
      prop: "tablet",
      animation: "smoke_in",
      mood: "calm",
      reaction: "slow_think",
    },
  },
  IDLE: {
    young: {
      scene: "home",
      prop: "phone",
      animation: "none",
      mood: "neutral",
    },
    adult: {
      scene: "office",
      prop: "laptop",
      animation: "none",
      mood: "neutral",
    },
    elder: {
      scene: "classic_office",
      prop: "typewriter",
      animation: "none",
      mood: "calm",
    },
  },
};

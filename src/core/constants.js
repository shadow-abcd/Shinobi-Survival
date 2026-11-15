// Constants — Single source of truth (Audit Fix)
// Was scattered: 165/150 HP, 180 elite, 0.7 CDR cap, 100 Chakra in world.js
export const PLAYER_HP = 165;
export const ELITE_TIMER = 180;
export const CDR_CAP = 0.7;
export const CHAKRA_MAX = 100;
export const MAX_FRAME_TIME = 0.1; // Clamp deltaTime to 100ms — prevents spiral-of-death on lag spike
export const POOL_WARN_ENEMIES = 1400;
export const SAVE_VERSION = 2;

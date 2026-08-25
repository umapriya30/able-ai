export type ScreenName = "handoff" | "home" | "newgoal" | "timeline" | "whatif" | "habits" | "rewards";

// The arrow-key run of show. "whatif" is a side path reached from the timeline's
// ghost button and isn't part of it, matching prototype/index.html.
export const SCREENS: ScreenName[] = ["handoff", "home", "newgoal", "timeline", "habits", "rewards"];

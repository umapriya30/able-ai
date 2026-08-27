export type ScreenName =
  | "linking"
  | "analysing"
  | "handoff"
  | "home"
  | "newgoal"
  | "breakdown"
  | "timeline"
  | "whatif"
  | "habits"
  | "rewards"
  | "editgoal"
  | "settings";

// The arrow-key run of show. "breakdown" is the reality check (design boards
// 07-09) and carries the demo; "whatif" is a side path off the timeline and
// isn't part of the run, matching prototype/index.html.
export const SCREENS: ScreenName[] = [
  "linking",
  "home",
  "newgoal",
  "breakdown",
  "rewards",
  "settings",
];

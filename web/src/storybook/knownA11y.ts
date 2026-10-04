import issues from "./known-a11y.json";

// Keep known app faults visible in the Accessibility panel. Only listed stories
// use todo mode; new stories retain the preview's strict error mode.
export function knownA11y(story: string) {
  const issue = issues.find(item => item.story === story);
  if (!issue) throw new Error(`Missing accessibility fault record: ${story}`);
  return { a11y: { test: "todo" }, knownA11y: issue };
}

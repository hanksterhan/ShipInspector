import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { sourceInventory, webRoot } from "./source-inventory.mjs";

const partial = process.argv.includes("--partial");
const register = JSON.parse(
  fs.readFileSync(path.join(webRoot, "src/storybook/coverage.json"), "utf8"),
);
const index = JSON.parse(
  fs.readFileSync(path.join(webRoot, "storybook-static/index.json"), "utf8"),
);
const entries = Object.values(index.entries).filter(
  (entry) => entry.type === "story",
);
const faults = JSON.parse(
  fs.readFileSync(path.join(webRoot, "src/storybook/known-a11y.json"), "utf8"),
);
const errors = [];
const inventory = sourceInventory();
if (new Set(register.map((row) => row.source)).size !== register.length)
  errors.push("Duplicate source rows");
if (new Set(faults.map((row) => row.story)).size !== faults.length)
  errors.push("Duplicate accessibility records");
for (const item of inventory) {
  const row = register.find((row) => row.source === item.source);
  if (!row) errors.push(`Unregistered source: ${item.source}`);
  else if (
    JSON.stringify([...row.elements].sort()) !==
    JSON.stringify([...item.elements].sort())
  )
    errors.push(`Changed elements: ${item.source}`);
}
const mappings = [];
for (const row of register) {
  if (new Set(row.states).size !== row.states.length)
    errors.push(`Duplicate states: ${row.source}`);
  if (!inventory.some((item) => item.source === row.source))
    errors.push(`Stale source: ${row.source}`);
  if (row.coverage === "support") {
    if (!row.reason) errors.push(`Missing support reason: ${row.source}`);
    if (!row.states.length) continue;
  }
  if (!row.storyFile || !row.states.length)
    errors.push(`Empty visual coverage: ${row.source}`);
  const file = path.join(webRoot, "src", row.storyFile);
  const exports = new Set();
  if (fs.existsSync(file)) {
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    for (const statement of source.statements) {
      if (
        !ts.isVariableStatement(statement) ||
        !statement.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
        )
      )
        continue;
      for (const declaration of statement.declarationList.declarations)
        if (ts.isIdentifier(declaration.name))
          exports.add(declaration.name.text);
    }
  }
  for (const state of row.states) {
    const matches = entries.filter(
      (entry) =>
        entry.importPath === `./src/${row.storyFile}` &&
        entry.exportName === state,
    );
    if (!exports.has(state) || matches.length !== 1)
      errors.push(`Missing state: ${row.source} / ${state}`);
    else
      mappings.push({
        source: row.source,
        elements: row.elements,
        inline: row.inline ?? [],
        state,
        storyId: matches[0].id,
      });
  }
}
const mappedIds = new Set(mappings.map((mapping) => mapping.storyId));
for (const entry of entries)
  if (!mappedIds.has(entry.id)) errors.push(`Unregistered story: ${entry.id}`);
for (const fault of faults)
  if (!entries.some((entry) => entry.id === fault.story))
    errors.push(`Stale accessibility record: ${fault.story}`);
const resultArg = process.argv.indexOf("--results");
let executed = 0;
function findTest(results, entry) {
  const file = results.testResults.find(
    (file) =>
      path.resolve(file.name) === path.resolve(webRoot, entry.importPath),
  );
  return file?.assertionResults.find((test) => test.title === entry.name);
}
if (resultArg >= 0) {
  const results = JSON.parse(
    fs.readFileSync(process.argv[resultArg + 1], "utf8"),
  );
  for (const id of new Set(mappings.map((mapping) => mapping.storyId))) {
    const entry = entries.find((entry) => entry.id === id);
    const test = findTest(results, entry);
    if (!test || test.status !== "passed")
      errors.push(`Not passed in browser: ${id}`);
    else executed++;
  }
  if (results.numFailedTests || results.numFailedTestSuites || !executed)
    errors.push("Browser run is failed or empty");
}
// A separate strict run must reproduce only the exact recorded axe rules.
// This prevents todo mode from hiding a new fault in an already listed story.
const a11yArg = process.argv.indexOf("--a11y-results");
let auditedAccessibilityStories = 0;
if (a11yArg >= 0) {
  const results = JSON.parse(
    fs.readFileSync(process.argv[a11yArg + 1], "utf8"),
  );
  for (const entry of entries) {
    const test = findTest(results, entry);
    const fault = faults.find((fault) => fault.story === entry.id);
    if (!test) {
      errors.push(`Not run in strict accessibility audit: ${entry.id}`);
      continue;
    }
    if (!fault) {
      if (test.status !== "passed")
        errors.push(`New strict accessibility failure: ${entry.id}`);
      continue;
    }
    const message = test.failureMessages
      .join("\n")
      .replace(/\x1b\[[0-9;]*m/g, "");
    const rules = [
      ...new Set(
        [...message.matchAll(/\(([a-z]+(?:-[a-z]+)+)\)/g)].map(
          (match) => match[1],
        ),
      ),
    ].sort();
    if (
      test.status !== "failed" ||
      JSON.stringify(rules) !== JSON.stringify([...fault.rules].sort()) ||
      !message.includes("toHaveNoViolations")
    )
      errors.push(`Changed accessibility record: ${entry.id}`);
    else auditedAccessibilityStories++;
  }
  if (
    results.testResults.some((file) => !file.assertionResults.length) ||
    results.numTotalTests !== entries.length
  )
    errors.push("Strict audit has missing or empty suites");
}
const report = {
  sources: inventory.length,
  elements: inventory.reduce((n, item) => n + item.elements.length, 0),
  requiredStateMappings: register.reduce((n, row) => n + row.states.length, 0),
  mappedStates: mappings.length,
  builtStories: entries.length,
  mappedStories: new Set(mappings.map((mapping) => mapping.storyId)).size,
  executed,
  knownAccessibilityStories: faults.length,
  auditedAccessibilityStories,
  errors,
  mappings,
};
fs.mkdirSync(path.join(webRoot, "storybook-results"), { recursive: true });
fs.writeFileSync(
  path.join(webRoot, "storybook-results/coverage.json"),
  JSON.stringify(report, null, 2),
);
console.log(
  `${report.sources} sources; ${report.elements} elements; ${report.mappedStates}/${report.requiredStateMappings} state mappings; ${report.builtStories} built stories; ${report.executed} passed browser stories`,
);
if (errors.length) {
  console.log(
    `${errors.length} coverage gaps. Details: web/storybook-results/coverage.json`,
  );
  if (!partial) process.exitCode = 1;
} else
  console.log(
    "Source, state exports, and built index agree. Browser proof is reported only with --results.",
  );

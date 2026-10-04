import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

export const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function sourceInventory() {
  const root = path.join(webRoot, "src");
  return fs.readdirSync(root, { recursive: true })
    .filter((file) => file.endsWith(".tsx") && !/\.(test|stories)\.tsx$/.test(file) && !file.startsWith("storybook/"))
    .sort()
    .map((source) => {
      const ast = ts.createSourceFile(source, fs.readFileSync(path.join(root, source), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const elements = new Set();
      const visit = (node) => {
        if (ts.isFunctionDeclaration(node) && node.name && /^[A-Z]/.test(node.name.text)) elements.add(node.name.text);
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && /^[A-Z]/.test(node.name.text) && node.initializer) {
          const value = node.initializer;
          if (ts.isArrowFunction(value) || ts.isFunctionExpression(value) ||
              (ts.isCallExpression(value) && /forwardRef|memo/.test(value.expression.getText(ast))) ||
              (ts.isPropertyAccessExpression(value) && /Primitive/.test(value.getText(ast)))) elements.add(node.name.text);
        }
        ts.forEachChild(node, visit);
      };
      visit(ast);
      return { source, elements: [...elements] };
    });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rows = JSON.parse(fs.readFileSync(path.join(webRoot, "src/storybook/coverage.json"), "utf8"));
  const discovered = sourceInventory();
  const errors = [];
  for (const entry of discovered) {
    const row = rows.find((candidate) => candidate.source === entry.source);
    if (!row) { errors.push(`Missing source: ${entry.source}`); continue; }
    for (const element of entry.elements) if (!row.elements.includes(element)) errors.push(`Missing element: ${entry.source}:${element}`);
    if (row.coverage === "support" ? !row.reason : !row.states?.length || !row.storyFile) errors.push(`Missing coverage contract: ${entry.source}`);
  }
  for (const row of rows) if (!discovered.some((entry) => entry.source === row.source)) errors.push(`Stale source: ${row.source}`);
  if (new Set(rows.map((row) => row.source)).size !== rows.length) errors.push("Duplicate source rows");
  console.log(`${discovered.length} production TSX files; ${discovered.reduce((sum, entry) => sum + entry.elements.length, 0)} component candidates; ${rows.reduce((sum, row) => sum + row.states.length, 0)} required state mappings.`);
  if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
  else console.log("Source inventory is reconciled. Story execution remains a separate check.");
}

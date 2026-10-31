const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const project = path.resolve(__dirname, "..");
const dist = path.join(project, "dist");
const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");

for (const file of ["index.html", "styles.css", "algorithms.js", "app.js"]) {
  assert.ok(fs.existsSync(path.join(dist, file)), `Missing dist/${file}`);
}

for (const id of ["dashboard", "portal", "scheduling", "concurrency", "deadlock", "memory", "disk", "monitor"]) {
  assert.match(html, new RegExp(`id="${id}-template"`), `Missing ${id} template`);
  assert.match(html, new RegExp(`data-view="${id}"`), `Missing ${id} navigation button`);
}

assert.doesNotMatch(html, /https?:\/\//, "The local project should not depend on external assets.");
assert.equal(fs.readdirSync(path.join(project, "linux_scripts")).filter((f) => f.endsWith(".sh")).length, 5);
assert.equal(fs.readdirSync(path.join(project, "diagrams")).filter((f) => f.endsWith(".png") && f !== "contact_sheet.png").length, 8);

console.log("Static project validation passed.");

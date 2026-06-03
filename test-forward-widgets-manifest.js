const fs = require("fs");
const assert = require("assert/strict");

const manifestPath = "widgets.fwd";
assert.equal(fs.existsSync(manifestPath), true, "widgets.fwd should exist");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

assert.equal(manifest.title, "Forward Douban Widgets");
assert.equal(typeof manifest.description, "string");
assert.ok(Array.isArray(manifest.widgets));
assert.equal(manifest.widgets.length, 1);

const widget = manifest.widgets[0];
assert.equal(widget.id, "doubanmonthlyhot");
assert.match(widget.id, /^[A-Za-z0-9.]+$/);
assert.equal(widget.title, "豆瓣本月热播");
assert.equal(widget.requiredVersion, "0.0.1");
assert.equal(widget.version, "1.0.0");
assert.equal(widget.author, "Forward");
assert.equal(
  widget.url,
  "https://raw.githubusercontent.com/zhadqqqqd/forward-douban-monthly-hot/refs/heads/main/widgets/douban-monthly-hot.js"
);
assert.equal(widget.url.includes("/refs/heads/main/"), true);

console.log("ok");

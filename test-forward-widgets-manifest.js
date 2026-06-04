const fs = require("fs");
const vm = require("vm");
const assert = require("assert/strict");

const manifestPath = "widgets.fwd";
assert.equal(fs.existsSync(manifestPath), true, "widgets.fwd should exist");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const widgetModulePath = "widgets/douban-monthly-hot.js";
const metadata = loadWidgetMetadata(widgetModulePath);
const functionGlobalMetadata = loadWidgetMetadataFromFunctionGlobal(widgetModulePath);
assert.equal(
  functionGlobalMetadata.id,
  metadata.id,
  "WidgetMetadata should be visible when the app executes source with Function"
);

assert.equal(manifest.title, "Forward Douban Widgets");
assert.equal(typeof manifest.description, "string");
assert.ok(Array.isArray(manifest.widgets));
assert.equal(manifest.widgets.length, 1);

const widget = manifest.widgets[0];
assert.equal(widget.id, "zhadqqqqd.douban.monthlyhot");
assert.match(widget.id, /^[A-Za-z0-9.]+$/);
assert.equal(widget.title, "豆瓣本月热播");
assert.equal(widget.description, metadata.description);
assert.equal(widget.requiredVersion, "0.0.1");
assert.equal(widget.version, "1.1.4");
assert.equal(widget.author, "zhadqqqqd");
assert.equal(
  widget.url,
  "https://raw.githubusercontent.com/zhadqqqqd/forward-douban-monthly-hot/main/widgets/douban-monthly-hot.js"
);
assert.equal(widget.url.includes("raw.githubusercontent.com"), true);

for (const key of ["id", "title", "description", "requiredVersion", "version", "author"]) {
  assert.equal(widget[key], metadata[key], `manifest ${key} should match WidgetMetadata`);
}

assert.ok(Array.isArray(metadata.modules), "WidgetMetadata.modules should be an array");
assert.equal(metadata.modules.length, 2);

for (const module of metadata.modules) {
  assert.equal(typeof module.id, "string", `${module.title} should have a module id`);
  assert.match(module.id, /^[A-Za-z0-9.]+$/);
  assert.equal(typeof module.title, "string");
  assert.equal(typeof module.description, "string");
  assert.equal(module.requiresWebView, false);
  assert.equal(module.cacheDuration, 3600);
  assert.equal(typeof module.functionName, "string");
  assert.ok(Array.isArray(module.params), `${module.title} params should be an array`);
  assert.equal(typeof metadata.functions[module.functionName], "function", `${module.functionName} should exist`);
  assert.ok(module.params.some((param) => param.name === "page" && param.type === "page"));
  assert.ok(module.params.some((param) => param.name === "count" && param.type === "count"));
}

assert.equal(fs.existsSync("forward-widgets.fwd"), true, "forward-widgets.fwd should exist");
assert.deepEqual(
  JSON.parse(fs.readFileSync("forward-widgets.fwd", "utf8")),
  manifest,
  "forward-widgets.fwd should mirror widgets.fwd"
);
assert.equal(fs.existsSync("widgets.json"), true, "widgets.json should exist");
assert.deepEqual(
  JSON.parse(fs.readFileSync("widgets.json", "utf8")),
  manifest,
  "widgets.json should mirror widgets.fwd"
);

console.log("ok");

function loadWidgetMetadata(filePath, options = {}) {
  assert.equal(fs.existsSync(filePath), true, `${filePath} should exist`);

  const sandbox = {
    console,
    Widget: {
      http: {
        get: async () => ({ data: { subjects: [] } }),
      },
    },
  };
  vm.createContext(sandbox);
  const prefix = options.strict ? '"use strict";\n' : "";
  vm.runInContext(prefix + fs.readFileSync(filePath, "utf8"), sandbox, { filename: filePath });

  assert.ok(sandbox.WidgetMetadata, "WidgetMetadata should be defined");
  return {
    ...sandbox.WidgetMetadata,
    functions: sandbox,
  };
}

function loadWidgetMetadataFromFunctionGlobal(filePath) {
  assert.equal(fs.existsSync(filePath), true, `${filePath} should exist`);

  const previousWidget = globalThis.Widget;
  const previousMetadata = globalThis.WidgetMetadata;
  try {
    delete globalThis.WidgetMetadata;
    globalThis.Widget = {
      http: {
        get: async () => ({ data: { subjects: [] } }),
      },
    };
    new Function(fs.readFileSync(filePath, "utf8"))();
    assert.ok(globalThis.WidgetMetadata, "WidgetMetadata should be defined on globalThis");
    return JSON.parse(JSON.stringify(globalThis.WidgetMetadata));
  } finally {
    if (previousMetadata === undefined) {
      delete globalThis.WidgetMetadata;
    } else {
      globalThis.WidgetMetadata = previousMetadata;
    }
    if (previousWidget === undefined) {
      delete globalThis.Widget;
    } else {
      globalThis.Widget = previousWidget;
    }
  }
}

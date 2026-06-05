const fs = require("fs");
const vm = require("vm");
const assert = require("assert/strict");
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

for (const manifestPath of ["probe.fwd", "compat.fwd"]) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.widgets.length, 1);
  const widget = manifest.widgets[0];
  const localPath = widget.url.includes("probe.js")
    ? "widgets/probe.js"
    : "widgets/douban-monthly-hot-compat.js";
  const metadata = loadMetadata(fs.readFileSync(localPath, "utf8"));

  assert.equal(widget.id, metadata.id);
  assert.equal(widget.title, metadata.title);
  for (const key of ["description", "requiredVersion", "version", "author"]) {
    assert.equal(typeof widget[key], "string", `${manifestPath} widget ${key} should be present`);
  }
  if (localPath.includes("probe.js")) {
    for (const key of ["description", "requiredVersion", "version", "author"]) {
      assert.equal(widget[key], metadata[key], `${localPath} ${key} should match manifest`);
    }
  } else {
    assert.equal(widget.version, packageJson.version, "compat.fwd version should match package.json");
    assert.equal(
      Object.prototype.hasOwnProperty.call(metadata, "version"),
      false,
      "compat WidgetMetadata should keep the v1.1.8 minimal import shape"
    );
  }
  assert.equal(typeof metadata.modules[0].functionName, "string");
  assert.equal(typeof metadata.functions[metadata.modules[0].functionName], "function");
  for (const module of metadata.modules) {
    assert.equal(typeof module.id, "string", `${localPath} module should have id`);
    assert.ok(module.id.length > 0, `${localPath} module id should not be empty`);
  }
}

console.log("diagnostic ok");

function loadMetadata(source) {
  const sandbox = {
    console,
    Widget: {
      http: {
        get: async () => ({ data: { subject_collection_items: [] } }),
      },
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "diagnostic-widget.js" });
  assert.ok(sandbox.WidgetMetadata, "WidgetMetadata should exist");
  return {
    ...JSON.parse(JSON.stringify(sandbox.WidgetMetadata)),
    functions: sandbox,
  };
}

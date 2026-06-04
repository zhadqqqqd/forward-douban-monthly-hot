const assert = require("assert/strict");
const vm = require("vm");

const MANIFEST_URLS = [
  "https://raw.githubusercontent.com/zhadqqqqd/forward-douban-monthly-hot/refs/heads/main/widgets.fwd",
  "https://zhadqqqqd.github.io/forward-douban-monthly-hot/widgets.fwd",
  "https://zhadqqqqd.github.io/forward-douban-monthly-hot/widgets.json",
];

async function fetchText(url) {
  const response = await fetch(url, { cache: "no-store" });
  assert.equal(response.status, 200, `${url} should return 200`);
  return response.text();
}

function loadMetadata(source, options = {}) {
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
  vm.runInContext(prefix + source, sandbox, { filename: "remote-widget.js" });
  assert.ok(sandbox.WidgetMetadata, "remote WidgetMetadata should exist");
  return {
    ...JSON.parse(JSON.stringify(sandbox.WidgetMetadata)),
    functions: sandbox,
  };
}

(async () => {
  for (const manifestUrl of MANIFEST_URLS) {
    const manifest = JSON.parse(await fetchText(manifestUrl));
    assert.equal(manifest.widgets.length, 1, `${manifestUrl} should contain one widget`);

    const widget = manifest.widgets[0];
    assert.equal(widget.id, "zhadqqqqd.douban.monthlyhot");
    assert.equal(widget.version, "1.1.1");
    assert.equal(widget.author, "zhadqqqqd");
    assert.equal(
      widget.url,
      "https://zhadqqqqd.github.io/forward-douban-monthly-hot/widgets/douban-monthly-hot.js"
    );

    const source = await fetchText(widget.url);
    const metadata = loadMetadata(source);
    const strictMetadata = loadMetadata(source, { strict: true });
    assert.equal(strictMetadata.id, metadata.id, `${manifestUrl} should load WidgetMetadata in strict JS contexts`);
    for (const key of ["id", "title", "description", "requiredVersion", "version", "author"]) {
      assert.equal(widget[key], metadata[key], `${manifestUrl} ${key} should match WidgetMetadata`);
    }

    assert.deepEqual(metadata.modules.map((module) => module.id), ["monthlyHotMovies", "monthlyHotTV"]);
    for (const module of metadata.modules) {
      assert.equal(module.requiresWebView, false);
      assert.equal(module.cacheDuration, 3600);
      assert.equal(typeof metadata.functions[module.functionName], "function");
      assert.ok(module.params.some((param) => param.name === "page" && param.type === "page"));
      assert.ok(module.params.some((param) => param.name === "count" && param.type === "count"));
    }
  }

  console.log("remote ok", { manifests: MANIFEST_URLS });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

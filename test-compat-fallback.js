const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");

const modulePath = path.join(__dirname, "widgets", "douban-monthly-hot-compat.js");
const calls = [];

global.Widget = {
  http: {
    get: async (url, options = {}) => {
      calls.push({ url, options });

      if (url.includes("m.douban.com/rexxar")) {
        throw new Error("simulated app douban network failure");
      }

      if (url.includes("raw.githubusercontent.com") && url.includes("douban-monthly-hot.json")) {
        return {
          data: JSON.stringify({
            movie: [
              {
                id: "fallback-movie",
                type: "douban",
                mediaType: "movie",
                title: "兜底电影",
                posterPath: "https://example.com/movie.jpg",
                rating: 8.1,
                description: "评分 8.1 · fallback",
              },
            ],
            tv: [
              {
                id: "fallback-tv",
                type: "douban",
                mediaType: "tv",
                title: "兜底剧集",
                posterPath: "https://example.com/tv.jpg",
                rating: 7.9,
                description: "评分 7.9 · fallback",
              },
            ],
          }),
        };
      }

      throw new Error(`unexpected url: ${url}`);
    },
  },
};

global.WidgetMetadata = {};
eval(fs.readFileSync(modulePath, "utf8"));

(async () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "compat.fwd"), "utf8"));
  assert.equal(manifest.widgets.length, 1);
  const widget = manifest.widgets[0];
  for (const key of ["id", "title", "description", "requiredVersion", "version", "author"]) {
    assert.equal(widget[key], WidgetMetadata[key], `compat.fwd ${key} should match WidgetMetadata`);
  }
  assert.equal(
    widget.url,
    `https://raw.githubusercontent.com/zhadqqqqd/forward-douban-monthly-hot/v${WidgetMetadata.version}/widgets/douban-monthly-hot-compat.js`
  );
  assert.deepEqual(
    WidgetMetadata.modules.map((module) => module.id),
    ["monthlyHotMovies", "monthlyHotTV"]
  );
  for (const module of WidgetMetadata.modules) {
    assert.equal(module.requiresWebView, false);
    assert.equal(module.cacheDuration, 3600);
    assert.equal(typeof eval(module.functionName), "function");
    assert.ok(Array.isArray(module.params));
    assert.ok(module.params.some((param) => param.name === "page" && param.type === "page"));
    assert.ok(module.params.some((param) => param.name === "count" && param.type === "count"));
  }

  const movies = await loadMonthlyHotMovies({ page: 1, count: 20 });
  const tvShows = await loadMonthlyHotTV({ page: 1, count: 20 });

  assert.equal(WidgetMetadata.id, "doubanmonthlyhotfinal");
  assert.equal(movies.length, 1);
  assert.equal(movies[0].id, "fallback-movie");
  assert.equal(movies[0].title, "兜底电影");
  assert.equal(movies[0].rating, "8.1");
  assert.match(movies[0].description, /^豆瓣评分 8\.1/);
  assert.equal(movies[0].description, "豆瓣评分 8.1 · fallback");
  assert.match(movies[0].genreTitle, /豆瓣评分 8\.1/);
  assert.equal(tvShows.length, 1);
  assert.equal(tvShows[0].id, "fallback-tv");
  assert.equal(tvShows[0].title, "兜底剧集");
  assert.equal(tvShows[0].rating, "7.9");
  assert.match(tvShows[0].description, /^豆瓣评分 7\.9/);
  assert.equal(tvShows[0].description, "豆瓣评分 7.9 · fallback");
  assert.match(tvShows[0].genreTitle, /豆瓣评分 7\.9/);
  assert.equal(calls.filter((call) => call.url.includes("m.douban.com/rexxar")).length, 0);
  assert.equal(calls.filter((call) => call.url.includes("douban-monthly-hot.json")).length, 2);

  console.log("fallback ok", { movies: movies.length, tvShows: tvShows.length });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

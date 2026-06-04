const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");

const modulePath = path.join(__dirname, "widgets", "douban-monthly-hot.js");

(async () => {
  const { WidgetAdaptor } = await import("@forward-widget/libs/widget-adaptor");

  global.Widget = WidgetAdaptor;
  eval(fs.readFileSync(modulePath, "utf8"));

  assert.equal(WidgetMetadata.id, "zhadqqqqd.douban.monthlyhot");
  assert.equal(WidgetMetadata.version, "1.1.5");
  assert.equal(typeof loadMonthlyHotMovies, "function");
  assert.equal(typeof loadMonthlyHotTV, "function");

  const movies = await loadMonthlyHotMovies({ page: 1, count: 5 });
  const tvShows = await loadMonthlyHotTV({ page: 1, count: 5 });

  assert.ok(movies.length > 0, "movies should return live Douban items");
  assert.ok(tvShows.length > 0, "tv shows should return live Douban items");

  for (const item of [...movies, ...tvShows]) {
    assert.equal(item.type, "douban");
    assert.ok(item.id, "item should have id");
    assert.ok(item.title, "item should have title");
    assert.ok(["movie", "tv"].includes(item.mediaType), "item should have mediaType");
  }

  console.log("adaptor ok", {
    movies: movies.slice(0, 3).map((item) => item.title),
    tvShows: tvShows.slice(0, 3).map((item) => item.title),
  });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

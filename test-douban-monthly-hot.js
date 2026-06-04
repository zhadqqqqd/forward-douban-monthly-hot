const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");

const modulePath = path.join(__dirname, "widgets", "douban-monthly-hot.js");

assert.equal(fs.existsSync(modulePath), true, "widgets/douban-monthly-hot.js should exist");

const calls = [];
let forceFailure = false;

global.Widget = {
  http: {
    get: async (url, options = {}) => {
      calls.push({ url, options });
      if (forceFailure) {
        throw new Error("simulated network failure");
      }

      assert.match(url, /^https:\/\/m\.douban\.com\/rexxar\/api\/v2\/subject_collection\/.+\/items$/);
      assert.equal(options.headers.Referer, "https://m.douban.com/");
      assert.ok(options.headers["User-Agent"].includes("Mobile"));

      if (url.includes("/movie_hot_gaia/")) {
        return {
          data: {
            subject_collection_items: [
              {
                id: "37067461",
                title: "女士优先",
                rating: { value: 6.3 },
                cover: { url: "https://img3.doubanio.com/view/photo/s_ratio_poster/public/p2932533733.jpg" },
                card_subtitle: "2026 / 美国 / 喜剧 爱情",
                episodes_info: "",
                is_new: false,
              },
            ],
          },
        };
      }

      if (url.includes("/tv_hot/")) {
        return {
          data: {
            subject_collection_items: [
              {
                id: "36883114",
                title: "家业",
                rating: { value: 0 },
                cover: { url: "https://img2.doubanio.com/view/photo/s_ratio_poster/public/p2932320661.jpg" },
                card_subtitle: "2026 / 中国大陆 / 剧情",
                episodes_info: "更新至36集",
                is_new: true,
              },
            ],
          },
        };
      }

      throw new Error(`unexpected url: ${url}`);
    },
  },
};

global.WidgetMetadata = {};

eval(fs.readFileSync(modulePath, "utf8"));

(async () => {
  assert.equal(WidgetMetadata.id, "zhadqqqqd.douban.monthlyhot");
  assert.equal(WidgetMetadata.version, "1.1.5");
  assert.equal(WidgetMetadata.author, "zhadqqqqd");
  assert.equal(WidgetMetadata.modules.length, 2);
  assert.match(WidgetMetadata.id, /^[A-Za-z0-9.]+$/);
  assert.deepEqual(
    WidgetMetadata.modules.map((module) => module.id),
    ["monthlyHotMovies", "monthlyHotTV"]
  );
  assert.deepEqual(
    WidgetMetadata.modules.map((module) => module.requiresWebView),
    [false, false]
  );
  assert.deepEqual(
    WidgetMetadata.modules.map((module) => module.cacheDuration),
    [3600, 3600]
  );
  assert.deepEqual(
    WidgetMetadata.modules.map((module) => module.params.map((param) => param.name)),
    [
      ["page", "count"],
      ["page", "count"],
    ]
  );
  assert.deepEqual(
    WidgetMetadata.modules.map((module) => module.functionName),
    ["loadMonthlyHotMovies", "loadMonthlyHotTV"]
  );

  const movies = await loadMonthlyHotMovies({ page: 2, count: 12 });
  const tvShows = await loadMonthlyHotTV({ page: 3, count: 8 });
  const cappedMovies = await loadMonthlyHotMovies({ page: 0, count: 500 });
  forceFailure = true;
  const failedMovies = await loadMonthlyHotMovies({ page: 1, count: 5 });
  forceFailure = false;

  assert.equal(calls.length, 4);
  assert.equal(calls[0].url, "https://m.douban.com/rexxar/api/v2/subject_collection/movie_hot_gaia/items");
  assert.equal(calls[0].options.params.count, 12);
  assert.equal(calls[0].options.params.start, 12);
  assert.equal(calls[1].url, "https://m.douban.com/rexxar/api/v2/subject_collection/tv_hot/items");
  assert.equal(calls[1].options.params.count, 8);
  assert.equal(calls[1].options.params.start, 16);
  assert.equal(calls[2].url, "https://m.douban.com/rexxar/api/v2/subject_collection/movie_hot_gaia/items");
  assert.equal(calls[2].options.params.count, 50);
  assert.equal(calls[2].options.params.start, 0);

  assert.equal(movies.length, 1);
  assert.equal(movies[0].id, "37067461");
  assert.equal(movies[0].type, "douban");
  assert.equal(movies[0].mediaType, "movie");
  assert.equal(movies[0].title, "女士优先");
  assert.equal(movies[0].rating, 6.3);
  assert.equal(movies[0].posterPath, "https://img3.doubanio.com/view/photo/s_ratio_poster/public/p2932533733.jpg");
  assert.equal(movies[0].cover, undefined);
  assert.equal(movies[0].link, undefined);
  assert.equal(cappedMovies.length, 1);
  assert.deepEqual(failedMovies, []);

  assert.equal(tvShows.length, 1);
  assert.equal(tvShows[0].id, "36883114");
  assert.equal(tvShows[0].type, "douban");
  assert.equal(tvShows[0].mediaType, "tv");
  assert.equal(tvShows[0].rating, 0);
  assert.match(tvShows[0].description, /更新至36集/);
  assert.match(tvShows[0].description, /中国大陆/);
  assert.match(tvShows[0].description, /新上榜/);
  assert.equal(tvShows[0].link, undefined);

  console.log("ok", { calls: calls.map((call) => call.options.params) });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");

const modulePath = path.join(__dirname, "widgets", "douban-monthly-hot.js");

assert.equal(fs.existsSync(modulePath), true, "widgets/douban-monthly-hot.js should exist");

const calls = [];

global.Widget = {
  http: {
    get: async (url, options = {}) => {
      calls.push({ url, options });

      assert.equal(url, "https://movie.douban.com/j/search_subjects");
      assert.equal(options.headers.Referer, "https://movie.douban.com/");
      assert.ok(options.headers["User-Agent"].includes("Mozilla"));

      const type = options.params.type;
      if (type === "movie") {
        return {
          data: {
            subjects: [
              {
                id: "37067461",
                title: "女士优先",
                rate: "6.3",
                cover: "https://img3.doubanio.com/view/photo/s_ratio_poster/public/p2932533733.jpg",
                episodes_info: "",
                is_new: false,
              },
            ],
          },
        };
      }

      if (type === "tv") {
        return {
          data: {
            subjects: [
              {
                id: "36883114",
                title: "家业",
                rate: "",
                cover: "https://img2.doubanio.com/view/photo/s_ratio_poster/public/p2932320661.jpg",
                episodes_info: "更新至36集",
                is_new: true,
              },
            ],
          },
        };
      }

      throw new Error(`unexpected type: ${type}`);
    },
  },
};

global.WidgetMetadata = {};

eval(fs.readFileSync(modulePath, "utf8"));

(async () => {
  assert.equal(WidgetMetadata.id, "forward.douban.monthly-hot");
  assert.equal(WidgetMetadata.modules.length, 2);
  assert.deepEqual(
    WidgetMetadata.modules.map((module) => module.functionName),
    ["loadMonthlyHotMovies", "loadMonthlyHotTV"]
  );

  const movies = await loadMonthlyHotMovies({ page: 2, count: 12 });
  const tvShows = await loadMonthlyHotTV({ page: 3, count: 8 });
  const cappedMovies = await loadMonthlyHotMovies({ page: 0, count: 500 });

  assert.equal(calls.length, 3);
  assert.equal(calls[0].options.params.type, "movie");
  assert.equal(calls[0].options.params.tag, "热门");
  assert.equal(calls[0].options.params.sort, "recommend");
  assert.equal(calls[0].options.params.page_limit, 12);
  assert.equal(calls[0].options.params.page_start, 12);
  assert.equal(calls[1].options.params.type, "tv");
  assert.equal(calls[1].options.params.page_limit, 8);
  assert.equal(calls[1].options.params.page_start, 16);
  assert.equal(calls[2].options.params.type, "movie");
  assert.equal(calls[2].options.params.page_limit, 50);
  assert.equal(calls[2].options.params.page_start, 0);

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

  assert.equal(tvShows.length, 1);
  assert.equal(tvShows[0].id, "36883114");
  assert.equal(tvShows[0].type, "douban");
  assert.equal(tvShows[0].mediaType, "tv");
  assert.equal(tvShows[0].rating, 0);
  assert.match(tvShows[0].description, /更新至36集/);
  assert.match(tvShows[0].description, /新上榜/);
  assert.equal(tvShows[0].link, undefined);

  console.log("ok", { calls: calls.map((call) => call.options.params) });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

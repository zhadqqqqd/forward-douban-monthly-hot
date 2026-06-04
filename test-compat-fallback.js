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
          data: {
            movie: [
              {
                id: "fallback-movie",
                type: "douban",
                mediaType: "movie",
                title: "兜底电影",
                posterPath: "https://example.com/movie.jpg",
                rating: 8.1,
                description: "fallback",
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
                description: "fallback",
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
  const movies = await loadMonthlyHotMovies({ page: 1, count: 20 });
  const tvShows = await loadMonthlyHotTV({ page: 1, count: 20 });

  assert.equal(WidgetMetadata.id, "doubanmonthlyhot");
  assert.equal(movies.length, 1);
  assert.equal(movies[0].id, "fallback-movie");
  assert.equal(movies[0].title, "兜底电影");
  assert.equal(tvShows.length, 1);
  assert.equal(tvShows[0].id, "fallback-tv");
  assert.equal(tvShows[0].title, "兜底剧集");
  assert.equal(calls.filter((call) => call.url.includes("m.douban.com/rexxar")).length, 2);
  assert.equal(calls.filter((call) => call.url.includes("douban-monthly-hot.json")).length, 2);

  console.log("fallback ok", { movies: movies.length, tvShows: tvShows.length });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

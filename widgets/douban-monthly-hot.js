var WidgetMetadata = {
  id: "zhadqqqqd.douban.monthlyhot",
  title: "豆瓣本月热播",
  version: "1.1.2",
  requiredVersion: "0.0.1",
  description: "豆瓣本月热播电影和剧集",
  author: "zhadqqqqd",
  site: "https://github.com/zhadqqqqd/forward-douban-monthly-hot",
  modules: [
    {
      id: "monthlyHotMovies",
      title: "本月热播电影",
      description: "豆瓣本月热播电影",
      requiresWebView: false,
      functionName: "loadMonthlyHotMovies",
      cacheDuration: 3600,
      params: [
        {
          name: "page",
          title: "页码",
          type: "page",
        },
        {
          name: "count",
          title: "数量",
          type: "count",
          value: "20",
        },
      ],
    },
    {
      id: "monthlyHotTV",
      title: "本月热播剧集",
      description: "豆瓣本月热播剧集",
      requiresWebView: false,
      functionName: "loadMonthlyHotTV",
      cacheDuration: 3600,
      params: [
        {
          name: "page",
          title: "页码",
          type: "page",
        },
        {
          name: "count",
          title: "数量",
          type: "count",
          value: "20",
        },
      ],
    },
  ],
};

const DOUBAN_MONTHLY_HOT_ENDPOINTS = {
  movie: "https://m.douban.com/rexxar/api/v2/subject_collection/movie_hot_gaia/items",
  tv: "https://m.douban.com/rexxar/api/v2/subject_collection/tv_hot/items",
};
const DOUBAN_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
  Referer: "https://m.douban.com/",
};
const DEFAULT_COUNT = 20;
const MAX_COUNT = 50;

async function loadMonthlyHotMovies(params = {}) {
  return loadMonthlyHot("movie", params);
}

async function loadMonthlyHotTV(params = {}) {
  return loadMonthlyHot("tv", params);
}

async function loadMonthlyHot(mediaType, params = {}) {
  try {
    const page = normalizePositiveInteger(params.page, 1);
    const count = normalizeCount(params.count);
    const response = await Widget.http.get(DOUBAN_MONTHLY_HOT_ENDPOINTS[mediaType], {
      headers: DOUBAN_HEADERS,
      params: {
        start: (page - 1) * count,
        count,
      },
    });

    const subjects =
      response && response.data && Array.isArray(response.data.subject_collection_items)
        ? response.data.subject_collection_items
        : [];

    return subjects.map((subject) => toVideoItem(subject, mediaType));
  } catch (error) {
    console.error("[douban-monthly-hot] load failed:", error.message || error);
    throw error;
  }
}

function normalizeCount(value) {
  return Math.min(normalizePositiveInteger(value, DEFAULT_COUNT), MAX_COUNT);
}

function normalizePositiveInteger(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return fallback;
  return Math.floor(number);
}

function toVideoItem(subject, mediaType) {
  const rating = parseRating(subject && (subject.rate || (subject.rating && subject.rating.value)));
  return {
    id: subject && subject.id != null ? String(subject.id) : "",
    type: "douban",
    mediaType,
    title: (subject && (subject.title || subject.name)) || "",
    posterPath: (subject && (typeof subject.cover === "string" ? subject.cover : subject.cover && subject.cover.url)) || "",
    rating,
    description: buildDescription(subject, rating),
  };
}

function parseRating(rate) {
  const rating = Number(rate);
  return Number.isFinite(rating) ? rating : 0;
}

function buildDescription(subject, rating) {
  const parts = [];
  if (rating > 0) {
    parts.push(`评分 ${rating}`);
  } else {
    parts.push("暂无评分");
  }
  if (subject && subject.episodes_info) {
    parts.push(subject.episodes_info);
  }
  if (subject && (subject.card_subtitle || subject.info)) {
    parts.push(subject.card_subtitle || subject.info);
  }
  if (subject && subject.is_new) {
    parts.push("新上榜");
  }
  return parts.join(" · ");
}

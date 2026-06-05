WidgetMetadata = {
  id: "doubanmonthlyhot",
  title: "豆瓣本月热播",
  modules: [
    {
      id: "monthlyHotMovies",
      title: "本月热播电影",
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
const DOUBAN_MONTHLY_HOT_FALLBACK_URL =
  "https://raw.githubusercontent.com/zhadqqqqd/forward-douban-monthly-hot/v1.1.11/data/douban-monthly-hot.json";
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
  const page = normalizePositiveInteger(params.page, 1);
  const count = normalizeCount(params.count);
  const fallbackItems = await loadFallbackMonthlyHot(mediaType, page, count);
  if (fallbackItems.length > 0) return fallbackItems;

  try {
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

    const items = subjects.map((subject) => toVideoItem(subject, mediaType));
    if (items.length > 0) return items;
  } catch (error) {
    console.error("[douban-monthly-hot] load failed:", error.message || error);
  }

  return [];
}

async function loadFallbackMonthlyHot(mediaType, page, count) {
  try {
    const response = await Widget.http.get(DOUBAN_MONTHLY_HOT_FALLBACK_URL, {
      headers: {
        "User-Agent": "ForwardWidgets/1.0.0",
      },
    });
    const data = parseJsonData(response && response.data);
    const items = data && Array.isArray(data[mediaType]) ? data[mediaType] : [];
    const start = (page - 1) * count;
    return items.slice(start, start + count).filter((item) => item && item.id && item.title);
  } catch (error) {
    console.error("[douban-monthly-hot] fallback failed:", error.message || error);
    return [];
  }
}

function parseJsonData(data) {
  if (!data) return null;
  if (typeof data !== "string") return data;
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error("[douban-monthly-hot] invalid fallback json:", error.message || error);
    return null;
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

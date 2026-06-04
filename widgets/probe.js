WidgetMetadata = {
  id: "forwardprobe",
  title: "Forward Probe",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "Minimal static widget for Forward import diagnostics",
  author: "zhadqqqqd",
  site: "https://github.com/zhadqqqqd/forward-douban-monthly-hot",
  modules: [
    {
      id: "loadProbe",
      title: "静态列表",
      requiresWebView: false,
      functionName: "loadProbe",
      cacheDuration: 3600,
      params: [],
    },
  ],
};

async function loadProbe(params = {}) {
  return [
    {
      id: "550",
      type: "tmdb",
      title: "Fight Club",
      mediaType: "movie",
    },
  ];
}

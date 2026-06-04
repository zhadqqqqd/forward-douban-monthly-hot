WidgetMetadata = {
  id: "forwardprobe",
  title: "Forward Probe",
  modules: [
    {
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

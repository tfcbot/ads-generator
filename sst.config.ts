/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "ads-generator",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const infra = await import("./infra");
    return {
      url: infra.frontend.url,
      api: infra.api.url,
    };
  },
});

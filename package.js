Package.describe({
  name: "pmogollons:collection-hooks",
  version: "1.0.5",
  summary: "Collection hooks for Meteor",
  git: "https://github.com/pmogollons/collection-hooks",
  documentation: "README.md",
});

Package.onUse(function (api) {
  api.versionsFrom(["3.0"]);

  api.use([
    "zodern:types@1.0.13",
    "typescript",
    "ecmascript",
    "mongo",
  ]);

  api.mainModule("src/server.js", "server");
});

Package.onTest(function (api) {
  api.use("pmogollons:collection-hooks");

  api.use([
    "tinytest",
    "typescript",
    "ecmascript",
    "mongo",
  ]);

  api.mainModule("tests/index.js", "server");
});

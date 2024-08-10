/* global Npm: true */
/* global Package: true */

Package.describe({
  name: "pmogollons:collection-hooks",
  version: "1.0.0",
  summary: "Collection hooks for Meteor",
  git: "https://github.com/pmogollons/collection-hooks",
  documentation: "README.md",
});

Package.onUse(function (api) {
  api.versionsFrom(["3.0"]);

  api.use([
    "typescript",
    "ecmascript",
    "mongo",
    'zodern:types',
  ]);

  api.mainModule("server.js", "server");
});

Package.onTest(function (api) {
  api.use("pmogollons:collection-hooks");

  api.use([
    "typescript",
    "ecmascript",
    "mongo",
    'zodern:types',
  ]);

  api.use(["meteortesting:mocha"]);
});

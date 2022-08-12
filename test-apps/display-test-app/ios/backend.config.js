/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

const path = require("path");
const webpack = require("webpack");
const plugins = require("@itwin/core-webpack-tools");
module.exports = (env) => {
  return getConfig(env);
};

function getConfig(env) {
  // set sourcedir if not specified in arguments.
  if (!env.sourcedir)
    env.sourcedir = "./";

  if (!env.outdir)
    env.outdir = "./lib/module" + (env.prod ? "/prod" : "/dev");

  // get the directory for the bundle.
  const bundleDirectory = path.resolve(env.sourcedir, env.outdir);

  // unless specified with env.prod, create a development build.
  const devMode = !(env.prod);

  // this is the "barrel" file of the module, which imports all of the sources.
  const bundleEntry = env.entry;

  // name of the output bundle.
  const bundleName = env.bundlename;

  const webConfig = {
    mode: devMode ? "development" : "production",
    entry: bundleEntry,
    output: {
      libraryTarget: "commonjs2",
      library: bundleName,
      path: bundleDirectory,
      pathinfo: true,
    },
    target: "node",
    devtool: "source-map",
    resolve: { mainFields: ["main", "module"] },
    module: {
      rules: [
        {
          test: /AzCopyFileHandler\.js/g,
          use: "null-loader",
        },
        {
          test: /itwin\+electron-authorization/g,
          use: "null-loader",
        },
        {
          test: /ElectronBackend\.js/g,
          use: "null-loader",
        },
        // {
        //   test: /iTwinDaemon/g,
        //   use: "null-loader",
        // },
        // {
        //   test: /\.node$/,
        //   loader: "node-loader",
        // },
      ],
    },
    stats: {
      warnings: false,
    },
    node: {
      // provides the global variable named "global"
      global: true,
      // provide __filename and __dirname global variables
      __filename: true,
      __dirname: true,
    },
    externals: {
      electron: "electron",
      bufferutil: "bufferutil",
      "utf-8-validate": "utf-8-validate",
    },
    plugins: [
      new plugins.CopyAppAssetsPlugin("./assets/"),
      new plugins.CopyBentleyStaticResourcesPlugin(["assets"]),
      new webpack.DefinePlugin({
        "global.GENTLY": false,
        "process.version": "'v10.9.0'",
      }),
      new webpack.ExternalsPlugin("commonjs", [
        "@bentley/imodeljs-native",
        "@bentley/imodeljs-native/package.json",
        "node-report/api",
      ]),
    ],
  };

  return webConfig;
}

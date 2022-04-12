const { resolve } = require("path"); // eslint-disable-line

module.exports = {
  mode: "development",
  entry: {
    "conv.spec": "./src/__tests__/conv.spec.ts",
    "common.spec": "./src/__tests__/common.spec.ts",
    "largefile.spec": "./src/__tests__/largefile-web.ts",
  },
  output: {
    filename: "[name].js",
    path: __dirname + "/dist",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      "node-fetch": resolve(__dirname, "dummy.js"),
    },
    fallback: {
      stream: false,
      fs: false,
      os: false,
      path: false,
      url: false,
    },
  },
};

const { resolve } = require("path"); // eslint-disable-line

module.exports = {
  mode: "production",
  entry: {
    index: "./src/index.ts",
  },
  output: {
    filename: "univ-conv.js",
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

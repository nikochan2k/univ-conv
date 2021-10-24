module.exports = {
  mode: "production",
  entry: {
    "conv.spec": "./src/__tests__/conv.spec.ts",
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
      stream: "./stream-mock.js",
    },
  },
};

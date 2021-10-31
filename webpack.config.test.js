module.exports = {
  mode: "production",
  entry: {
    "conv.spec": "./src/__tests__/conv.spec.ts",
    "common.spec": "./src/__tests__/common.spec.ts",
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
    fallback: {
      stream: false,
    },
  },
};

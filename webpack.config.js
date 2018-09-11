const path = require("path")
const webpack = require("webpack")

const babelLoader = {
  loader: 'babel-loader',
  options: { extends: "./.babelrc" }
}

module.exports = {
  entry: {
    main: ["@babel/polyfill", "./src/index"],
    demo: ["@babel/polyfill", "./src/demo"],
  },

  output: {
    filename: '[name].bundle.js',
    // Output path using nodeJs path module
    path: path.resolve(__dirname, "dist")
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        use: [babelLoader]
      },
      {
        test: /\.tsx?$/,
        exclude: /(node_modules|bower_components)/,
        use: [
          babelLoader,
          {
            loader: 'ts-loader',
            options: {}
          }
        ]
      }
    ]
  },

  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"]
  },

  devServer: {
    contentBase: path.resolve(__dirname, "dist"),
    compress: true,
    port: 9000
  }
}
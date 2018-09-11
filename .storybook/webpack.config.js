const path = require("path");
module.exports = (baseConfig, env, config) => {
  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    loader: [
      "babel-loader",
      {
        loader: 'ts-loader',
        options: {}
      }
    ]
  });
  config.resolve.extensions.push(".ts", ".tsx");
  return config;
};
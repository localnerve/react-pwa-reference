/***
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import makeMode from './utils/mode';
import uglifyPluginFactory from './plugins/uglify';
import { statsPlugin, statsPluginOptions } from './plugins/stats';

/**
 * Generate the webpack config for the service worker registration bundle.
 *
 * @param {Object} settings - The project settings.
 * @param {String} type - One of ['dev', 'prod', 'perf'].
 * @returns {Object} The web pack config for the sw reg bundle.
 */
export default function swRegConfig (settings, type) {
  const devtoolModuleFilenameTemplate = 'webpack:///sw-reg/[resource-path]';
  const statsOptions = statsPluginOptions(settings);

  const config = {
    mode: makeMode(type),
    entry: {
      swReg: `./${settings.src.serviceWorker.registration}`
    },
    output: {
      path: settings.webpack.absoluteOutputPath,
      publicPath: settings.web.scripts
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /^\/node_modules/,
          loader: 'babel-loader'
        }
      ]
    },
    stats: 'verbose',
    plugins: [
      function () {
        return statsPlugin(this, statsOptions);
      }
    ]
  };

  if (type === 'dev') {
    config.output.filename = '[name].js';
  } else {
    config.output.filename = '[name].[chunkhash].min.js';
  }

  if (type !== 'prod') {
    config.output.devtoolModuleFilenameTemplate = devtoolModuleFilenameTemplate;
    config.devtool = 'source-map';
  } else {
    config.optimization = {
      minimizer: [
        uglifyPluginFactory()
      ]
    };
  }

  return config;
}

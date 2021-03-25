/***
 * Copyright (c) 2016 - 2021 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import makeMode from './utils/mode';
import uglifyPluginFactory from './plugins/uglify';
import { statsPlugin, statsPluginOptions } from './plugins/stats';

/**
 * Generate the service worker main script bundle.
 *
 * @param {Object} settings - The project settings.
 * @param {String} type - One of ['dev', 'prod', 'perf'].
 * @returns {Object} The web pack config for the service worker bundle.
 */
export default function swMainConfig (settings, type) {
  const devtoolModuleFilenameTemplate = 'webpack:///sw/[resource-path]';
  const statsOptions = statsPluginOptions(settings);

  const config = {
    mode: makeMode(type),
    entry: {
      sw: `./${settings.src.serviceWorker.entry}`
    },
    output: {
      path: settings.webpack.absoluteOutputPath,
      publicPath: settings.web.scripts,
      // One name to rule them all
      filename: '[name].js'
    },
    module: {
      rules: [
        {
          test: /\.json$/,
          exclude: /^\/node_modules/,
          type: 'json'
        },
        {
          test: /\.js$/,
          loader: 'string-replace-loader',
          options: {
            search: '__TEST__',
            replace: '""'
          }
        },
        {
          test: /\.js$/,
          exclude: /(^\/node_modules|\.json$)/,
          loader: 'babel-loader'
        }
      ]
    },
    target: 'webworker',
    stats: 'verbose',
    plugins: [
      function () {
        return statsPlugin(this, statsOptions);
      }
    ]
  };

  if (type !== 'prod') {
    config.devtool = 'source-map';
    config.output.devtoolModuleFilenameTemplate = devtoolModuleFilenameTemplate;
  } else {
    config.optimization = {
      minimizer: [
        uglifyPluginFactory()
      ]
    };
  }

  return config;
}

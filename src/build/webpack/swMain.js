/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import webpack from 'webpack';
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

  const config = statsPluginOptions(settings, {
    entry: {
      sw: `./${settings.src.serviceWorker.entry}`
    },
    output: {
      path: settings.dist.scripts,
      publicPath: settings.web.scripts,
      // One name to rule them all
      filename: '[name].js'
    },
    module: {
      loaders: [
        {
          test: /\.json$/,
          exclude: /^\/node_modules/,
          loader: 'json'
        },
        {
          exclude: /(^\/node_modules|\.json$)/,
          loader: 'babel-loader'
        }
      ]
    },
    target: 'webworker',
    plugins: [
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.OccurrenceOrderPlugin()
    ]
  });

  if (type !== 'prod') {
    config.devtool = 'source-map';
    config.output.devtoolModuleFilenameTemplate = devtoolModuleFilenameTemplate;
  } else {
    config.plugins.push(uglifyPluginFactory());
  }

  config.plugins.push(function () {
    return statsPlugin(this);
  });

  return config;
}

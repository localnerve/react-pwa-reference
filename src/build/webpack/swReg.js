/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import webpack from 'webpack';
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
  const additionalPlugins = [];
  const config = statsPluginOptions(settings, {
    entry: {
      swReg: `./${settings.src.serviceWorker.registration}`
    },
    output: {
      path: settings.dist.scripts,
      publicPath: settings.web.scripts
    },
    module: {
      loaders: [
        {
          test: /\.js$/,
          exclude: /^\/node_modules/,
          loader: 'babel-loader'
        }
      ]
    },
    plugins: [
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.OccurenceOrderPlugin()
    ]
  });

  if (type === 'dev') {
    config.output.filename = '[name].js';
  } else {
    config.output.filename = '[name].[chunkhash].min.js';
  }

  if (type !== 'prod') {
    config.output.devtoolModuleFilenameTemplate = devtoolModuleFilenameTemplate;
    config.devtool = 'source-map';
  } else {
    additionalPlugins.push(uglifyPluginFactory());
  }

  Array.prototype.push.apply(config.plugins, additionalPlugins.concat(
    function () {
      return statsPlugin(this);
    }
  ));

  return config;
}

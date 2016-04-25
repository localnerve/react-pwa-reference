/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

var webpack = require('webpack');
var uglifyPluginFactory = require('./plugins/uglify');
var statsPluginOptions = require('./plugins/stats').statsPluginOptions;
var statsPlugin = require('./plugins/stats').statsPlugin;

/**
 * Generate the service worker main script bundle.
 *
 * @param {Object} settings - The project settings.
 * @param {String} type - One of ['dev', 'prod', 'perf'].
 * @returns {Object} The web pack config for the service worker bundle.
 */
function swMainConfig (settings, type) {
  var devtoolModuleFilenameTemplate = 'webpack:///sw/[resource-path]';

  var config = statsPluginOptions(settings, {
    entry: {
      sw: './' + settings.src.serviceWorker.entry
    },
    output: {
      path: settings.dist.scripts,
      publicPath: settings.web.scripts
    },
    module: {
      loaders: [
        {
          test: /\.json$/,
          exclude: /^\/node_modules/,
          loader: 'json'
        },
        {
          exclude: /(^\/node_modules|assets)/,
          loader: 'babel-loader'
        }
      ]
    },
    target: 'webworker',
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

module.exports = swMainConfig;

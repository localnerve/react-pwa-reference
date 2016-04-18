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
 * Generate the webpack config for the service worker registration bundle.
 *
 * @param {Object} settings - The project settings.
 * @param {String} type - One of ['dev', 'prod', 'perf'].
 * @returns {Object} The web pack config for the sw reg bundle.
 */
function swRegConfig (settings, type) {
  var devtoolModuleFilenameTemplate = 'webpack:///sw-reg/[resource-path]';
  var additionalPlugins = [];

  var config = statsPluginOptions(settings, {
    entry: {
      swReg: './' + settings.src.serviceWorker.registration
    },
    output: {
      path: settings.dist.scripts,
      publicPath: settings.web.scripts
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

module.exports = swRegConfig;

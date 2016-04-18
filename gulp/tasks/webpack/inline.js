/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

var path = require('path');
var webpack = require('webpack');
var uglifyPluginFactory = require('./plugins/uglify');

/**
 * Generate the inline script bundle.
 *
 * @param {Object} settings - The project settings.
 * @param {String} type - One of ['dev', 'prod', 'perf'].
 * @returns {Object} The web pack config for the inline bundle.
 */
function inlineConfig (settings, type) {
  var config = {
    entry: './' + settings.src.inlineScript,
    output: {
      path: settings.dist.scripts,
      filename: path.basename(settings.dist.inlineScript)
    },
    stats: {
      colors: true
    }
  };

  if (type === 'prod') {
    config.plugins = [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('production')
        }
      }),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.OccurenceOrderPlugin(),
      uglifyPluginFactory()
    ];
  }

  return config;
}

module.exports = inlineConfig;

/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

var webpack = require('webpack');

/**
 * Create the webpack uglifyJSPlugin with its options.
 */
function uglifyPluginFactory () {
  return new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false
    },
    output: {
      comments: false
    }
  });
}

module.exports = uglifyPluginFactory;

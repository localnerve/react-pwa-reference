/***
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */

// NOTE:
// According to https://webpack.js.org/plugins/uglifyjs-webpack-plugin/
// UglifyJsPlugin alias on schedule to be restored webpack.optimize.
// import webpack from 'webpack';

import UglifyJsPlugin from 'uglifyjs-webpack-plugin';

/**
 * Create the webpack uglifyJSPlugin with its options.
 */
export default function uglifyPluginFactory () {
  return new UglifyJsPlugin({
    uglifyOptions: {
      compress: {
        warnings: false
      },
      output: {
        comments: false
      }
    }
  });
}

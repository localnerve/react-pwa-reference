/***
 * Copyright (c) 2016 - 2021 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 * 
 * Kept to allow custom minification options. Historically, was UglifyJS (thus name).
 */

import TerserPlugin from 'terser-webpack-plugin';

/**
 * Create the webpack es6 compression with custom options.
 */
export default function uglifyPluginFactory () {
  return new TerserPlugin({
    terserOptions: {
      compress: {
        warnings: false
      },
      output: {
        comments: false
      }
    }
  });
}

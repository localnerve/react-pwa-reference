/***
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import path from 'path';
import makeMode from './utils/mode';
import uglifyPluginFactory from './plugins/uglify';

/**
 * Generate the inline script bundle.
 *
 * @param {Object} settings - The project settings.
 * @param {String} type - One of ['dev', 'prod', 'perf'].
 * @returns {Object} The web pack config for the inline bundle.
 */
export default function inlineConfig (settings, type) {
  const config = {
    mode: makeMode(type),
    entry: `./${settings.src.inlineScript}`,
    output: {
      path: settings.webpack.absoluteOutputPath,
      filename: path.basename(settings.dist.inlineScript)
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
    stats: 'verbose'
  };

  if (type === 'prod') {
    config.optimization = {
      minimizer: [
        uglifyPluginFactory()  
      ]
    };
  }

  return config;
}

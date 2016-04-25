/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import path from 'path';
import webpack from 'webpack';
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
    entry: `./${settings.src.inlineScript}`,
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

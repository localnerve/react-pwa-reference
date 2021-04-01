/***
 * Copyright (c) 2016 - 2021 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import makeMode from './utils/mode';
import uglifyPluginFactory from './plugins/uglify';
import statsPluginFactory from './plugins/stats';

/**
 * Generate the service worker main script bundle.
 *
 * @param {Object} settings - The project settings.
 * @param {String} type - One of ['dev', 'prod', 'perf'].
 * @returns {Object} The web pack config for the service worker bundle.
 */
export default function swMainConfig (settings, type) {
  const devtoolModuleFilenameTemplate = 'webpack:///sw/[resource-path]';

  const config = {
    mode: makeMode(type),
    entry: {
      sw: `./${settings.src.serviceWorker.entry}`
    },
    output: {
      path: settings.webpack.absoluteOutputPath,
      publicPath: settings.web.scripts,
      // One name to rule them all
      filename: '[name].js',
      devtoolModuleFilenameTemplate: type === 'prod'
        ? undefined : devtoolModuleFilenameTemplate
    },
    module: {
      rules: [
        {
          test: /\.json$/,
          exclude: /^\/node_modules/,
          type: 'json'
        },
        {
          test: /\.js$/,
          loader: 'string-replace-loader',
          options: {
            search: '__TEST__',
            replace: '""'
          }
        },
        {
          test: /\.js$/,
          exclude: /(^\/node_modules|\.json$)/,
          loader: 'babel-loader'
        }
      ]
    },
    devtool: type === 'prod' ? undefined : 'source-map',
    target: 'webworker',
    stats: 'verbose',
    plugins: [
      statsPluginFactory(settings, false)
    ],
    optimization: type === 'prod' ? {
      minimizer: [
        uglifyPluginFactory()
      ]      
    } : undefined
  };

  return config;
}

/***
 * Copyright (c) 2016 - 2022 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import makeMode from './utils/mode';
import uglifyPluginFactory from './plugins/uglify';
import statsPluginFactory from './plugins/stats';

/**
 * Generate the webpack config for the service worker registration bundle.
 *
 * @param {Object} settings - The project settings.
 * @param {String} type - One of ['dev', 'prod', 'perf'].
 * @returns {Object} The web pack config for the sw reg bundle.
 */
export default function swRegConfig (settings, type) {
  const devtoolModuleFilenameTemplate = 'webpack:///sw-reg/[resource-path]';

  const config = {
    mode: makeMode(type),
    entry: {
      swReg: `./${settings.src.serviceWorker.registration}`
    },
    output: {
      path: settings.webpack.absoluteOutputPath,
      filename: type === 'prod' ? '[name].[chunkhash].min.js' : '[name].js',
      publicPath: settings.web.scripts,
      devtoolModuleFilenameTemplate: type === 'prod'
        ? undefined : devtoolModuleFilenameTemplate
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
    devtool: type === 'prod' ? undefined : 'source-map',
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

/***
 * Copyright (c) 2016 - 2022 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import path from 'path';
import webpack from 'webpack';
import LodashModuleReplacementPlugin from 'lodash-webpack-plugin';
import makeMode from './utils/mode';
import uglifyPluginFactory from './plugins/uglify';
import statsPluginFactory from './plugins/stats';

/**
 * Generate the webpack config for the main application bundle.
 *
 * @param {Object} settings - The project settings.
 * @param {String} type - One of ['dev', 'prod', 'perf'].
 * @returns {Object} The web pack config for the main app bundle.
 */
export default function mainConfig (settings, type) {
  const devtoolModuleFilenameTemplate = 'webpack:///main/[resource-path]';
  const reactDOMServerStub = 'utils/react/reactDOMServer';
  const objectAssignMock = 'utils/polyfills/object-assign';
  const es6PromiseMock = 'utils/polyfills/es6-promise';
  const definitions = {
    DEBUG: type === 'dev'
  };
  const statsFile = type === 'prod' ? 'webpack-stats-main.json' : false;

  const config = {
    mode: makeMode(type),
    resolve: {
      extensions: ['.js', '.jsx']
    },
    entry: `./${settings.src.clientEntry}`,
    output: {
      path: settings.webpack.absoluteOutputPath,
      publicPath: `${settings.web.scripts}/`,
      filename: type === 'prod' ? '[name].[chunkhash].min.js' : '[name].js',
      chunkFilename: type === 'prod' ? '[name].[chunkhash].min.js' : '[name].js',
      library: {
        name: 'AppMain',
        type: 'window',
        export: 'default'
      }
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'string-replace-loader',
          options: {
            search: '__TEST__',
            replace: '""'
          }
        },
        {
          test: /\.(js|jsx)$/,
          include: [
            `${path.resolve(settings.src.baseDir)}`
          ],
          loader: 'babel-loader'
        }
      ]
    },
    plugins: [
      new LodashModuleReplacementPlugin({
        collections: true
      }),
      new webpack.DefinePlugin(definitions),
      new webpack.NormalModuleReplacementPlugin(
        /es6-promise/, require.resolve(es6PromiseMock)
      ),
      new webpack.NormalModuleReplacementPlugin(
        /for-each/, require.resolve('lodash/forEach')
      ),
      new webpack.NormalModuleReplacementPlugin(
        /is-function/, require.resolve('lodash/isFunction')
      ),
      new webpack.NormalModuleReplacementPlugin(
        /lodash\.debounce/, require.resolve('lodash/debounce')
      ),
      new webpack.NormalModuleReplacementPlugin(
        /lodash\.assign/, require.resolve(objectAssignMock)
      ),
      new webpack.NormalModuleReplacementPlugin(
        /object-assign/, require.resolve(objectAssignMock)
      ),
      new webpack.NormalModuleReplacementPlugin(
        /ReactDOMServer/, require.resolve(reactDOMServerStub)
      ),
      new webpack.NormalModuleReplacementPlugin(
        /^react-?$/, require.resolve('react')
      ),
      statsPluginFactory(settings, statsFile)
    ],
    stats: 'verbose'
  };

  if (type === 'prod') {
    config.optimization = {
      minimizer: [
        uglifyPluginFactory()
      ]
    };
  }

  if (type !== 'prod') {
    config.output.devtoolModuleFilenameTemplate = devtoolModuleFilenameTemplate;
    config.devtool = 'source-map';
  }

  return config;
}

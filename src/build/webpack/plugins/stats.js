/***
 * Copyright (c) 2016 - 2022 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/*eslint no-console:0 */
import { promises as fs } from 'fs';
import merge from 'lodash/merge';
import AsyncLock from 'async-lock';

const lock = new AsyncLock({
  timeout: 5000
});
const statsKey = 'stats';

/**
 * Add the options for consumption by statsPlugin.
 *
 * @param {Object} settings - The project settings.
 */
function statsPluginOptions (settings) {
  return {
    assetsJson: settings.src.assetsJson,
    /* eslint-disable no-useless-escape */
    CHUNK_REGEX: /^([A-Za-z0-9_\-]+)\..*/
    /* eslint-enable no-useless-escape */
  };
}

/**
 * Generate the webpack assets config, optionally stats.
 *
 * @param {Object} options - stats plugin options.
 * @param {String} options.assetsJson - String the assets json file path.
 * @param {RegExp} options.CHUNK_REGEX - The regular expression identifying a chunk.
 * @param {String|Boolean} statsJson - A path to a file to collect the build stats, make falsy to skip.
 * @param {Object} compiler - A reference to the current webpack compiler.
 */
function statsPlugin (options, statsJson, compiler) {
  compiler.hooks.done.tapPromise('statsPlugin', stats => {
    const assetsJsonFile = options.assetsJson;
    const data = stats.toJson();
    const assets = data.assetsByChunkName;
    let output = {
      assets: {}
    };

    Object.keys(assets).forEach(key => {
      const value = assets[key];
      // If regex matched, use [name] for key
      const matches = key.match(options.CHUNK_REGEX);
      if (matches) {
        key = matches[1];
      }
      output.assets[key] = value;
    });

    // Webpack can be running multiple configurations in parallel...
    // THIS IS NO LONGER TRUE from WEBPACK 2+ for multi-compiler invocations.
    // However, you can make it so using webpack-parallel or other packages.
    // No harm in forcing serial execution.
    return lock.acquire(statsKey, () => {
      return fs.readFile(assetsJsonFile, { encoding: 'utf8' })
        .then(data => JSON.parse(data), () => {
          console.warn(
            '\nWARNING:\n',
            `assetsJsonFile '${assetsJsonFile}' not found, this might be OK\n`
          );
          return {};
        })
        .then(previousOutput => merge(previousOutput, output))
        .then(newOutput => fs.writeFile(assetsJsonFile, JSON.stringify(newOutput, null, 4)))
        .then(() => {
          if (statsJson) {
            return fs.writeFile(statsJson, JSON.stringify(data));
          }
        })
        .catch(e => {
          console.error(e);
          throw e; // rethrow to stop the build
        });
    });
  });
}

/**
 * The StatsPlugin class.
 * Exposes statsPlugin to webpack.
 */
class StatsPlugin {
  constructor (settings, statsFile) {
    this.options = statsPluginOptions(settings);
    this.file = statsFile
  }
  apply (compiler) {
    statsPlugin(this.options, this.file, compiler);
  }
}

/**
 * Create an instance of the StatsPlugin.
 * 
 * @param {Object} settings - The build settings
 * @param {String|Boolean} statsFile - The statsFile, or falsy
 * @returns {Object} Instance of Webpack StatsPlugin
 */
export default function statsPluginFactory (settings, statsFile) {
  return new StatsPlugin(settings, statsFile);
}

/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/*eslint no-console:0 */
import fs from 'fs';
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
 * @param {Object} [options] - The options object to ammend.
 */
export function statsPluginOptions (settings, options) {
  options = options || {};

  const pluginOptions = {
    assetsJson: settings.src.assetsJson,
    CHUNK_REGEX: /^([A-Za-z0-9_\-]+)\..*/
  };

  if (options.custom) {
    options.custom = merge(options.custom, pluginOptions);
  } else {
    options.custom = pluginOptions;
  }

  return options;
}

/**
 * Generate the webpack assets config
 *
 * @param {Object} self - A reference to the current webpack execution context
 * @param {String} [statsJson] - A path to a file to collect the build stats.
 */
export function statsPlugin (self, statsJson) {
  self.plugin('done', function (stats) {
    const assetsJsonFile = self.options.custom.assetsJson;
    const data = stats.toJson();
    const assets = data.assetsByChunkName;
    let output = {
      assets: {}
    };

    Object.keys(assets).forEach((key) => {
      const value = assets[key];

      // If regex matched, use [name] for key
      const matches = key.match(self.options.custom.CHUNK_REGEX);
      if (matches) {
        key = matches[1];
      }
      output.assets[key] = value;
    });

    // webpack can be running multiple configurations in parallel...
    lock.acquire(statsKey, (done) => {
      // If assetsJsonFile exists, merge output
      if (fs.existsSync(assetsJsonFile)) {
        const previousOutput = JSON.parse(
         fs.readFileSync(assetsJsonFile, { encoding: 'utf8' })
        );
        output = merge(previousOutput, output);
      }

      fs.writeFileSync(assetsJsonFile, JSON.stringify(output, null, 4));

      if (statsJson) {
        fs.writeFileSync(statsJson, JSON.stringify(data));
      }
      done();
    }, (err) => {
      if (err) {
        console.error('lock.acquire error writing assets/stats: ' + err);
      }
    })
  });
}

export default {
  statsPluginOptions,
  statsPlugin
};

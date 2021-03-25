/***
 * Copyright (c) 2016 - 2021 Alex Grant (@localnerve), LocalNerve LLC
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
 */
export function statsPluginOptions (settings) {
  return {
    assetsJson: settings.src.assetsJson,
    /* eslint-disable no-useless-escape */
    CHUNK_REGEX: /^([A-Za-z0-9_\-]+)\..*/
    /* eslint-enable no-useless-escape */
  };
}

/**
 * Generate the webpack assets config
 *
 * @param {Object} self - A reference to the current webpack execution context
 * @param {Object} options - stats plugin options.
 * @param {String} options.assetsJson - String the assets json file path.
 * @param {RegExp} options.CHUNK_REGEX - The regular expression identifying a chunk.
 * @param {String} [statsJson] - A path to a file to collect the build stats.
 */
export function statsPlugin (self, options, statsJson) {
  self.plugin('done', function (stats) {
    const assetsJsonFile = options.assetsJson;
    const data = stats.toJson();
    const assets = data.assetsByChunkName;
    let output = {
      assets: {}
    };

    Object.keys(assets).forEach((key) => {
      const value = assets[key];

      // If regex matched, use [name] for key
      const matches = key.match(options.CHUNK_REGEX);
      if (matches) {
        key = matches[1];
      }
      output.assets[key] = value;
    });

    // webpack can be running multiple configurations in parallel...
    // THIS IS NO LONGER TRUE in WEBPACK 2. However, I've hope it WILL BE
    // TRUE AGAIN (and there's no harm in synchronizing this).
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

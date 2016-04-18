/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/*eslint no-console:0 */
'use strict';

var fs = require('fs');
var merge = require('lodash/merge');
var AsyncLock = require('async-lock');
var lock = new AsyncLock({
  timeout: 5000
});
var statsKey = 'stats';

/**
 * Add the options for consumption by statsPlugin.
 *
 * @param {Object} settings - The project settings.
 * @param {Object} [options] - The options object to ammend.
 */
function statsPluginOptions (settings, options) {
  options = options || {};

  var statsPluginOptions = {
    assetsJson: settings.src.assetsJson,
    CHUNK_REGEX: /^([A-Za-z0-9_\-]+)\..*/
  };

  if (options.custom) {
    options.custom = merge(options.custom, statsPluginOptions);
  } else {
    options.custom = statsPluginOptions;
  }

  return options;
}

/**
 * Generate the webpack assets config
 *
 * @param {Object} self - A reference to the current webpack execution context
 * @param {String} [statsJson] - A path to a file to collect the build stats.
 */
function statsPlugin (self, statsJson) {
  self.plugin('done', function (stats) {
    var assetsJsonFile = self.options.custom.assetsJson;
    var data = stats.toJson();
    var assets = data.assetsByChunkName;
    var output = {
      assets: {}
    };

    Object.keys(assets).forEach(function (key) {
      var value = assets[key];

      // If regex matched, use [name] for key
      var matches = key.match(self.options.custom.CHUNK_REGEX);
      if (matches) {
        key = matches[1];
      }
      output.assets[key] = value;
    });

    // webpack can be running multiple configurations in parallel...
    lock.acquire(statsKey, function (done) {
      // If assetsJsonFile exists, merge output
      if (fs.existsSync(assetsJsonFile)) {
        var previousOutput = JSON.parse(
         fs.readFileSync(assetsJsonFile, { encoding: 'utf8' })
        );
        output = merge(previousOutput, output);
      }

      fs.writeFileSync(assetsJsonFile, JSON.stringify(output, null, 4));

      if (statsJson) {
        fs.writeFileSync(statsJson, JSON.stringify(data));
      }
      done();
    }, function (err) {
      if (err) {
        console.error('lock.acquire error writing assets/stats: ' + err);
      }
    })
  });
}

module.exports = {
  statsPluginOptions: statsPluginOptions,
  statsPlugin: statsPlugin
};

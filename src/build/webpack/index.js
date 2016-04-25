/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

var webpack = require('webpack');

var configFactoryGroups = {
  main: [
    require('./inline'),
    require('./main'),
    require('./swReg')
  ],
  sw: [
    require('./swMain')
  ]
};

/**
 * Creates a task for webpack bundling/compiling groups of output targets.
 *
 * @param {String} group - The grouping of compilations, ['main', 'sw'].
 * @param {Object} settings - The project settings.
 * @param {String} target - ['dev', 'perf', 'prod'].
 * @returns nothing, calls done when complete.
 */
function webpackTaskFactory (group, settings, target) {
  return function taskWebpack (done) {
    const configFactories = configFactoryGroups[group];

    webpack(configFactories.map(function (configFactory) {
      return configFactory(settings, target);
    }), function (err) {
      done(err);
    });
  };
}

module.exports = webpackTaskFactory;

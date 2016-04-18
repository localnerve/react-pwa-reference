/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * The server-side main config loader.
 *
 */
'use strict';

var fs = require('fs');
var path = require('path');
var nconf = require('nconf');

var localEnv = 'local.env.json';

// Files to exclude when building the configuration objects.
var exclude = [ 'index.js', localEnv ];

/**
 * Loads modules in this directory.
 * Creates an object keyed by modules names found in this directory.
 *
 * @param {Object} nconf - The nconfig object.
 * @returns {Object} An object that contains all the configuration objects
 * keyed by module name. Configuration objects are formed by the
 * module export functions of modules found in this directory.
 */
function configs (nconf) {
  var result = {};
  fs.readdirSync(__dirname).forEach(function (item) {
    var name = path.basename(item);
    if (exclude.indexOf(name) === -1) {
      result[name] = require('./' + name)(nconf);
    }
  });
  return result;
}

/**
 * Create a new configuration object, applying any overrides.
 *
 * Creates and tears off a new configuration object formed by the precedence:
 * 1. Overrides
 * 2. The process environment
 * 3. The local environment file
 * 4. Configuration object modules found in this directory
 *
 * @param {Object} overrides - highest priority configuration overrides.
 * @returns {Object} An object containing a copy of the full configuration.
 */
function create (overrides) {
  nconf
    .overrides(overrides || {})
    .env()
    .file({ file: path.join(__dirname, localEnv) })
    .defaults(configs(nconf));

  var config = nconf.get();

  // Remove all the items that pass the filter
  Object.keys(config).filter(function (key) {
    return /^(?:npm)?_/.test(key);
  }).forEach(function (key) {
    delete config[key];
  });

  return config;
}

module.exports = {
  create: create
};

/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Fetch main resource and write routes and models fixture files.
 * Run as npm script
 */
'use strict';

var debug = require('debug')('FixtureGenerator:Routes-Models');
var fs = require('fs');
var path = require('path');
var config = require('configs').create();
var fetch = require('application/server/services/data/fetch');
var cache = require('application/server/services/data/cache-interface');

var replacement = 'DATA';

var template = '/** This is a generated file **/\n\
/**\n\
  GENERATION_TIME = ' + (new Date()).toString() + '\n\
  NODE_ENV = ' + (process.env.NODE_ENV || 'development') + '\n\
  FRED_URL = ' + config.data.FRED.url() + '\n\
**/\n\
/*eslint quotes:0 */\n\
module.exports = JSON.parse(JSON.stringify(\n' + replacement + '\n));'
;

function run (output, done) {
  // Get main resource - includes routes, models
  // Fetch uses the environment to target backend versions (using branches)
  // The target environment is set in the calling grunt task
  fetch.fetchMain(function (err, routes) {
    if (err) {
      debug('main resource fetch failed');
      return done(err);
    }

    // Prepare routes file output
    var contents = template.replace(replacement, JSON.stringify(
      routes.content
    ));

    // Compute the output file location
    var outputRoutes = require.resolve(path.join(
      'test/fixtures/', output.routes
    ));

    fs.writeFile(outputRoutes, contents, function (err) {
      if (err) {
        debug('write of routes response failed');
        return done(err);
      }

      debug('successfully wrote routes response file '+ outputRoutes);

      // Prepare models file output - models cached by main resource fetch
      contents = template.replace(replacement, JSON.stringify(
        cache.get('models').content
        )
      );

      // Compute the output file location
      var outputModels = require.resolve(path.join(
        'test/fixtures', output.models
      ));

      fs.writeFile(outputModels, contents, function (err) {
        if (err) {
          debug('write of models response failed');
          return done(err);
        }

        debug('successfully wrote models response file '+ outputModels);
        done();
      });
    });
  });
}

module.exports = run;

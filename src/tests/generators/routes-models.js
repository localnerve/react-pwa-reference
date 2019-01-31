/**
 * Copyright (c) 2016 - 2019 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Fetch main resource and write routes and models fixture files.
 * Run as npm script
 */
import debugLib from 'debug';
import fs from 'fs';
import path from 'path';
import configLib from 'configs';
import fetch from 'application/server/services/data/fetch';
import cache from 'application/server/services/data/cache-interface';

const debug = debugLib('fixture-generator:routes-models');
const config = configLib.create();
const replacement = 'DATA';

const template = '/** This is a generated file **/\n\
/**\n\
  GENERATION_TIME = ' + (new Date()).toString() + '\n\
  NODE_ENV = ' + (process.env.NODE_ENV || 'development') + '\n\
  FRED_URL = ' + config.data.FRED.url() + '\n\
**/\n\
/*eslint quotes:0 */\n\
module.exports = JSON.parse(JSON.stringify(\n' + replacement + '\n));'
;

/**
 * Run the routes and modules response fixture generation.
 *
 * @param {Object} params - ignored.
 * @param {Function} done - callback when complete.
 */
export function run (params, done) {
  // Get main resource - includes routes, models
  // Fetch uses the environment to target backend versions (using branches)
  // The target environment is set in the calling grunt task
  fetch.fetchMain((err, routes) => {
    if (err) {
      debug('main resource fetch failed');
      return done(err);
    }

    // Prepare routes file output
    let contents = template.replace(replacement, JSON.stringify(
      routes.content
    ));

    // Compute the output file location
    const outputRoutes = require.resolve(path.join(
      'test/fixtures/', 'routes-response.js'
    ));

    fs.writeFile(outputRoutes, contents, (err) => {
      if (err) {
        debug('write of routes response failed');
        return done(err);
      }

      debug('successfully wrote routes response file '+ outputRoutes);

      // Prepare models file output - models cached by main resource fetch
      contents = template.replace(replacement, JSON.stringify(
        cache.get('models').content
      ));

      // Compute the output file location
      const outputModels = require.resolve(path.join(
        'test/fixtures', 'models-response.js'
      ));

      fs.writeFile(outputModels, contents, (err) => {
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

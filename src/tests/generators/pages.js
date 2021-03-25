/**
 * Copyright (c) 2016 - 2021 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Fetch main resource and write page resource fixture files.
 * Run as npm script
 */
/* global Promise */
import debugLib from 'debug';
import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import configLib from 'configs';
import utils from 'utils/node';
import fetch from 'application/server/services/data/fetch';

const debug = debugLib('fixture-generator:pages');
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
 * Run page resource fixture generation.
 *
 * @param {Object} params - ignored.
 * @param {Function} done - callback when complete.
 */
export function run (params, done) {
  // Get main resource - includes routes, models
  // Fetch uses the environment to target backend versions (using branches)
  // The target environment is set in the calling task
  fetch.fetchMain((err, routes) => {
    if (err) {
      debug('main resource fetch failed');
      return done(err);
    }

    const modelsWithContent = {};
    routes = routes.content;

    Promise.all(
      Object.keys(routes).map((route) => {
        const actionParams = routes[route].action.params;
        if (actionParams) {
          const resource = actionParams.resource;

          return utils.nodeCall(fetch.fetchOne, actionParams)
            .then((data) => {
              const outputFilePath = path.join(
                path.dirname(require.resolve('test/fixtures/')),
                `${resource}-response.js`
              );

              const contents = template.replace(replacement, JSON.stringify(
                data
              ));

              _.filter(data.models, (o) => {
                return o.url && o.resource;
              })
                .forEach((model) => {
                  modelsWithContent[model.resource] = model;
                });

              return utils.nodeCall(fs.writeFile, outputFilePath, contents);
            });
        }
        return Promise.resolve();
      })
    )
      .then(() => {
        return Promise.all(
          Object.keys(modelsWithContent).map((model) => {
            const params = Object.assign({}, modelsWithContent[model]);

            return utils.nodeCall(fetch.fetchOne, params)
              .then((data) => {
                const outputFilePath = path.join(
                  path.dirname(require.resolve('test/fixtures/')),
                  `${modelsWithContent[model].resource}-response.js`
                );

                const contents = template.replace(replacement, JSON.stringify(
                  data
                ));

                return utils.nodeCall(fs.writeFile, outputFilePath, contents);
              });
          })
        );
      })
      .then(() => {
        done();
      })
      .catch((error) => {
        debug(error);
        done(error);
      });
  });
}

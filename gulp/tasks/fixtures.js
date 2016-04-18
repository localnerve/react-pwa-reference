/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global module */
/*eslint no-console:0 */
import fs from 'fs';
import path from 'path';
import utils from '../../utils';

export default function fixturesTaskFactory () {
  const generatorsDir = './tests/generators';
  const options = {
    'routes-models.js': {
      output: {
        routes: 'tests/fixtures/routes-response.js',
        models: 'tests/fixtures/models-response.js'
      }
    }
  }

  return function fixtures (done) {
    utils.nodeCall(fs.readdir, generatorsDir)
    .then((generators) => {
      generators.forEach((generatorScript) => {
        const generator = path.resolve('.', generatorsDir, generatorScript);
        module.require(generator)(options[generatorScript].output, done);
      });
    })
    .catch((error) => {
      console.error(`fixtures task failed: ${error}`);
    });
  };
}

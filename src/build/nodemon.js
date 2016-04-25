/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global Set */
import path from 'path';
import gulpNodemon from 'gulp-nodemon';

/**
 * Factory for the nodemon task.
 *
 * @param {Object} settings - The project settings.
 * @param {String} target - True for production, false otherwise.
 * @returns {Function} The nodemon task.
 */
export default function nodemonTaskFactory (settings, target) {
  const options = {
    ignore: [
      'gulp*',
      `${settings.distbase}/**`,
      settings.src.serviceWorker.data,
      settings.src.serviceWorker.precache,
      settings.src.assetsJson
    ],
    ext: 'js jsx',
    tasks: (changedFiles) => {
      const buildTarget = target === 'debug' ? 'dev' : target;
      const tasks = new Set();

      changedFiles.forEach((file) => {
        if (/\/sw\/?$/.test(path.dirname(file))) {
          tasks.add(`bundlesSw_${buildTarget}`);
        } else {
          tasks.add(`bundlesMain_${buildTarget}`);
        }
      });

      return Array.from(tasks);
    }
  };

  if (target === 'debug') {
    options.nodeArgs = ['--debug-brk'];
  }

  return function nodemon (done) {
    gulpNodemon(options);
    done();
  }
}

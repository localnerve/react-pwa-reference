/***
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global Set */
import path from 'path';
import gulpNodemon from 'gulp-nodemon';

/**
 * Factory for the nodemon task.
 *
 * @param {Object} settings - The project settings.
 * @param {String} target - One of ['dev', 'debug', 'perf', 'prod'].
 * @returns {Function} The nodemon task.
 */
export default function nodemonTaskFactory (settings, target) {
  const legacyWatchOptions = {
    legacyWatch: true,
    pollingInterval: 250
  };

  const debugTarget = ['debug', 'inspect'].indexOf(target) > -1;

  const options = {
    ignore: [
      settings.src.serviceWorker.data,
      settings.src.serviceWorker.precache,
      settings.src.assetsJson,
      settings.src.assetsRevManifest
    ],
    ignoreRoot: [
      'build',
      'tests',
      'node_modules/application'
    ],
    verbose: true,
    ext: 'js jsx scss',
    watch: settings.src.baseDir,
    tasks: (changedFiles) => {
      const buildTarget = debugTarget ? 'dev' : target;
      const tasks = new Set();

      changedFiles.forEach((file) => {
        if (/\.js.?$/.test(file)) {
          if (/\/sw\/?/.test(path.dirname(file))) {
            tasks.add(`bundlesSw_${buildTarget}`);
          } else {
            tasks.add(`bundlesMain_${buildTarget}`);
          }
        } else {
          // Must be scss
          tasks.add(`ccss_${buildTarget}`);
        }
      });

      return Array.from(tasks);
    }
  };

  // This is a workaround for an OSX/chokidar issue I'm experiencing (#217)
  if (process.platform === 'darwin') {
    Object.assign(options, legacyWatchOptions);
  }

  if (debugTarget) {
    options.nodeArgs = ['--debug-brk'];
    if (target === 'inspect') {
      options.nodeArgs.push('--inspect');
    }
  }

  return function nodemon (done) {
    gulpNodemon(options);
    done();
  }
}

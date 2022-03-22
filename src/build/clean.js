/***
 * Copyright (c) 2016 - 2022 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import del from 'del';

/**
 * Factory for the clean task.
 * Cleanup build output and other miscellaneous generated src files.
 *
 * @param {Object} settings - The project settings.
 * @returns {Function} The clean task.
 */
export default function cleanTaskFactory (settings) {
  return function clean () {
    return del([
      settings.dist.baseDir,
      settings.src.assetsJson,
      settings.src.serviceWorker.precache,
      settings.src.serviceWorker.data
    ]);
  };
}

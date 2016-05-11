/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import gulp from 'gulp';

/**
 * Factory for the symlink task.
 *
 * @param {Object} settings - The project settings.
 * @param {Boolean} output - True to create symlink in output, false for src.
 * @returns {Function} the symlink task.
 */
export default function symlinkTaskFactory (settings, output) {
  const target = output ? 'output' : 'src';

  return function symlink () {
    return gulp.src(`./${settings[target].application}`, {
      allowEmpty: true
    })
    .pipe(gulp.symlink(`./${settings[target].baseDir}/node_modules`));
  }
}

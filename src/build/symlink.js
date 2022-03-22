/***
 * Copyright (c) 2016 - 2022 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import gulp from 'gulp';
import { sync as mkdirp } from 'mkdirp'

/**
 * Factory for the symlink task.
 * Ensure the link target exists (allowEmpty on src will not work).
 *
 * @param {Object} settings - The project settings.
 * @param {Boolean} output - True to create symlink in output, false for src.
 * @returns {Function} the symlink task.
 */
export default function symlinkTaskFactory (settings, output) {
  const target = output ? 'output' : 'src';

  return function symlink () {
    mkdirp(`./${settings[target].application}`);

    return gulp.src(`./${settings[target].application}`)
      .pipe(
        gulp.symlink(`./${settings[target].baseDir}/node_modules`)
      );
  }
}

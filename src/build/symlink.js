/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import gulp from 'gulp';

/**
 * Factory for the symlink task.
 *
 * TODO: use settings.
 *
 * @param {Boolean} output - True to create symlink in output, false for src.
 * @returns {Function} the symlink task.
 */
export default function symlinkTaskFactory (output) {
  const baseDir = `./${output ? 'output' : 'src'}`;

  return function symlink () {
    return gulp.src(`${baseDir}/application`)
    .pipe(gulp.symlink(`${baseDir}/node_modules`));
  }
}

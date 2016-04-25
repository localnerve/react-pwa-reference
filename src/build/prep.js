/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import gulp from 'gulp';
import symlinkTaskFactory from './symlink';
import del from 'del';

/**
 * Factory for the prep task.
 * Runs before a compilation task to make the output complete/correct.
 * Copies json, makes symlinks.
 *
 * @param {Object} settings - The project settings.
 * @returns {Function} the prep task.
 */
export default function prepTaskFactory (settings) {
  return gulp.series(
    function clean () {
      return del([settings.output.baseDir]);
    },
    function json () {
      return gulp.src(`${settings.src.baseDir}/**/*.json`)
      .pipe(gulp.dest(settings.output.baseDir));
    },
    symlinkTaskFactory(settings, true)
  );
}

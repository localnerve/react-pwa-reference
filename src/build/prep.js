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
 * TODO: use settings.
 *
 * @returns {Function} the prep task.
 */
export default function prepTaskFactory () {
  return gulp.series(
    function clean () {
      return del(['./output']);
    },
    function json () {
      return gulp.src('./src/**/*.json')
      .pipe(gulp.dest('./output'));
    },
    symlinkTaskFactory(true)
  );
}

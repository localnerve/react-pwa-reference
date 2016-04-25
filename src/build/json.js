/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import gulp from 'gulp';

/**
 * Factory for the json task.
 * Just copies json files to output.
 * TODO: use settings.
 *
 * @returns {Function} the json task.
 */
export default function jsonTaskFactory () {
  return function json () {
    return gulp.src('./src/**/*.json')
    .pipe(gulp.dest('./output'));
  }
}

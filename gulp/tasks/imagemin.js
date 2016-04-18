/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import gulp from 'gulp';
import gulpImagemin from 'gulp-imagemin';

export default function imageminTaskFactory (settings) {
  return function imagemin () {
    return gulp.src('**/*.{jpg,jpeg,png}', {
      cwd: settings.src.images
    })
    .pipe(gulpImagemin({
      progressive: true
    }))
    .pipe(gulp.dest(settings.dist.images));
  };
}

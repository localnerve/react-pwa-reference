/***
 * Copyright (c) 2016 - 2021 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import gulp from 'gulp';
import gulpImagemin from 'gulp-imagemin';

/**
 * Factory for the imagemin task.
 * Optimizes applicable images for the project.
 * Outputs the optimized images to appropriate dist location.
 *
 * @param {Object} settings - The project settings.
 * @returns {Function} The imagemin task.
 */
export default function imageminTaskFactory (settings) {
  return function imagemin () {
    return gulp.src('**/*.{jpg,jpeg,png}', {
      cwd: settings.assets.images
    })
      .pipe(
        gulpImagemin([
          gulpImagemin.gifsicle(),
          gulpImagemin.mozjpeg({ quality: 60, progressive: true }),
          gulpImagemin.optipng(),
          gulpImagemin.svgo()
        ])
      )
      .pipe(
        gulp.dest(settings.dist.images)
      );
  };
}

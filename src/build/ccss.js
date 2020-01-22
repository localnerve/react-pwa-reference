/***
 * Copyright (c) 2016 - 2020 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import gulp from 'gulp';
import gulpSvgmin from 'gulp-svgmin';
import gulpSass from 'gulp-sass';
import gulpPostcss from 'gulp-postcss';
import gulpIf from 'gulp-if';
import gulpCssClean from 'gulp-clean-css';
import autoprefixer from 'autoprefixer';
import assetFunctions from 'node-sass-asset-functions';

/**
 * Minimize svgs.
 *
 * @param {Object} settings - The project config settings.
 */
function svgmin (settings) {
  return gulp.src('**/*.svg', {
    cwd: settings.assets.images
  })
    .pipe(
      gulpSvgmin()
    )
    .pipe(
      gulp.dest(settings.dist.images)
    );
}

/**
 * Compile the sass.
 * Applies autoprefixer.
 * Applies cssmin if production.
 *
 * @param {Object} settings - The project config settings.
 * @param {Boolean} prod - True if production, false otherwise.
 */
function sass (settings, prod) {
  return gulp.src('*.scss', {
    cwd: settings.src.styles
  })
    .pipe(gulpSass({
      functions: assetFunctions({
        images_path: settings.dist.images,
        http_images_path: settings.web.images,
        fonts_path: settings.dist.fonts,
        http_fonts_path: settings.web.fonts
      }),
      includePaths: [
        settings.vendor.css,
        settings.src.components,
        'node_modules/react-spinner'
      ],
      outputStyle: prod ? 'compressed' : 'nested'
    }).on('error', gulpSass.logError))
    .pipe(
      gulpPostcss([ autoprefixer() ])
    )
    .pipe(
      gulpIf(prod, gulpCssClean({
        keepSpecialComments: 0
      }))
    )
    .pipe(
      gulp.dest(settings.dist.styles)
    );
}

/**
 * Prep assets and compile css.
 *
 * @param {Object} settings - The project config settings.
 * @param {Boolean} prod - True if production, false otherwise.
 */
export default function ccssTaskFactory (settings, prod) {
  return gulp.series(
    svgmin.bind(null, settings),
    sass.bind(null, settings, prod)
  );
}

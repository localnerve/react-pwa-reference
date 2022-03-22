/**
 * Convert build type to webpack 4 mode.
 *
 * Copyright (c) 2016 - 2022 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */

/**
 * Convert the build type into a webpack mode.
 *
 * @param {String} type - One of ['dev', 'prod', 'perf'].
 */
export default function makeMode (type) {
  return type === 'dev' ? 'development' : 'production';
}
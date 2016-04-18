/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import del from 'del';

export default function cleanTaskFactory (settings) {
  return function clean () {
    return del([
      settings.dist.baseDir,
      settings.src.assetsJson
    ]);
  };
}

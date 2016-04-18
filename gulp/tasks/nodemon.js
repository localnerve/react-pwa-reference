/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import gulpNodemon from 'gulp-nodemon';

/**
 * nodemon task factory
 */
export default function nodemonTaskFactory (settings, debug) {
  const options = {
    ignore: ['node_modules/**', settings.distbase + '/**'],
    ext: 'js,jsx'
  };

  if (debug) {
    options.nodeArgs = ['--debug-brk'];
  }

  return function nodemon (done) {
    gulpNodemon(options);
    done();
  }
}

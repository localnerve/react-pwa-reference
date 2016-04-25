/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import gulp from 'gulp';
import taskFactories from './src/build';

// Register the project tasks
Object.keys(taskFactories).forEach((factoryName) => {
  gulp.task(factoryName, taskFactories[factoryName]());
});

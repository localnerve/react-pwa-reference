/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import gulp from 'gulp';
import tasks from './gulp/tasks';

// Register the project tasks
Object.keys(tasks).forEach((task) => {
  gulp.task(task, tasks[task]());
});

/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/*eslint no-console:0 */
import gulp from 'gulp';
import util from 'util';
import { create as configCreate } from '../../configs';
import cleanTaskFactory from './clean';
import copyTaskFactory from './copy';
import imageminTaskFactory from './imagemin';
import ccssTaskFactory from './ccss';
import nodemonTaskFactory from './nodemon';
import webpackTaskFactory from './webpack';
import fixturesTaskFactory from './fixtures';
import serviceWorkerTaskFactory from './service-worker';

/**
 * Setup the build process environment.
 *
 * @private
 * @param {Boolean} prod - True if production, false otherwise.
 */
function setupEnvironment (prod) {
  if (prod) {
    process.env.NODE_ENV = 'production';
  } else {
    process.env.NODE_ENV = 'development';
    process.env.DEBUG = '*,-babel';
    process.env.ERR_HANDLER_MAINT_RETRYAFTER = 7200;
    // process.env.ERR_HANDLER_MAINT_ENABLED = 'TRUE';
  }
}

/**
 * Standalone task to dump nconf to console
 */
export function dumpconfig () {
  return function taskDumpConfig (done) {
    console.log(util.inspect(configCreate(), { depth: null }));
    done();
  }
}

/**
 * Standalone development ccss task
 */
export function ccss () {
  let task;

  return gulp.series(
    function setup (done) {
      setupEnvironment(false);
      task = ccssTaskFactory(
        configCreate().settings,
        false
      );
      done();
    },
    function ccssTask (done) {
      return task(done);
    }
  );
}

/**
 * Standalone fixture generation task
 */
export function fixtures (prod) {
  return gulp.series(
    function setup (done) {
      setupEnvironment(prod);
      done();
    },
    fixturesTaskFactory()
  );
}

/**
 * The build orchestration.
 * Same used for all build targets: dev, debug, perf, and prod.
 *
 * @param {Boolean} interactive - true to start server, false otherwise.
 * @param {String} target - One of ['dev', 'debug', 'perf', 'prod'].
 * @returns {Function} The build task sequence.
 */
function buildTaskSequence (interactive, target) {
  const prod = (target === 'perf' || target === 'prod');

  const tasks = {};

  return gulp.series(
    function setup (done) {
      setupEnvironment(prod);
      const settings = configCreate().settings;

      tasks.clean = cleanTaskFactory(settings);
      tasks.copy = copyTaskFactory(settings);
      tasks.imagemin = imageminTaskFactory(settings);
      tasks.ccss = ccssTaskFactory(settings, prod);
      tasks.mainBundles = webpackTaskFactory(settings, 'main', target);
      tasks.serviceWorkerGenerate =
        serviceWorkerTaskFactory(settings, prod, target !== 'prod');
      tasks.serviceWorkerBundles =
        webpackTaskFactory(settings, 'sw', target);

      if (interactive) {
        tasks.nodemon = nodemonTaskFactory(settings, target === 'debug');
      }

      done();
    },
    function clean (done) {
      return tasks.clean(done);
    },
    function copy (done) {
      return tasks.copy(done);
    },
    function imagemin (done) {
      return tasks.imagemin(done);
    },
    gulp.parallel(
      function ccss (done) {
        return tasks.ccss(done);
      },
      function mainBundles (done) {
        return tasks.mainBundles(done);
      }
    ),
    function serviceWorkerGenerate (done) {
      return tasks.serviceWorkerGenerate(done);
    },
    function serviceWorkerBundles (done) {
      return tasks.serviceWorkerBundles(done);
    },
    function nodemon (done) {
      if (tasks.nodemon) {
        return tasks.nodemon(done);
      }
      console.log('skipping nodemon...');
      done();
    }
  );
}

export const dev = buildTaskSequence.bind(this, true, 'dev');
export const debug = buildTaskSequence.bind(this, true, 'debug');
export const perf = buildTaskSequence.bind(this, true, 'perf');
export const prod = buildTaskSequence.bind(this, true, 'prod');
export const build = buildTaskSequence.bind(this, false, 'prod');
export const fixturesDev = fixtures.bind(this, false);
export const fixturesProd = fixtures.bind(this, true);

export default {
  ccss,
  debug,
  dev,
  dumpconfig,
  perf,
  prod,
  build,
  fixturesDev,
  fixturesProd,
  'default': build
};

/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/*eslint no-console:0 */
import gulp from 'gulp';
import util from 'util';
import { create as configCreate } from 'configs';
import cleanTaskFactory from './clean';
import copyTaskFactory from './copy';
import jsonTaskFactory from './json';
import imageminTaskFactory from './imagemin';
import ccssTaskFactory from './ccss';
import nodemonTaskFactory from './nodemon';
import webpackTaskFactory from './webpack';
import fixturesTaskFactory from './fixtures';
import serviceWorkerTaskFactory from './service-worker';
import perfbudgetTaskFactory from './perfbudget';

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
 * Factory for the build task composition.
 * Same series used for all build targets: dev, debug, perf, and prod.
 *
 * @param {Boolean} interactive - true to start server, false otherwise.
 * @param {String} target - One of ['dev', 'debug', 'perf', 'prod'].
 * @returns {Function} The build task composition.
 */
function buildTaskCompFactory (interactive, target) {
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
        tasks.nodemon = nodemonTaskFactory(settings, target);
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

/**
 * Factory for standalone test fixture generation task composition.
 * Generates test fixtures from the backend data service.
 *
 * @param {Boolean} prod - True for production, false otherwise.
 * @returns The fixtures task composition.
 */
function fixturesTaskCompFactory (prod) {
  const tasks = {};

  return gulp.series(
    function setup (done) {
      setupEnvironment(prod);
      tasks.fixtures = fixturesTaskFactory(configCreate().settings);
      done();
    },
    function fixtures (done) {
      return tasks.fixtures(done);
    }
  );
}

/**
 * Factory for standalone task to dump nconf to console.
 *
 * @param {Boolean} prod - True if production, false otherwise.
 * @returns The dumpconfig task.
 */
function dumpConfigTaskFactory (prod) {
  return function dumpconfig (done) {
    setupEnvironment(prod);
    console.log(util.inspect(configCreate(), { depth: null }));
    done();
  }
}

/**
 * Factory for standalone task to process json.
 *
 * @returns The json task.
 */
function jsonTaskCompFactory () {
  const tasks = {};

  return gulp.series(
    function setup (done) {
      tasks.json = jsonTaskFactory(configCreate().settings);
      done();
    },
    function json (done) {
      return tasks.json(done);
    }
  );
}

/**
 * Factory for standalone css development task composition.
 *
 * @returns The development css task composition.
 */
function ccssTaskCompFactory () {
  const tasks = {};

  return gulp.series(
    function setup (done) {
      setupEnvironment(false);
      tasks.ccss = ccssTaskFactory(configCreate().settings, false);
      done();
    },
    function ccssTask (done) {
      return tasks.ccss(done);
    }
  );
}

/**
 * Factory for standalone bundle creation task composition.
 */
function bundleCompFactory (group, target) {
  const prod = target === 'prod' || target === 'perf';
  const tasks = {};

  return gulp.series(
    function setup (done) {
      setupEnvironment(prod);
      const settings = configCreate().settings;

      tasks.bundles = webpackTaskFactory(settings, group, target);
      if (group.includes('sw')) {
        tasks.generate = serviceWorkerTaskFactory(
          settings, prod, target !== 'prod'
        );
      }
      done();
    },
    function prepBundles (done) {
      if (tasks.generate) {
        return tasks.generate(done);
      }
      done();
    },
    function bundles (done) {
      return tasks.bundles(done);
    }
  );
}

// Public aliases for targeted task composition factories
const ccss = ccssTaskCompFactory;
const json = jsonTaskCompFactory;
const perfbudget = perfbudgetTaskFactory;
const dumpconfigDev = dumpConfigTaskFactory.bind(this, false);
const dumpconfigProd = dumpConfigTaskFactory.bind(this, true);
const dev = buildTaskCompFactory.bind(this, true, 'dev');
const debug = buildTaskCompFactory.bind(this, true, 'debug');
const perf = buildTaskCompFactory.bind(this, true, 'perf');
const prod = buildTaskCompFactory.bind(this, true, 'prod');
const build = buildTaskCompFactory.bind(this, false, 'prod');
const fixturesDev = fixturesTaskCompFactory.bind(this, false);
const fixturesProd = fixturesTaskCompFactory.bind(this, true);
const bundlesMain_dev = bundleCompFactory.bind(this, 'main', 'dev');
const bundlesMain_perf = bundleCompFactory.bind(this, 'main', 'perf');
const bundlesMain_prod = bundleCompFactory.bind(this, 'main', 'prod');
const bundlesSw_dev = bundleCompFactory.bind(this, 'sw', 'dev');
const bundlesSw_perf = bundleCompFactory.bind(this, 'sw', 'perf');
const bundlesSw_prod = bundleCompFactory.bind(this, 'sw', 'prod');

export default {
  build,
  bundlesMain_dev,
  bundlesMain_perf,
  bundlesMain_prod,
  bundlesSw_dev,
  bundlesSw_perf,
  bundlesSw_prod,
  ccss,
  debug,
  dev,
  dumpconfigDev,
  dumpconfigProd,
  perf,
  perfbudget,
  prod,
  fixturesDev,
  fixturesProd,
  json,
  'default': build
};

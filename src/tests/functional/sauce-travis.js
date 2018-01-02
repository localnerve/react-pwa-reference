/**
 * Copyright (c) 2016 - 2018 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Setup remote tests on SauceLabs from Travis.
 *
 * Parameters read from env:
 *  TEST_BASEURL - The base url for requests from SauceLabs. Must be accessible to SauceLabs.
 *  TEST_BROWSER - The key to browsers.js to find the SauceLabs platform/browser spec for this test.
 *  TRAVIS - Boolean to indicate running on Travis
 *  TRAVIS_BUILD_NUMBER - The SauceLabs required build number from Travis
 *  TRAVIS_BRANCH - The branch being tested on Travis
 *  TRAVIS_REPO_SLUG - The owner/repo slug on Travis
 *  SAUCE_USERNAME - The SauceLabs account username
 *  SAUCE_ACCESS_KEY - The SauceLabs access key
 *  VERBOSE - Boolean to indicate verbose test output
 */
/*eslint no-console:0 */
'use strict';

var wd = require('wd');
require('colors');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var browserSpecs = require('./browsers');

var testName = 'Basic test';
var baseUrl = process.env.TEST_BASEURL;
var timeout = 60000;
var state = {
  allPassed: true
};

chai.use(chaiAsPromised);
chai.should();
chaiAsPromised.transferPromiseness = wd.transferPromiseness;

wd.configureHttp({
  timeout: timeout,
  retryDelay: 15000,
  retries: 5
});

// Define the SauceLabs test
var browserKey = process.env.TEST_BROWSER;
var test = browserSpecs[browserKey];
test.name = testName + ' with ' + browserKey;
test.tags = [ process.env.TRAVIS_REPO_SLUG || 'localtest' ];
test.acceptSslCerts = true;
if (process.env.TRAVIS) {
  test.tags = test.tags.concat('travis', process.env.TRAVIS_BRANCH);
  test.build = process.env.TRAVIS_BUILD_NUMBER;
}

// Build caps report string for this test
var sauceCaps = {
  browserName: 1,
  platform: 1,
  version: 1,
  deviceName: 1,
  'device-orientation': 1
};
var caps = Object.keys(test).reduce(function(prev, curr) {
  if (sauceCaps[curr] && test[curr]) {
    prev = prev + (prev ? ', ' : '') + test[curr];
  }
  return prev;
}, '');

/**
 * The one-time setup to perform before all tests
 */
function beforeAll(done) {
  var username = process.env.SAUCE_USERNAME;
  var accessKey = process.env.SAUCE_ACCESS_KEY;
  state.browser = wd.promiseChainRemote('ondemand.saucelabs.com', 80, username, accessKey);
  if (process.env.VERBOSE) {
    // optional logging
    state.browser.on('status', function(info) {
      console.log(info.cyan);
    });
    state.browser.on('command', function(meth, path, data) {
      console.log(' > ' + meth.yellow, path.grey, data || '');
    });
  }
  state.browser
    .init(test)
    .nodeify(done);
}

/**
 * The one-time teardown to perform after all tests
 */
function afterAll(done) {
  state.browser
    .quit()
    .sauceJobStatus(state.allPassed)
    .nodeify(done);
}

function updateState(mocha) {
  state.allPassed = state.allPassed && (mocha.currentTest.state === 'passed');
}

module.exports = {
  name: testName,
  caps: caps,
  timeout: timeout,
  baseUrl: baseUrl,
  state: state,
  beforeAll: beforeAll,
  afterAll: afterAll,
  updateState: updateState
};

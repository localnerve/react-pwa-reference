/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * A simple mock for sw-toolbox.
 *
 * Intended for use via mockery (or equiv) as a configurable drop-in that loads
 * in-place of sw-toolbox so modules that use it can be tested in NodeJS unit
 * tests.
 *
 * Assumes NodeJS >= 4 (stable)
 *
 * After the mock substitution is setup, the test must also get a reference
 * to the mock (and prime the require cache) to call mockSetup. mockSetup must
 * be called at least once to create the sw-toolbox interface.
 * @see mockSetup
 *
 * Reuses sw-toolbox/lib/options, sw-toolbox/lib/router as-is.
 */
/* global Promise */
'use strict';

var urlLib = require('url');

var teardown = {
  self: false,
  url: false
};

var cleanOptions;
var mockCacheObject;
var mockCacheValue = 'dummy';

/**
 * A mock strategy to reject or resolve.
 *
 * @param {Object} response - A response to resolve to, must pre-bind.
 * @param {Any} request - ignored.
 * @param {Any} values - ignored.
 * @param {Object} options - The sw-toolbox options passed to strategy.
 * @param {Boolean} [options.emulateError] - Set to test reject path.
 */
function mockStrategy (response, request, values, options) {
  if (options.emulateError) {
    return Promise.reject(new Error('mock error'));
  }
  return Promise.resolve(response);
}

/**
 * Mock cache implementation.
 *
 * @param {String|Request} request - The item to cache.
 * @returns {Promise} Always resolves to undefined.
 */
function mockCache (request) {
  var urlString = typeof request === 'string' ? request : request.url;

  mockCacheObject[urlString] = mockCacheValue;

  return Promise.resolve();
}

/**
 * Mock uncache implementation.
 *
 * @param {String|Request} request - The item to delete from cache.
 * @returns {Promise} Resolves to true if the item was deleted, false otherwise.
 */
function mockUncache (request) {
  var urlString = typeof request === 'string' ? request : request.url;

  var hit = mockCacheObject[urlString] === mockCacheValue;

  if (hit) {
    delete mockCacheObject[urlString];
  }

  return Promise.resolve(hit);
}

/**
 * Simplified mock URL constructor for global mock purpose.
 *
 * @param {String} urlString - An absolute or relative url.
 * @param {String|Object} [base] - if urlString is relative, a string or url
 * object to resolve the urlString on.
 */
function MockURL (urlString, base) {
  var baseUrlString;

  if (!base || urlString.indexOf(':') !== -1) {
    baseUrlString = urlString;
    urlString = '';
  } else {
    baseUrlString = typeof base === 'string' ? base : base.href;
  }

  this.href = urlLib.resolve(baseUrlString, urlString);

  var urlObj = urlLib.parse(this.href, true, this.href.indexOf(':') === -1);

  this.pathname = urlObj.pathname;
  this.port = urlObj.port;
  this.protocol = urlObj.protocol || 'http:';
  this.hash = urlObj.hash;
  this.origin =
    this.protocol + (urlObj.slashes ? '//' : '') + urlObj.host;
}

/**
 * Setup global prerequisites for the re-used modules of sw-toolbox.
 *
 * @param {String} scope - The scope for sw-toolbox.
 */
function setupGlobals (scope) {
  // This is required to re-use sw-toolbox/lib/options
  global.self = global.self || (teardown.self = true, {});
  global.self.scope = scope || global.self.scope || 'http://localhost';

  // This is required to re-use sw-toolbox/lib/router
  global.URL = global.URL || (teardown.url = true, MockURL);
  global.self.location = global.self.location ||
    new global.URL('/', global.self.scope);
}

module.exports = {
  /**
   * Call to setup and configure the sw-toolbox mock interface.
   * MUST be called at least once to create the sw-toolbox mock interface.
   * Can be called repeatedly to change handler responses, scope, or options.
   *
   * @param {Object} [response] - The response any strategies will resolve to.
   * Actually can be any type/value of use to the test.
   * @param {String} [scope] - A scope to use for sw-toolbox purposes. defaults
   * to 'http://localhost'.
   * @param {Object} [options] - options to substitute in sw-toolbox options.
   */
  mockSetup: function mockSetup (response, scope, options) {
    setupGlobals(scope);

    // First time only, keep a clean copy of the global, mutable options.
    if (!cleanOptions) {
      cleanOptions = Object.assign({}, require('sw-toolbox/lib/options'));
    }

    // Reset the global toolbox options, mixin changes, expose the result
    var dirtyOptions = require('sw-toolbox/lib/options');
    options = Object.assign(
      Object.assign(dirtyOptions, cleanOptions), options || {}
    );

    // Clear the route map
    var router = require('sw-toolbox/lib/router');
    router.routes.clear();

    // Clear/create the mockCache
    mockCacheObject = Object.create(null);

    // Mock the sw-toolbox interface
    this.cacheFirst =
    this.cacheOnly =
    this.networkFirst =
    this.networkOnly =
    this.fastest =
      mockStrategy.bind(this, response);
    this.router = router;
    this.options = options;
    this.cache = mockCache;
    this.uncache = mockUncache;
    // Can't use orig b/c we can't load sw-toolbox main w/o mocking its deps.
    this.precache = function (items) {
      if (!Array.isArray(items)) {
        items = [items];
      }
      this.options.preCacheItems = this.options.preCacheItems.concat(items);
    };
  },

  /**
   * Cleanup globals created during setup (optional).
   */
  mockTeardown: function mockTeardown () {
    if (teardown.self) {
      teardown.self = false;
      delete global.self;
    }
    if (teardown.url) {
      teardown.url = false;
      delete global.URL;
    }
  },

  /**
   * Fetch driver. Must call mockSetup first.
   *
   * @param {String|Request} url - The url to use to drive a test.
   * @param {String} [method] - if url is a string, supply this method.
   * Defaults to 'any'.
   * @returns {Promise} resolves or rejects as configured. If no handler is
   * found, resolves to undefined.
   */
  mockFetch: function mockFetch (url, method) {
    if (!this.router) {
      throw new Error('Must call mockSetup before mockFetch');
    }

    var request = typeof url === 'string' ? {
      url: url,
      method: method || 'any'
    } : url;

    var response, handler = this.router.match(request);

    if (handler) {
      response = handler(request);
    } else if (this.router.default && request.method === 'GET') {
      response = this.router.default(request);
    }

    return response || Promise.resolve();
  }
};

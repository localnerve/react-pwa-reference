/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * A simple mock for service worker CacheStorage API.
 */
/* global Promise */
'use strict';

var Response = require('./response');

function Cache (options) {
  this.options = options || {};
  this.storage = Object.create(null);
}
Cache.prototype = {
  match: function match (req) {
    var res;

    var urlString = typeof req === 'string' ? req : req.url;
    res = this.storage[urlString];

    if (!res && this.options.default) {
      res = new Response({
        test: 'hello'
      }, {
        status: 200
      });
    }

    return Promise.resolve(res);
  },
  put: function put (req, res) {
    var urlString = typeof req === 'string' ? req : req.url;
    this.storage[urlString] = res;
    return Promise.resolve();
  }
};

/**
 * A limited, simple mock of CacheStorage.
 *
 * @param {Object} [options] - behavioral options
 * If not supplied a default behavior is supplied.
 * @param {Boolean} [options.openFail] - open should fail.
 * @param {Object} [options.cacheNames] - A map of supported named caches.
 * If not supplied, a new one is created.
 * @param {Boolean} [options.cache.default] - if true, then return a default
 * successful response. If not supplied, cache returns undefined (not found).
 */
function CacheStorage (options) {
  this.options = options || {};
}
CacheStorage.prototype = {
  open: function open (cacheName) {
    var cache, cacheNames = this.options.cacheNames;

    if (cacheNames) {
      cache = cacheNames[cacheName];
    } else {
      cache = new Cache(this.options.cache);
    }

    return this.options.openFail ? Promise.reject(new Error('mock error')) :
      Promise.resolve(cache);
  }
};

module.exports = {
  create: function createCacheStorage (options) {
    return new CacheStorage(options);
  },
  Cache: Cache
};

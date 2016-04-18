/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Environment specific configuration for push notification service.
 *
 * Environment variables:
 *   PUSH_API_KEY - An api key for messaging service.
 */
'use strict';

/**
 * Get a PUSH_API_KEY configuration value. Use to authenticate as a sender to
 * a cloud messaging service. Defaults to GCM_API_URL.
 *
 * @returns {String} The PUSH_API_KEY configuration value.
 */
function PUSH_API_KEY () {
  return process.env.PUSH_API_KEY || process.env.GCM_API_KEY || undefined;
}

/**
 * Make the images configuration object.
 *
 * @returns the images configuration object.
 */
function makeConfig () {
  return {
    service: {
      apiKey: PUSH_API_KEY
    }
  };
}

module.exports = makeConfig;

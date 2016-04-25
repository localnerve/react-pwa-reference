/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Environment specific configuration for images.
 *
 * Environment variables:
 *   IMAGE_SERVICE_URL - A string that denotes an image service, default lorempixel.
 *   CLOUD_NAME - A string that denotes a cloud name for use in an image service.
 */
'use strict';

/**
 * Get the IMAGE_SERVICE_URL configuration value.
 * Defaults to lorempixel if IMAGE_SERVICE_URL is not defined.
 * Lorempixel does not maintain an SSL certificate properly.
 * image service must be SSL for use with this app (except development).
 * Note: To use Cloudinary, set IMAGE_SERVICE_URL to 'https://res.cloudinary.com'
 *  AND set CLOUD_NAME appropriately.
 *
 * @returns {String} The IMAGE_SERVICE_URL configuration value.
 */
function IMAGE_SERVICE_URL () {
  return process.env.IMAGE_SERVICE_URL || 'http://lorempixel.com';
}

/**
 * Get the CLOUD_NAME configuration value.
 * This is used in Cloudinary to identify the account.
 *
 * @returns {String} The CLOUD_NAME configuration value.
 */
function CLOUD_NAME () {
  return process.env.CLOUD_NAME;
}

/**
 * Make the images configuration object.
 *
 * @returns the images configuration object.
 */
function makeConfig () {
  return {
    service: {
      url: IMAGE_SERVICE_URL,
      cloudName: CLOUD_NAME
    }
  };
}

module.exports = makeConfig;

/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import urlm from './urls';

/**
 * Build a random int in any interval.
 *
 * @param {Number} min - The minimum number in the interval.
 * @param {Number} max - The maximum number in the interval.
 * @returns {Number} A random number in the specified interval.
 */
function randomIntFromInterval (min, max) {
  return Math.floor(Math.random() * (max-min+1) + min);
}

/**
 * Build a lorempixel request.
 *
 * For lorempixel, the `name` has to be an ordinal between 1 and 9, zero
 * gives you a random image so we avoid that one.
 * So name is resolved:
 * 1. Try to directly use as int, can't be 0
 * 2. Try to use the name before the last dot as int, can't be 0
 * 3. Use random number between 1 and 9
 *
 * @param {Object} options - The options used to build the service request.
 * @param {Number} options.width - The width of the image.
 * @param {Number} options.height - The height of the image.
 * @param {String} options.name - The name of the image to retrieve.
 * @param {Object} options.serviceOptions - lorempixel specific options.
 * @param {String} [options.serviceOptions.theme] - The image theme, defaults to 'nature'.
 * @returns {String} The lorempixel request.
 */
function buildLoremPixelRequest (options) {
  const theme = options.serviceOptions.theme || 'nature';
  let ordinal =
    parseInt(options.name, 10) ||
    parseInt(urlm.getLastPathSegment(options.name).replace(/\..*$/, ''), 10) ||
    randomIntFromInterval(1, 9);

  ordinal = ordinal % 10;

  // slash at the end avoids a 302 for lorempixel
  return options.width + '/' + options.height + '/' + theme + '/' + ordinal + '/';
}

/**
 * Build a firesize request.
 *
 * Only basic options supported, defaults to g_center gravity.
 * If options.location is not supplied, defaults to a lorempixel request.
 *
 * @param {Object} options - The options used to build the service request.
 * @param {String} options.width - The width of the image.
 * @param {String} options.height - The height of the image.
 * @param {String} options.name - The name of the image to retrieve.
 * @param {Object} options.serviceOptions - The Firesize specific options.
 * @param {String} [options.serviceOptions.gravity] - The firesize gravity.
 * @param {Object} [options.serviceOptions.origin] - The firesize image origin.
 * If omitted, uses lorempixel for the image origin.
 * @param {String} [options.serviceOptions.origin.host] - The image asset host.
 * @param {Boolean} [options.serviceOptions.origin.ssl] - True if asset host requires ssl.
 * @param {String} [options.serviceOptions.origin.path] - Path to images on the asset host.
 * @returns {String} A firesize request.
 */
/*
 * Service defunct, but this code contains some useful ideas.
 *
function buildFireSizeRequest (options) {
  var gravity = options.serviceOptions.gravity || 'g_center';
  var origin = options.serviceOptions.origin || {
    host: 'lorempixel.com',
    ssl: false,
    path: buildLoremPixelRequest(options)
  };

  if (options.serviceOptions.origin) {
    // remove beginning and/or trailing slash
    origin.path = origin.path.replace(/^\/|\/$/g, '');
  }

  return (
    options.width + 'x' + options.height + '/' + gravity + '/' +
    (origin.ssl ? 'https://' : 'http://') +
    origin.host + '/' + origin.path +
    (options.serviceOptions.origin ? '/' + options.name : '')
  );
}
*/

/**
 * Build a cloudinary request.
 *
 * Only supports dimensions and basic crop modes that don't require gravity.
 * defaults to c_fill crop mode.
 *
 * @param {Object} options - The options used to build the service request.
 * @param {Number} options.width - The width of the image.
 * @param {Number} options.height - The height of the image.
 * @param {String} options.name - The name of the image to retrieve.
 *  Must include format extension.
 * @param {String} options.serviceOptions - The cloudinary specific options.
 * @param {String} options.serviceOptions.cloudName - The cloudinary cloud name.
 * @param {String} [options.serviceOptions.cropMode] - The cloudinary crop mode.
 * @returns {String} A cloudinary request.
 */
function buildCloudinaryRequest (options) {
  const cropMode = options.serviceOptions.cropMode || 'c_fill';

  return options.serviceOptions.cloudName + '/image/upload/w_' +
    options.width + ',h_' + options.height + ',' + cropMode + '/' + options.name;
}

/***
 * A hash of the request builders for each supported image service.
 */
const supportedServices = {
  lorempixel: buildLoremPixelRequest,
  // firesize: buildFireSizeRequest,
  cloudinary: buildCloudinaryRequest
};

/**
 * Build an image service url.
 * For now, just supports lorempixel, limited firesize and cloudinary.
 *
 * @param {String} serviceUrl - The protocol and hostname (in url form) of the service.
 * @param {Object} options - The options for the service to build an image service url.
 * For now, just cloudinary, firesize, and lorempixel basic options supported.
 * @throws If an unsupported image serviceUrl is supplied.
 * @returns {String} An image service url that can be used to retrieve the image.
 */
export function buildImageUrl (serviceUrl, options) {
  // remove any trailing slash
  serviceUrl = serviceUrl.replace(/\/$/, '');

  const serviceName = urlm.getSignificantHostname(serviceUrl);

  const requestBuilder = supportedServices[serviceName];

  if (!requestBuilder) {
    throw new Error('Unrecognized service supplied');
  }

  return serviceUrl + '/' + requestBuilder(options);
}

export default {
  buildImageUrl
};

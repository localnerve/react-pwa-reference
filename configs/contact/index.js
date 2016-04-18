/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Environment specific configuration for mail.
 *
 * Environment variables can override the following:
 *   MAIL_SERVICE - A string that denotes a mail service known to nodemailer, default Mandrill
 *   MAIL_USERNAME - The authenticated service user of the mail service, default MANDRILL_USERNAME from env
 *   MAIL_PASSWORD - The authenticated service pass for the mail service, default MANDRILL_APIKEY from env
 *   MAIL_TO - The mailto of all mail messages from this app, defaults to NODE_ENV chosen headers
 *   MAIL_FROM - The mailfrom of all mail messages from this app, defaults to NODE_ENV chosen headers
 *   QUEUE_NAME - The name of the outgoing mail queue, defaults to 'outgoing-mail'
 *   QUEUE_URL - The url of the queue service, defaults to NODE_ENV chosen url
 */
'use strict';

/***
 * Environment specific mail header default values.
 */
var mailHeaders = {
  development: {
    mailTo: 'fred-sw-dev@localnerve.com',
    mailFrom: 'flux-react-example-sw-dev@localnerve.com'
  },
  production: {
    mailTo: 'fred-sw-prod@localnerve.com',
    mailFrom: 'flux-react-example-sw-prod@localnerve.com'
  }
};

/***
 * Environment specific mail queue url default values.
 */
var mailQueue = {
  development: 'amqp://localhost',
  production: process.env.CLOUDAMQP_URL
};

/**
 * Get the MAIL_SERVICE configuration value.
 * Defaults to 'Mandrill'.
 * @returns {String} The MAIL_SERVICE configuration value.
 */
function MAIL_SERVICE () {
  return process.env.MAIL_SERVICE || 'Mandrill';
}

/**
 * Get the MAIL_USERNAME configuration value.
 * Defaults to MANDRILL_USERNAME from process.env
 * @returns {String} The MAIL_USERNAME configuration value.
 */
function MAIL_USERNAME () {
  return process.env.MAIL_USERNAME || process.env.MANDRILL_USERNAME;
}

/**
 * Get the MAIL_PASSWORD configuration value.
 * Defaults to MANDRILL_APIKEY from process.env
 * @returns {String} The MAIL_PASSWORD configuration value.
 */
function MAIL_PASSWORD () {
  return process.env.MAIL_PASSWORD || process.env.MANDRILL_APIKEY;
}

/**
 * Get the MAIL_TO configuration value.
 * Defaults to environment specific mail header defaults.
 * @returns {String} The MAIL_TO configuration value.
 */
function mailTo (env) {
  return process.env.MAIL_TO || mailHeaders[env].mailTo;
}

/**
 * Get the MAIL_FROM configuration value.
 * Defaults to environment specific mail header defaults.
 * @returns {String} The MAIL_FROM configuration value.
 */
function mailFrom (env) {
  return process.env.MAIL_FROM || mailHeaders[env].mailFrom;
}

/**
 * Get the QUEUE_NAME configuration value.
 * Defaults to 'outgoing-mail'.
 * @returns {String} The QUEUE_NAME configuration value.
 */
function QUEUE_NAME () {
  return process.env.QUEUE_NAME || 'outgoing-mail';
}

/**
 * Get the QUEUE_URL configuration value.
 * Defaults to environment specific mail queue url defaults.
 * @returns {String} The QUEUE_URL configuration value.
 */
function QUEUE_URL (env) {
  return process.env.QUEUE_URL || mailQueue[env];
}

/**
 * Make the contact configuration object.
 *
 * @param {Object} nconf - The nconfig object.
 * @returns {Object} The contact configuration object.
 */
function makeConfig(nconf) {
  var env = nconf.get('NODE_ENV');

  return {
    mail: {
      service: MAIL_SERVICE,
      username: MAIL_USERNAME,
      password: MAIL_PASSWORD,
      subject: 'Flux-React-Example Contact Form Submission',

      /**
       * @see mailTo
       */
      to: function () {
        return mailTo(env);
      },

      /**
       * @see mailFrom
       */
      from: function () {
        return mailFrom(env);
      }
    },
    queue: {
      name: QUEUE_NAME,

      /**
       * @see QUEUE_URL
       */
      url: function () {
        return QUEUE_URL(env);
      }
    }
  };
}

module.exports = makeConfig;

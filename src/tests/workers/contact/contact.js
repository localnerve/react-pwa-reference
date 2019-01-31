#!/usr/bin/env node
/**
 * Copyright (c) 2016 - 2019 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Manual test harness for mail and queue service exercise.
 *
 * PREREQUISITES:
 *  Must have environment setup for mail and queue settings, auth.
 *  Must have the services implied by those settings setup and operational.
 *   (Must have AMQP queue running and pointed to by contact.queue.url, etc.)
 *
 * Plunks a message onto the queue then starts the worker to consume it.
 * Kills the worker after some constant time elapsed.
 *
 * Must manually verify mail and queue status is as expected.
 */
/*eslint-disable no-console */
/* global console, require, process */
const spawn = require('child_process').spawn;

require('@babel/register')({
  presets: [
    '@babel/env'
  ],
  ignore: []
});

const mail = require('application/server/services/mail');
const contact = require('configs').create().contact;

const workerProcess = 'application/server/workers/contact/bin/contact';
const workTime = 10000;

const prereqs = contact.mail.username() && contact.mail.password() &&
  contact.mail.service();

if (!prereqs) {
  console.error(
    'mail service environmental prerequisites missing. Check environment.'
  );
  console.error('mail config');
  console.error(`service  = ${contact.mail.service()}`);
  console.error(`to       = ${contact.mail.to()}`);
  console.error(`from     = ${contact.mail.from()}`);
  console.error(`username = ${contact.mail.username()}`);
  console.error(`password = ${contact.mail.password()}`);
  process.exit();
}

mail.send({
  name: 'Manual Test',
  email: 'manual@test.local',
  message: 'This is a test message from the manual test harness.'
}, function (err) {
  if (err) {
    throw err;
  }

  const cp = spawn(require.resolve(workerProcess));

  cp.on('close', function () {
    console.log(`${workerProcess} complete`);
    process.exit();
  });

  setTimeout(function () {
    cp.kill('SIGINT');
  }, workTime);
});

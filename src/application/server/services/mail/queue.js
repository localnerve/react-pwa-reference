/***
 * Copyright (c) 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/*eslint no-console:0 */
import debugLib from 'debug';
import amqp from 'amqplib';
import configs from 'configs';
import mailer from './mailer';

const debug = debugLib('services:mail:queue');

const contact = configs.create().contact;

/**
 * Add a mail payload to the outgoing mail queue.
 *
 * @param {Object} input - The contact mail payload.
 * @param {Function} callback - The callback to execute on completion.
 */
export function sendMail (input, callback) {
  const open = amqp.connect(contact.queue.url());

  open.then((conn) => {
    debug('AMQP connection open');

    return conn.createChannel().then((ch) => {
      debug('AMQP channel created');

      const q = contact.queue.name();

      return ch.assertQueue(q).then(() => {
        ch.sendToQueue(q, new Buffer(JSON.stringify(input)));
        debug('AMQP message sent', input);
      });
    });
  })
  .then(callback, (err) => {
    debug('AMQP message failure', err);
    callback(err);
  });
}

/**
 * This is the main proc of the contact worker process.
 * This blocks consuming the outgoing mail queue and sends mail
 * when a message is received. SIGINT will disrupt the process.
 * If the send fails, nacks it back onto the queue.
 */
export function contactWorker () {
  amqp.connect(contact.queue.url()).then((conn) => {
    process.once('SIGINT', () => {
      conn.close();
    });

    return conn.createChannel().then((ch) => {
      const q = contact.queue.name();

      return ch.assertQueue(q).then(() => {
        ch.consume(q, (msg) => {
          if (msg !== null) {
            mailer.send(JSON.parse(msg.content.toString()), (err) => {
              if (err) {
                debug('mailer failed to send ', msg);
                return ch.nack(msg);
              }
              debug('mailer successfully sent ', msg);
              ch.ack(msg);
            });
          }
        });
      });
    });
  }).then(null, console.warn);
}

export default {
  sendMail,
  contactWorker
};

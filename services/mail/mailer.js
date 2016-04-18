/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * TODO: add sanitizer
 */
import mailer from 'nodemailer';
import configs from '../../configs';

const contact = configs.create().contact;

/**
 * Send mail to a well-known mail service.
 * Uses configs/contact configuration object for mail settings.
 *
 * @param {Object} payload - The mail payload
 * @param {String} payload.name - The replyTo name
 * @param {String} payload.email - The replyTo email address
 * @param {String} payload.message - The mail message body
 * @param {Function} done - The callback to execute on completion.
 */
export function send (payload, done) {
  const transport = mailer.createTransport({
    service: contact.mail.service(),
    auth: {
      user: contact.mail.username(),
      pass: contact.mail.password()
    }
  });

  transport.sendMail({
    from: contact.mail.from(),
    to: contact.mail.to(),
    replyTo: payload.name + ' <' + payload.email + '>',
    subject: contact.mail.subject,
    text: payload.message
  }, done);
}

export default {
  send
};

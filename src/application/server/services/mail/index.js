/***
 * Copyright (c) 2016 - 2020 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import queue from './queue';

export const send = queue.sendMail;
export const worker = queue.contactWorker;

export default {
  send,
  worker
};

/***
 * Copyright (c) 2016 - 2019 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
/* global Promise */
import debugLib from 'debug';
import remark from 'remark';
import remarkHtml from 'remark-html';

const debug = debugLib('services:data:markdown');

/**
 * Parse markdown to markup.
 *
 * @param {String} input - The markdown to parse.
 * @returns {Promise} Resolves to the markup, or rejects.
 */
export function markdown (input) {
  debug('parsing markdown');

  return new Promise((resolve, reject) => {
    remark()
      .use(remarkHtml)
      .process(input, (err, res) => {
        if (err) {
          debug('remark markdown conversion failed', err);
          return reject(err);
        }
        resolve(String(res));
      });
  });
}

export default markdown;

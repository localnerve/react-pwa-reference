/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 */
import debugLib from 'debug';
import Remarkable from 'remarkable';

const debug = debugLib('services:data:markdown');
const remarkable = new Remarkable('full', {
  html: true,
  linkify: true
});

/**
 * Parse markdown to markup.
 *
 * @param {String} input - The markdown to parse.
 * @returns {String} The markup.
 */
export function markdown (input) {
  debug('parsing markdown');

  return remarkable.render(input);
}

export default markdown;

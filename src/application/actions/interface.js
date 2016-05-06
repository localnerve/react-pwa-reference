/**
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * The actions that are eligible to be referenced from the backend data service.
 *
 * This interface can be (and is) augmented dynamically as the backend defines
 * lazy loaded actions (and components, etc) it is interested in using.
 * @see utils/splits.js
 * @see actions/modal.js
 */
import { page } from './page';

const actions = Object.create(null);
actions.page = page;

/**
 * Get all actions available for backend reference.
 *
 * @returns {Object} Action creators available for backend reference.
 */
export function getActions () {
  return actions;
}

/**
 * Add an action to make it available to backend reference.
 *
 * @param {Function} action - The action creator to add.
 */
export function addAction (action) {
  actions[action.name] = action;
}

export default {
  getActions,
  addAction
}

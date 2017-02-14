/***
 * Copyright (c) 2016, 2017 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Install push message handler.
 */
/* global self, fetch, clients */
import pushUtil from 'utils/push';
import debugLib from 'sw/utils/debug';
import { addOrReplaceUrlSearchParameter } from 'sw/utils/requests';
import { synchronize as pushSync } from './sync/push';
import swData from 'sw/data';

const debug = debugLib('push');
const pushUrl = '/_api/push';

/**
 * Retrieve the push data payload from the pushUrl endpoint, and show the
 * notification.
 *
 * @param {Number} timestamp - epoch time of the message event.
 * @returns {Promise} Allows event to complete when fulfilled.
 */
function getPayloadAndShowNotification (timestamp) {
  return self.registration.pushManager.getSubscription()
    .then((subscription) => {
      let payloadUrl = addOrReplaceUrlSearchParameter(
        pushUrl, 'subscriptionId', pushUtil.getSubscriptionId(subscription)
      );
      payloadUrl = addOrReplaceUrlSearchParameter(
        payloadUrl, 'timestamp', timestamp
      );

      return fetch(payloadUrl).then((response) => {
        debug('Received push payload response', response);

        if (response.status !== 200) {
          throw new Error(
            `Push payload response error, status ${response.status}`
          );
        }

        return response.json().then((data) => {
          debug('Received push payload data', data);

          const title = data.title;
          const options = {
            body: data.message,
            icon: data.icon,
            tag: data.tag,
            data: {
              url: data.url
            }
          };

          return self.registration.showNotification(title, options);
        });
      }).catch((error) => {
        debug('Failed to get push payload', error);

        return self.registration.showNotification('An error occurred', {
          body: `Failed to get push payload from ${payloadUrl}`,
          icon: swData.manifest && swData.manifest.pushNotificationIcon || null,
          tag: 'notification-error'
        });
      });
    });
}

/**
 * Handle push messages.
 * Retrieves the message payload and shows the notification.
 */
self.addEventListener('push', (event) => {
  debug('Received a push message', event);

  event.waitUntil(
    getPayloadAndShowNotification(event.timeStamp || Date.now())
  );
});

/**
 * Handle push message notification clicks.
 */
self.addEventListener('notificationclick', (event) => {
  debug('Received a notification click', event);

  const url = event.notification.data.url;

  event.notification.close();

  event.waitUntil(
    clients.matchAll({
      type: 'window'
    }).then((windowClients) => {
      if (windowClients.length > 0) {
        windowClients[0].postMessage({
          command: 'navigate',
          url: url
        });
        return windowClients[0].focus();
      } else {
        return clients.openWindow(url);
      }
    })
  );
});

/**
 * Handle push subscription change event.
 */
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.getSubscription()
      .then((subscription) => {
        const subscriptionId = pushUtil.getSubscriptionId(subscription);
        if (subscriptionId) {
          return pushSync(subscriptionId);
        }
        throw new Error('could not getSubscriptionId');
      })
      .catch((error) => {
        // catch here and just log for now
        debug('pushsubscriptionchange failed: ', error);
      })
  );
});

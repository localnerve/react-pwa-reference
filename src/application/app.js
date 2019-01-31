/***
 * Copyright (c) 2016 - 2019 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Assemble the Fluxible app.
 */
import debugLib from 'debug';
import FluxibleApp from 'fluxible';
import fetchrPlugin from 'fluxible-plugin-fetchr';
import Application from './components/Application';
import BackgroundStore from './stores/BackgroundStore';
import ContentStore from './stores/ContentStore';
import ContactStore from './stores/ContactStore';
import RouteStore from './stores/RouteStore';
import ModalStore from './stores/ModalStore';

const debug = debugLib('app');

debug('Creating FluxibleApp');
const app = new FluxibleApp({
  component: Application
});

debug('Adding Plugins');
app.plug(fetchrPlugin({ xhrPath: '/_api' }));

debug('Registering Stores');
app.registerStore(BackgroundStore);
app.registerStore(ContentStore);
app.registerStore(ContactStore);
app.registerStore(RouteStore);
app.registerStore(ModalStore);

export default app;

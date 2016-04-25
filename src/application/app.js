/***
 * Copyright (c) 2015, 2016 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the BSD License. See the accompanying LICENSE file for terms.
 *
 * Assemble the Fluxible app.
 */
import debugLib from 'debug';
import FluxibleApp from 'fluxible';
import fetchrPlugin from 'fluxible-plugin-fetchr';
import appComponent from './components/Application';
import ApplicationStore from './stores/ApplicationStore';
import BackgroundStore from './stores/BackgroundStore';
import ContentStore from './stores/ContentStore';
import RouteStore from './stores/RouteStore';

const debug = debugLib('app');

debug('Creating FluxibleApp');
const app = new FluxibleApp({
  component: appComponent
});

debug('Adding Plugins');
app.plug(fetchrPlugin({ xhrPath: '/_api' }));

debug('Registering Stores');
app.registerStore(ApplicationStore);
app.registerStore(BackgroundStore);
app.registerStore(ContentStore);
app.registerStore(RouteStore);

export default app;

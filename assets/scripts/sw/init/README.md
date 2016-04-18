# Init Command Module

## About
The 'init' command sets up fetch handlers and caching for dynamic data, or paths to resources defined on the backend that can change.

The dynamic data is sent down from the app server each time the main app is rendered
(The data is composed during the server-side render). This data is referred to in Flux/React parlance
as 'Application Flux Stores', or simply 'app state'. The data is sent down from the server (via window.App) and kept in Flux Stores and also maintained in IndexedDB for the service worker.

## Execution
The 'init' command can be executed two ways:

1. At service worker startup

  This must happen since the lifetime of a service worker is unknown.
  Since the service worker can shutdown at any time, the process must be initialized each time it is started back up
  (to setup fetch handling and caching of dynamic items). In this case, the previously stored data (last updated when the application was online)
  is used to initialize the service worker.

2. At DOMContentReady AND ServiceWorkerReady

  When these two conditions happen, it means that potentially new dynamic data was sent from the server and is ready to be used.

  Therefore, an 'init' command message is sent to the service worker on these conditions, and that triggers the execution of the 'init' command.

  The 'init' command evaluates if the data sent was retrieved from the server at a later date than what was previously stored. If the data sent is newer, then the 'init' command updates the data.

The 'init' command can be executed multiple times in the service worker lifetime, so it must be idempotent, and only update the fetch handlers and data to reflect the latest app state.

## Flow
When the init command is executed, the following things happen:
  + Synchronization
    + Deferred API requests are synchronized


  + Update and Setup
    + The application state is updated
    + sw-toolbox fetch handlers are installed

### Synchronization
Any POST requests that were previously deferred because of a network failure are synchronized with the application API.

### Update and Setup
While requests are being synchronized, the application state is updated and sw-toolbox fetch handlers are installed as previously mentioned.

#### Update
If the application state is new, or newer than what has already been stored, update the stored app state in IndexedDB with the new app state.

It will only be actually new (different) if there was indeed a backend app data change and the command is being run as the result of an 'init' message. Any newer data can be potentially different/updated.

Data 'new-ness' is determined by a timestamp set by the server when the state is composed during render.
  - See [update](/assets/scripts/sw/init/update.js) for more information.

#### Setup
  If the app state is new, or the service worker process is starting the following setup is performed:
  + Install API fetch handlers for every api endpoint defined in the init payload. Uses Yahoo Fetchr conventions. Sets up content synthesis fallback for GETs and request deferral fallback for POSTs.

    + See [apiRequests](/assets/scripts/sw/init/apiRequests.js) for more information.


  + Install a background image fetch handler for on the specified image service \(example uses Cloudinary\).
    + The fetch handler is precaching/prefetching. When the app requests a background image, not only it is fetched and cached, but ALSO all other application background image service requests are also fetched and cached at that time (if they are not already in the cache). This happens any time the app is resized and newly sized backgrounds are needed. Happens in the background and fails silently.

    + See [backgrounds](/assets/scripts/sw/init/backgrounds.js) for more information.


  + Install fetch handlers for the main navigation routes of the application. These routes are fetched and cached so that the server does not re-render the application (In other words, the app behaves like a client-side SPA at that point). After the app is rendered to the client, server-side rendering work is no longer required. More Features:
    + The route fetch handlers allow the application to be started at any of the main application routes while the app is offline.
    + A 20 minute TTL is placed on cached routes so they aren't overly fetched and cached.
    + When application routes are fetched, they are first served from cache AND also fetched from the network in the background. If the app route response is significantly different from what was served from cache, the cache is updated and a message is sent to tell the user that newer content is available upon refresh.

    + See [routes](/assets/scripts/sw/init/routes.js) for more information.

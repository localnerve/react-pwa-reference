# Client Styles Explanation

All styles here are complied and produce public styles resources. Styles breakdown into two groups:

* Inline styles

* Other styles

## Inline Styles
The [inline styles](https://github.com/localnerve/react-pwa-reference/blob/master/src/application/client/styles/inline.scss) are the absolutely required styles to produce a visually complete initial render.
They are compiled by and injected into the main [Html](https://github.com/localnerve/react-pwa-reference/blob/master/src/application/components/Html.jsx) response, and contribute to the initial (14k limit) response, so they must be kept small and limited to just what is required.

The build produces inline.css and it is read into the response on initial render.

See:
1. [Inline scss source](https://github.com/localnerve/react-pwa-reference/blob/master/src/application/client/styles/inline.scss)

2. [Main Style Build](https://github.com/localnerve/react-pwa-reference/blob/master/src/build/ccss.js)

3. [Server-side Main Render](https://github.com/localnerve/react-pwa-reference/blob/master/src/application/server/main.js) - Search for the inlineStyles prop

4. [Html Component](https://github.com/localnerve/react-pwa-reference/blob/master/src/application/components/Html.jsx) - Search for the inlineStyles prop.

## Other Styles
"Other styles" are any other styles in src/application/client/styles that produce build output in the dist/ directory. These are supportive styles that are required by the application, but not needed on initial render. These files will get loaded and rendered in non-render-blocking fashion, thanks to an [inline script](https://github.com/localnerve/react-pwa-reference/blob/master/src/application/client/inline.js) that uses fg-loadcss.
  * **UPDATE (07/2019)** Note Filament Group usage update with [simpler async load ideas](https://www.filamentgroup.com/lab/load-css-simpler)

See:
1. The otherStyles collection, [config.settings.outputFiles.css.other](https://github.com/localnerve/react-pwa-reference/blob/master/src/node_modules/configs/settings/index.js), is the source of the otherStyles prop in initial render. This feeds fg-loadcss.

2. [Server-side Main Render](https://github.com/localnerve/react-pwa-reference/blob/master/src/application/server/main.js) - Search for the otherStyles prop.

3. [Html Component](https://github.com/localnerve/react-pwa-reference/blob/master/src/application/components/Html.jsx) - Search for the otherStyles prop.

### Notes
otherStyles are also being used to deliver and parse component styles (e.g. settings.scss). This is being done here, rather than from the component bundle itself, to prevent any FOUC that might result from injecting styles just in time.

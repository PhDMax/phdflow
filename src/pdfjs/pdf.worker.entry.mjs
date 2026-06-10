// Worker entry point: install polyfills before pdf.js worker code runs.
import './uint8array-polyfill.mjs'
import './pdf.worker.min.mjs'

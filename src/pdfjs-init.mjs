// Load PDF.js and expose as window.pdfjsLib for use by non-module scripts
import * as pdfjsLib from './pdfjs/pdf.min.mjs'
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('./pdfjs/pdf.worker.min.mjs', import.meta.url).href
window.pdfjsLib = pdfjsLib

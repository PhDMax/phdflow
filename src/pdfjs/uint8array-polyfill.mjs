// Polyfill for the Uint8Array base64/hex methods (TC39 proposal) used by
// pdf.js 6.x. These ship natively in newer Chromium but are missing from
// the Chromium bundled with current Electron, causing errors like
// "a.toHex is not a function" when loading a PDF.
const HEX = '0123456789abcdef'

if (typeof Uint8Array.prototype.toHex !== 'function') {
  Uint8Array.prototype.toHex = function () {
    let out = ''
    for (let i = 0; i < this.length; i++) out += HEX[this[i] >> 4] + HEX[this[i] & 0xf]
    return out
  }
}

if (typeof Uint8Array.fromHex !== 'function') {
  Uint8Array.fromHex = function (hex) {
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
    return bytes
  }
}

if (typeof Uint8Array.prototype.toBase64 !== 'function') {
  Uint8Array.prototype.toBase64 = function () {
    let binary = ''
    for (let i = 0; i < this.length; i++) binary += String.fromCharCode(this[i])
    return btoa(binary)
  }
}

if (typeof Uint8Array.fromBase64 !== 'function') {
  Uint8Array.fromBase64 = function (base64) {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  }
}

// Polyfill Math.sumPrecise (TC39 proposal), used by pdf.js 6.x for glyph
// width sums, font table sizing and encryption key derivation.
if (typeof Math.sumPrecise !== 'function') {
  Math.sumPrecise = function (arr) {
    let sum = 0
    for (let i = 0; i < arr.length; i++) sum += arr[i]
    return sum
  }
}

// Polyfill Map/WeakMap.prototype.getOrInsertComputed (TC39 upsert proposal),
// also used by pdf.js 6.x but not yet shipped in this Electron's Chromium.
for (const C of [Map, WeakMap]) {
  if (typeof C.prototype.getOrInsertComputed !== 'function') {
    C.prototype.getOrInsertComputed = function (key, callback) {
      if (this.has(key)) return this.get(key)
      const value = callback(key)
      this.set(key, value)
      return value
    }
  }
  if (typeof C.prototype.getOrInsert !== 'function') {
    C.prototype.getOrInsert = function (key, value) {
      if (this.has(key)) return this.get(key)
      this.set(key, value)
      return value
    }
  }
}

/**
 * Generates PWA icons as PNGs with zero dependencies (Node's zlib only).
 * Draws the Tandem mark: warm paper, two overlapping "leaning together" rounded
 * forms in the brand orange + teal — abstract "tandem / doing it together."
 * Run with `npm run gen:icons`.
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ICONS = join(__dirname, '..', 'public', 'icons')
const PUBLIC = join(__dirname, '..', 'public')
mkdirSync(ICONS, { recursive: true })

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]
const PAPER = hex('#FBF6EE')
const ORANGE = hex('#E8743B')
const TEAL = hex('#6FA8A0')
const AMBER = hex('#FCE3A8')

function draw(size, pad) {
  const buf = Buffer.alloc(size * size * 4)
  const set = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    const ia = a / 255
    buf[i] = buf[i] * (1 - ia) + r * ia
    buf[i + 1] = buf[i + 1] * (1 - ia) + g * ia
    buf[i + 2] = buf[i + 2] * (1 - ia) + b * ia
    buf[i + 3] = 255
  }
  // paper background
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) set(x, y, PAPER)

  const cx = size / 2
  const inner = size - pad * 2
  const r = inner * 0.27
  const off = inner * 0.16
  // soft amber halo
  disc(set, cx, size * 0.46, r * 1.7, AMBER, 0.45)
  // two leaning discs (the "tandem")
  disc(set, cx - off, size * 0.52, r, TEAL)
  disc(set, cx + off, size * 0.46, r, ORANGE)
  return buf
}

function disc(set, cx, cy, r, color, alpha = 1) {
  const x0 = Math.floor(cx - r),
    x1 = Math.ceil(cx + r),
    y0 = Math.floor(cy - r),
    y1 = Math.ceil(cy + r)
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x - cx, y - cy)
      if (d <= r) {
        const edge = Math.min(1, r - d) // 1px antialias
        set(x, y, color, 255 * alpha * edge)
      }
    }
}

// minimal PNG encoder (truecolor+alpha, filter 0)
function png(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])) >>> 0, 0)
  return Buffer.concat([len, t, data, crc])
}

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()
function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return ~c
}

const targets = [
  ['icons/icon-192.png', 192, 24],
  ['icons/icon-512.png', 512, 64],
  ['icons/icon-512-maskable.png', 512, 110], // extra padding for safe zone
  ['apple-touch-icon.png', 180, 22],
]
for (const [name, size, pad] of targets) {
  writeFileSync(join(PUBLIC, name), png(size, draw(size, pad)))
}

// SVG favicon (crisp at any size)
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#FBF6EE"/>
  <circle cx="32" cy="30" r="20" fill="#FCE3A8" opacity="0.5"/>
  <circle cx="26" cy="34" r="11" fill="#6FA8A0"/>
  <circle cx="38" cy="30" r="11" fill="#E8743B"/>
</svg>
`
writeFileSync(join(PUBLIC, 'favicon.svg'), favicon)
console.log('Wrote PWA icons + favicon')

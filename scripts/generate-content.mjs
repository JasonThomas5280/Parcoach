/**
 * Generates the "everyday" content pack: 24 warm SVG illustrations (4 familiar
 * categories x 6) and a validated pack.json. Run with `npm run gen:content`.
 *
 * The art is intentionally simple and picture-book calm — one clear subject per
 * card, soft shapes, warm low-glare palette (per DESIGN_SYSTEM). These are
 * lightweight placeholders a designer can swap for real photography later; the
 * app loads them purely as data, so no component code changes when they do.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'content', 'everyday')
mkdirSync(OUT, { recursive: true })

// --- a tiny SVG helper kit ---------------------------------------------------
const C = {
  paper: '#FBF6EE',
  card: '#F4EAD9',
  ink: '#2B2A26',
  orange: '#E8743B',
  amber: '#F2B45B',
  teal: '#6FA8A0',
  brown: '#9C6B43',
  red: '#D9594C',
  green: '#7FA86B',
  blue: '#5E86A8',
  cream: '#F7E9CF',
  pink: '#E2A19A',
  grey: '#B9B2A6',
  white: '#FBF6EE',
  yellow: '#F2C84B',
}

const svg = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" role="img">
  <circle cx="160" cy="160" r="150" fill="${C.card}"/>
  ${inner}
</svg>
`

const circle = (cx, cy, r, fill, extra = '') =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`
const ellipse = (cx, cy, rx, ry, fill, extra = '') =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`
const rect = (x, y, w, h, r, fill, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`
const eyes = (cx, cy, dx = 22, r = 7) =>
  circle(cx - dx, cy, r, C.ink) + circle(cx + dx, cy, r, C.ink)

// --- the 24 subjects ---------------------------------------------------------
const ART = {
  // animals
  dog: () =>
    ellipse(160, 175, 78, 66, C.brown) +
    ellipse(108, 150, 24, 46, C.brown) + // ears
    ellipse(212, 150, 24, 46, C.brown) +
    ellipse(160, 200, 30, 22, C.cream) +
    eyes(160, 160, 26) +
    ellipse(160, 188, 14, 10, C.ink) +
    rect(156, 196, 8, 22, 4, C.ink),
  cat: () =>
    path('M110 120 L130 165 L95 160 Z', C.grey) +
    path('M210 120 L190 165 L225 160 Z', C.grey) +
    ellipse(160, 180, 72, 64, C.grey) +
    eyes(160, 165, 28, 8) +
    path('M152 188 q8 8 16 0', 'none', `stroke="${C.ink}" stroke-width="5" stroke-linecap="round"`) +
    `<g stroke="${C.ink}" stroke-width="3" stroke-linecap="round">
      <line x1="120" y1="185" x2="88" y2="178"/><line x1="120" y1="193" x2="88" y2="196"/>
      <line x1="200" y1="185" x2="232" y2="178"/><line x1="200" y1="193" x2="232" y2="196"/>
     </g>`,
  cow: () =>
    ellipse(160, 175, 80, 66, C.cream) +
    ellipse(108, 150, 20, 30, C.cream) +
    ellipse(212, 150, 20, 30, C.cream) +
    path('M120 150 q-10 -30 18 -34 q-6 22 -18 34', C.ink) +
    path('M200 150 q10 -30 -18 -34 q6 22 18 34', C.ink) +
    ellipse(160, 200, 40, 30, C.pink) +
    eyes(160, 160, 28) +
    circle(146, 205, 6, C.ink) +
    circle(174, 205, 6, C.ink),
  duck: () =>
    ellipse(150, 180, 70, 56, C.yellow) +
    circle(205, 135, 38, C.yellow) +
    path('M235 130 q30 4 30 16 q-30 8 -36 -4 Z', C.orange) +
    circle(212, 126, 6, C.ink),
  bird: () =>
    ellipse(160, 175, 62, 56, C.teal) +
    circle(160, 120, 40, C.teal) +
    path('M160 120 l36 14 l-36 14 Z', C.orange) +
    path('M120 175 q-44 -6 -56 18 q40 6 56 -18', C.blue) +
    circle(176, 112, 6, C.ink),
  fish: () =>
    ellipse(150, 165, 78, 52, C.orange) +
    path('M222 165 l46 -34 l0 68 Z', C.amber) +
    path('M150 113 q14 18 0 26', C.amber) +
    circle(110, 155, 8, C.ink),
  // food
  apple: () =>
    path('M160 110 q-60 -6 -60 60 q0 70 60 78 q60 -8 60 -78 q0 -66 -60 -60', C.red) +
    rect(155, 86, 8, 30, 4, C.brown) +
    path('M163 96 q34 -18 40 6 q-30 10 -40 -6', C.green),
  banana: () =>
    path('M96 120 q4 90 96 104 q44 4 40 -16 q-70 8 -110 -96 q-10 -2 -26 8', C.yellow) +
    rect(86, 110, 14, 18, 5, C.brown),
  bread: () =>
    path('M80 175 q0 -70 80 -70 q80 0 80 70 q0 22 -16 22 l-128 0 q-16 0 -16 -22', C.brown) +
    rect(72, 188, 176, 40, 14, C.amber),
  milk: () =>
    path('M118 120 l84 0 l0 18 l16 24 l0 78 q0 12 -12 12 l-92 0 q-12 0 -12 -12 l0 -78 l16 -24 Z', C.white) +
    rect(120, 175, 80, 56, 6, C.blue, 'opacity="0.85"') +
    path('M118 120 l84 0 l0 14 l-84 0 Z', C.grey),
  carrot: () =>
    path('M160 130 l46 120 q-46 30 -92 0 Z', C.orange) +
    path('M150 128 l-26 -40 M160 124 l0 -46 M170 128 l26 -40', 'none', `stroke="${C.green}" stroke-width="14" stroke-linecap="round"`) +
    `<g stroke="${C.amber}" stroke-width="4" stroke-linecap="round">
      <line x1="150" y1="170" x2="168" y2="176"/><line x1="156" y1="205" x2="174" y2="210"/></g>`,
  egg: () =>
    path('M160 96 q-58 40 -58 104 q0 56 58 56 q58 0 58 -56 q0 -64 -58 -104', C.cream),
  // vehicles
  car: () =>
    rect(64, 168, 192, 50, 16, C.orange) +
    path('M100 168 q14 -40 60 -40 q46 0 60 40 Z', C.orange) +
    rect(116, 142, 36, 26, 6, C.cream) +
    rect(168, 142, 36, 26, 6, C.cream) +
    circle(110, 220, 26, C.ink) +
    circle(210, 220, 26, C.ink) +
    circle(110, 220, 11, C.grey) +
    circle(210, 220, 11, C.grey),
  bus: () =>
    rect(60, 110, 200, 110, 20, C.amber) +
    rect(76, 128, 40, 34, 6, C.blue) +
    rect(124, 128, 40, 34, 6, C.blue) +
    rect(172, 128, 40, 34, 6, C.blue) +
    rect(76, 178, 168, 18, 6, C.cream) +
    circle(108, 224, 22, C.ink) +
    circle(212, 224, 22, C.ink),
  train: () =>
    rect(70, 120, 110, 110, 18, C.red) +
    rect(180, 150, 70, 80, 14, C.teal) +
    rect(86, 138, 78, 40, 8, C.cream) +
    circle(108, 240, 20, C.ink) +
    circle(212, 240, 20, C.ink) +
    rect(96, 92, 30, 30, 6, C.grey),
  boat: () =>
    path('M70 190 l180 0 l-26 50 l-128 0 Z', C.red) +
    rect(150, 96, 12, 90, 3, C.brown) +
    path('M162 100 l60 70 l-60 0 Z', C.cream) +
    path('M150 110 l-50 60 l50 0 Z', C.teal),
  plane: () =>
    path('M60 160 q120 -28 200 -8 q14 4 0 12 q-80 18 -200 4 Z', C.blue) +
    path('M150 150 l-30 -56 l24 0 l50 52 Z', C.cream) +
    path('M150 168 l-30 56 l24 0 l50 -52 Z', C.cream) +
    circle(232, 158, 8, C.ink),
  bike: () =>
    circle(104, 196, 44, 'none', `stroke="${C.ink}" stroke-width="9"`) +
    circle(216, 196, 44, 'none', `stroke="${C.ink}" stroke-width="9"`) +
    path('M104 196 l44 -64 l68 64 M148 132 l-30 0 M216 196 l-68 -64', 'none', `stroke="${C.orange}" stroke-width="9" stroke-linecap="round" fill="none"`) +
    path('M112 128 l40 0', 'none', `stroke="${C.ink}" stroke-width="8" stroke-linecap="round"`),
  // household
  ball: () =>
    circle(160, 170, 74, C.orange) +
    path('M160 96 q40 74 0 148 M86 170 q74 -40 148 0', 'none', `stroke="${C.paper}" stroke-width="6" fill="none"`),
  cup: () =>
    path('M104 130 l112 0 l-12 96 q-2 14 -16 14 l-56 0 q-14 0 -16 -14 Z', C.teal) +
    path('M216 150 q40 0 40 34 q0 30 -40 30 l0 -16 q22 0 22 -14 q0 -16 -22 -16 Z', C.teal) +
    ellipse(160, 132, 56, 12, C.cream),
  book: () =>
    rect(78, 110, 164, 110, 10, C.red) +
    rect(90, 122, 140, 86, 6, C.cream) +
    rect(156, 110, 8, 110, 0, C.brown) +
    `<g stroke="${C.grey}" stroke-width="4" stroke-linecap="round">
      <line x1="104" y1="146" x2="146" y2="146"/><line x1="104" y1="166" x2="146" y2="166"/>
      <line x1="176" y1="146" x2="218" y2="146"/><line x1="176" y1="166" x2="218" y2="166"/></g>`,
  sock: () =>
    path('M132 92 l44 0 l0 86 l40 40 q14 16 -2 30 l-30 26 q-16 12 -30 -4 l-66 -70 q-12 -14 8 -30 l36 -26 Z', C.teal) +
    rect(130, 92, 48, 22, 6, C.orange),
  clock: () =>
    circle(160, 168, 78, C.cream) +
    circle(160, 168, 78, 'none', `stroke="${C.orange}" stroke-width="10"`) +
    path('M160 168 l0 -44 M160 168 l34 14', 'none', `stroke="${C.ink}" stroke-width="8" stroke-linecap="round"`) +
    circle(160, 168, 7, C.ink) +
    rect(140, 78, 16, 16, 4, C.orange) +
    rect(164, 78, 16, 16, 4, C.orange),
  key: () =>
    circle(118, 150, 40, 'none', `stroke="${C.amber}" stroke-width="18"`) +
    rect(150, 142, 110, 16, 6, C.amber) +
    rect(232, 142, 14, 34, 4, C.amber) +
    rect(208, 142, 12, 28, 4, C.amber),
}

// --- the data ----------------------------------------------------------------
// label, sound keyword, gentle animation, co-play prompt, real-world bridge.
const ITEMS = [
  ['dog', 'Dog', 'bark', 'wag', "animals", "Say it together: 'Dog!' Woof woof!", "Go find a dog together — a real one, a photo, or a toy — and say 'dog.'"],
  ['cat', 'Cat', 'meow', 'peek', 'animals', "Point and say 'Cat.' Can you say 'meow'?", "Look for a cat outside or in a book and say 'cat' together."],
  ['cow', 'Cow', 'moo', 'bounce', 'animals', "Say 'Cow!' A cow says 'moooo.'", "Find a cow in a book or a toy and moo together."],
  ['duck', 'Duck', 'quack', 'bounce', 'animals', "'Duck!' Quack quack!", "Find some water and pretend to be ducks — 'quack!'"],
  ['bird', 'Bird', 'tweet', 'peek', 'animals', "'Bird!' Birds say 'tweet.'", "Go to a window and listen for a real bird together."],
  ['fish', 'Fish', 'splash', 'wag', 'animals', "'Fish!' Splash splash!", "Find a fish in a book or pretend to swim like a fish."],
  ['apple', 'Apple', 'crunch', 'bounce', 'food', "'Apple!' Crunch crunch.", "Find a real apple in the kitchen and hold it together."],
  ['banana', 'Banana', 'pop', 'wag', 'food', "'Banana!' It's yellow.", "Find a banana and peel it together."],
  ['bread', 'Bread', 'crunch', 'bounce', 'food', "'Bread!' Yum.", "Find some bread in your kitchen and name it together."],
  ['milk', 'Milk', 'pop', 'bounce', 'food', "'Milk!' Glug glug.", "Pour a little milk together and say 'milk.'"],
  ['carrot', 'Carrot', 'crunch', 'peek', 'food', "'Carrot!' It's orange.", "Find a carrot in the fridge and crunch it together."],
  ['egg', 'Egg', 'crunch', 'bounce', 'food', "'Egg!' So round.", "Find an egg in the kitchen and hold it gently together."],
  ['car', 'Car', 'engine', 'bounce', 'vehicles', "'Car!' Vroom vroom.", "Look out a window for a real car and say 'car.'"],
  ['bus', 'Bus', 'horn', 'bounce', 'vehicles', "'Bus!' Beep beep.", "Watch for a bus together next time you go out."],
  ['train', 'Train', 'chug', 'bounce', 'vehicles', "'Train!' Choo choo!", "Find a train in a book or make a train with chairs."],
  ['boat', 'Boat', 'horn', 'wag', 'vehicles', "'Boat!' It floats.", "Float a toy boat in the bath and say 'boat.'"],
  ['plane', 'Plane', 'whoosh', 'peek', 'vehicles', "'Plane!' Whoosh, up high.", "Look up at the sky together for a real plane."],
  ['bike', 'Bike', 'ring', 'wag', 'vehicles', "'Bike!' Ring ring.", "Find a real bike and say 'bike' together."],
  ['ball', 'Ball', 'pop', 'bounce', 'household', "'Ball!' Bounce, bounce.", "Find a real ball and roll it back and forth together."],
  ['cup', 'Cup', 'clink', 'wag', 'household', "'Cup!' We drink from a cup.", "Find your child's cup and say 'cup' together."],
  ['book', 'Book', 'pop', 'peek', 'household', "'Book!' Let's read.", "Go pick a real book and read one page together."],
  ['sock', 'Sock', 'pop', 'wag', 'household', "'Sock!' On your foot.", "Find a pair of socks and put one on together."],
  ['clock', 'Clock', 'tick', 'peek', 'household', "'Clock!' Tick tock.", "Find a real clock in your home and listen to it tick."],
  ['key', 'Key', 'clink', 'wag', 'household', "'Key!' Jingle jingle.", "Find your keys and jingle them together (gently!)."],
]

const items = ITEMS.map(([id, label, sound, animation, tag, coPlayPrompt, realWorldBridge]) => {
  const art = ART[id]
  if (!art) throw new Error(`No art for ${id}`)
  writeFileSync(join(OUT, `${id}.svg`), svg(art()))
  return {
    id,
    label,
    image: `${id}.svg`,
    sound,
    animation,
    coPlayPrompt,
    realWorldBridge,
    tags: [tag],
  }
})

const pack = {
  id: 'everyday',
  version: 1,
  title: 'Everyday Things',
  ageBand: '18-36m',
  items,
}

writeFileSync(join(OUT, 'pack.json'), JSON.stringify(pack, null, 2) + '\n')
console.log(`Wrote ${items.length} items + images to ${OUT}`)

// Regenerate test/fixtures/gb-misaki.json — the golden phoneme pairs for the Paradee voices.
//
// Why this exists: Paradee only speaks phonemes from misaki (Kokoro's G2P), and the
// eSpeak-to-misaki table has to be spelled the same in every product that ships the model.
// The pi-voicekit fork ships the same table in TypeScript and asserts it in its own suite, so
// this script runs the two implementations over real eSpeak output and fails if they disagree,
// then pins the agreed pairs here. Hearline's unit test reads that fixture, so the American
// path and the British path of the 1.2 voices stay locked to what the model was trained on.
//
//   node tools/gen-gb-golden.mjs
//
// It reads the fork's plain-JS copy of the table (paradee/bench/misaki.js, which the fork's
// tests keep identical to the shipped TypeScript one). Override the path with
// PI_FORK_MISAKI=/path/to/misaki.js when the two checkouts sit apart.
import { mkdirSync, writeFileSync } from 'node:fs'
import { phonemize } from 'phonemizer'

import { toMisaki as hearline } from '../src/shared/paradee-text.js'

const FORK = process.env.PI_FORK_MISAKI
  || new URL('../../../pi-voicekit-paradee/paradee/bench/misaki.js', import.meta.url).href

// Sentences chosen to force every letter pair the two accents disagree about: BATH/NURSE/
// SQUARE/GOAT/PRICE/CHOICE/FOOT/GOOSE, dark l, the yod in "new", h-dropping in "an hour",
// "the" before a vowel and before a consonant, syllabic l, and numbers next to punctuation.
const GB = [
  'The nurse bathed in the bath after dark and heard the milk.',
  'My nurse is over the water, full of light and out of door.',
  'Where are the fair chairs? The air is bare and the bear is there.',
  'The boy chose the goitre and the pothole by the shore.',
  "The farmer's servant works in the nurses' nearer water.",
  'The battery is an idea of a reality: the media read it.',
  'The zebra measured the measure over and over.',
  'He took a book and looked at the cook, the cookie and the coo.',
  'The whale was which, and the white wheel went.',
  'An hour, an honour, an heir — the ankh and the antenna.',
  'Milk, folk, yolk, calm, psalm and alms.',
  'The theatre is the area, the era and the seer.',
  'You knew the news and the nurse is new at music.',
  'Wage, gather, laugh and laugh, and staff.',
  'The 1987 report, 3.5 miles and 22 people, says: “No.”',
  'A poor sure tour: the door floor bore your four scores.',
  'Is this the hour, the era — the end? Yes; no… (maybe “quite”)',
]
const US = [
  'My nurse is over the water, full of light and out of door.',
  'The boy chose the goiter and the pothole by the shore.',
  'He took a book and looked at the cook, the cookie and the coo.',
  'The 1987 report, 3.5 miles and 22 people, says: “No.”',
  'You knew the news and the nurse is new at music.',
  'Is this the hour, the era — the end? Yes; no… (maybe “quite”)',
]

const { toMisaki: fork } = await import(FORK)

const pairs = []
const bad = []
for (const [lang, corpus] of [['en-gb', GB], ['en-us', US]]) {
  for (const text of corpus) {
    const ipa = await phonemize(text, lang)
    const ipaStr = Array.isArray(ipa) ? ipa.filter((s) => s && String(s).trim()).join(' ') : String(ipa)
    const want = fork(ipaStr, lang === 'en-gb')
    const got = hearline(ipa, lang === 'en-gb')
    if (want !== got) bad.push({ text, lang, want, got })
    pairs.push({ text, lang, ipa: ipaStr, misaki: want })
  }
}

if (bad.length) {
  console.error(`${bad.length} of ${pairs.length} pairs disagree with the fork's table:`)
  for (const b of bad.slice(0, 8)) console.error(`\n[${b.lang}] ${b.text}\n  fork: ${b.want}\n  here: ${b.got}`)
  process.exit(1)
}

const out = {
  note: 'eSpeak output and the misaki phonemes the Paradee model expects, pinned by '
    + 'tools/gen-gb-golden.mjs from the table the pi-voicekit fork ships and tests. '
    + 'Regenerate with: node tools/gen-gb-golden.mjs',
  pairs,
}
const dest = new URL('../test/fixtures/gb-misaki.json', import.meta.url)
mkdirSync(new URL('../test/fixtures/', import.meta.url), { recursive: true })
writeFileSync(dest, JSON.stringify(out, null, 2) + '\n', 'utf8')
console.log(`pinned ${pairs.length} pairs (en-gb ${GB.length}, en-us ${US.length}) — the two tables agree`)

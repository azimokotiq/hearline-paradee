(function (root) {
  const HL = (root.__HL = root.__HL || {})

  // The offline natural voices, and which one to reach for. Both are English-only and both
  // are optional downloads; Paradee comes first because it is roughly 3x faster than real
  // time in WASM where the bigger Kokoro build often is not.
  const ORDER = ['paradee', 'kokoro']

  // Paradee 1.2 carries four of Kokoro's voices in one 8.5 MB file, listed in the order the
  // model's own config.json numbers them — that index is the `voice` input of the graph.
  // Two speak American English, two British. `lang` is the accent their phonemes are made in,
  // not the page language: Paradee reads English text of any accent.
  const PARADEE_VOICES = [
    { id: 'af_heart', name: 'Heart', lang: 'en-US', gender: 'F', engine: 'paradee' },
    { id: 'bf_isabella', name: 'Isabella', lang: 'en-GB', gender: 'F', engine: 'paradee' },
    { id: 'am_puck', name: 'Puck', lang: 'en-US', gender: 'M', engine: 'paradee' },
    { id: 'bm_fable', name: 'Fable', lang: 'en-GB', gender: 'M', engine: 'paradee' },
  ]

  const state = (settings, engine) => ((settings || {}).hq || {})[engine] || {}

  function installed(settings, engine) {
    return !!state(settings, engine).installed
  }

  /** Slower than speech: the speed test in Settings measured it, and it would stutter. */
  function slow(settings, engine, limit = 1.1) {
    const rtf = state(settings, engine).rtf
    return rtf != null && rtf > limit
  }

  function supports(engine, lang) {
    const base = String(lang || '').toLowerCase().split('-')[0]
    if (base !== 'en') return false
    // English in any accent: the two American voices cover en-US, the two British en-GB.
    if (engine === 'paradee') return true
    return HL.kokoroVoices ? HL.kokoroVoices.supports(lang) : base === 'en'
  }

  function usable(settings, engine, lang) {
    return installed(settings, engine) && supports(engine, lang) && !slow(settings, engine)
  }

  function voices(engine) {
    if (engine === 'paradee') return PARADEE_VOICES
    return (HL.kokoroVoices ? HL.kokoroVoices.VOICES : []).map((v) => Object.assign({ engine: 'kokoro' }, v))
  }

  function find(engine, id) {
    return voices(engine).find((v) => v.id === id) || null
  }

  /** The voice to use when the page has no saved choice: the fastest usable one. */
  function pickDefault(settings, lang) {
    for (const engine of ORDER) {
      if (!usable(settings, engine, lang)) continue
      // af_heart for every accent: Paradee's quality was measured with it, and switching
      // accent mid-session costs the phonemizer a rebuild, so the default never asks for one.
      const id = engine === 'paradee' ? PARADEE_VOICES[0].id : (HL.kokoroVoices ? HL.kokoroVoices.defaultFor(lang) : null)
      if (id) return { engine, id }
    }
    return null
  }

  /** A saved choice survives only while its engine is still usable. */
  function pick(settings, { saved, lang }) {
    if (saved && saved.engine !== 'web' && ORDER.includes(saved.engine) && usable(settings, saved.engine, lang) && find(saved.engine, saved.id)) {
      return { engine: saved.engine, id: saved.id }
    }
    return pickDefault(settings, lang)
  }

  /** True when the speed test is still needed for an installed engine (rtf unknown). */
  function needsBench(settings) {
    return ORDER.some((engine) => installed(settings, engine) && state(settings, engine).rtf == null)
  }

  const api = { ORDER, PARADEE_VOICES, state, installed, slow, supports, usable, voices, find, pickDefault, pick, needsBench }
  HL.hq = api
  if (typeof module !== 'undefined') module.exports = api
})(typeof globalThis !== 'undefined' ? globalThis : this)

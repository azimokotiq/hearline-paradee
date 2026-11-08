# Changelog

## 1.4.1 — this fork (vibecoded)
- Fixed: **the two British voices mumbled.** 1.4.0 fed them a hand-written letter set — eSpeak's own spelling (`oʊ`, `eə`, `ɜː`, `ɪr`) — and Paradee only ever saw misaki phonemes in training, so the words came out as mush. The British path is now the *same* eSpeak→misaki table as American plus the four differences upstream's `to_misaki(ps, british=True)` applies: SQUARE `eə`→`ɛː`, GOAT `əʊ`→`Q`, `iə`→`ɪə`, a standalone `the` →`ði`, and the length marks kept (so NURSE stays `ɜː` and never becomes `ɜɹ`). PRICE, MOUTH, the affricates and the flaps are shared with American (`I`, `W`, `ʤ`, `ʧ`, `T`), and the dark `ɫ` — mostly British output, and a symbol the vocabulary has no id for — folds to plain `l`
- New: `tools/gen-gb-golden.mjs` maps 23 sentences of real eSpeak output through the phoneme table the pi‑voicekit fork ships, in both accents, fails if the two implementations disagree, and pins the agreed pairs to `test/fixtures/gb-misaki.json`. The unit tests assert this repo reproduces every pair and that every pinned phoneme has a vocabulary id — a letter the vocabulary lacks is dropped in silence, which is exactly how a wrong table hides
- New: the offscreen document reports each run's accent, phoneme letters and dropped symbols to the service worker, which keeps the last 24. The Chrome test reads them: the British run must feed British letters (`Q`, and no `O`), the American run the reverse. Playwright cannot see the offscreen document, so the worker is the one place the browser's own build of eSpeak is observable — the build no unit test reaches
- Changed: `phonemizer` is a declared dependency. The extension and the tests import it directly and it was only arriving through `kokoro-js`

## 1.4.0 — this fork (vibecoded)
- New: the fast voice is **Paradee‑8M v1.2**, which carries four voices in the same ~8.5 MB file: `af_heart` (American female), `bf_isabella` (British female), `am_puck` (American male), `bm_fable` (British male). The speaker is a scalar int64 `voice` input on the graph, and the sid is the order the model's own `config.json` lists them
- New: British phonemes. The `bf_`/`bm_` voices were trained on misaki's British dictionary, so `toMisaki` grew the British branch (`əʊ`→`Q`, `eə`→`ɛː`, `ɚ`→`ə`, kept length marks) and eSpeak is asked for `en-gb` for those two voices
- New: the voice pill and the pickers say which accent a Paradee voice speaks — `Isabella (fast, UK)`, `Puck (fast, US)`
- New: the e2e test installs the real 1.2 model in Chrome, picks the British voice mid‑sentence and checks the reading continues after the phonemizer is rebuilt in the new accent
- Changed: model URL, pinned revision, sha256 and byte count now point at `Paradee-8M-v1.2` (8,462,119 bytes at `ed2934d4`). An existing 1.0 install is replaced on the next install; the 1.0 graph has no `voice` input, so the code asks the session which inputs it has rather than assuming a version
- Changed: one Paradee worker speaks one accent, because eSpeak fixes its language when it is built. Asking for the other one rebuilds the worker (a model reload, about a second); every voice keeps its own audio cache entries
- Kept: `af_heart` is still the default for every accent — it is the voice the speed test measured, and the default never forces a phonemizer rebuild

## 1.3.0 — this fork (vibecoded)

Written by an AI coding agent under human direction — see the note at the top of the README. Everything from 1.2.0 down is upstream.
- New: "the fast voice" — Paradee-8M (Kokoro's `af_heart` distilled to 8 million parameters) as a second HQ voice: 9 MB once, around 4x faster than playback on a typical laptop, and it becomes the default HQ voice when its speed test passes
- New: for that voice the highlight follows the model's own character positions (Misaki phoneme offsets mapped back to the page text) instead of an estimate from audio playback time
- New: HQ model downloads resume where they stopped and retry with a backoff (Hugging Face resets long downloads on some connections), and the file is checked against the pinned sha256
- New: real browser tests for both HQ voices, with the models served from `test/e2e/fixtures` so they run without the network
- Changed: HQ voice state lives per engine under `settings.hq.<engine>`; the names, labels and pick rules live in one module used by the player, the popup and Settings
- Changed: Kokoro is offered as "More voices" (28 voices, installed on demand) next to the fast voice
- Changed: the toolbar icon opens the player straight away — the popup is out of the way (voice and speed are in the player, everything else is in Settings)
- Changed: opening a page shows the controls paused; the voice starts when you press play. Reading a selection from the right‑click menu still speaks right away
- Changed: the "read from here" button by a paragraph now stays up while the pointer travels to it — it used to vanish the moment the cursor left the paragraph
- Changed: HQ voices leave far less dead air between sentences. The models pad every chunk with ~300 ms of silence in front and ~480 ms behind (measured); that is trimmed to ~70/150 ms, so a sentence boundary went from ~0.9 s to ~0.2 s
- Fixed: closing the player and starting to read again left the controls invisible — the shadow host was rebuilt without the player's stylesheet, so the bar came back unstyled and unclickable
- Fixed: a reading session that failed part way through starting blocked every later attempt until the page was reloaded
- Fixed: `onnxruntime-web` was imported by the build without being declared as a dependency, so a fresh clone could not build it

## 1.2.0
- New: voice picker (system voices by language) with saved choice per language; no hard-coded voice names
- New: optional offline HQ voices (Kokoro-82M, 28 English voices) installed from Settings, with live voice switching
- New: speed 0.5x–4x, progress bar, sentence/paragraph navigation, keyboard shortcuts, draggable player
- New: read selection (context menu / shortcut), read-from-here hover button, Alt+click to seek
- New: speed reading (RSVP), offline summary, pronunciation dictionary, bookmarks, sleep timer, resume position, listening stats
- New: highlight styles, light/dark themes, accent colour; options page and a real popup
- New: download page as WAV audio (HQ voices)
- Changed: on-demand injection (`activeTab` + `scripting`) instead of an always-on `<all_urls>` content script
- Changed: block/sentence based reading with accurate offsets, Unicode-aware word highlighting; page DOM is no longer modified
- Fixed: Alt+H shortcut, duplicate listeners/buttons on repeated opens, Escape now closes the player, dead voice button, README claims that did not exist

## 1.0.0
- Initial release

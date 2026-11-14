# Tantrarājatantra Reader

Read the Tantrarājatantra with the Manoramā commentary the way you read a book in Apple Books.
You turn pages, pick a theme, set the text size, and highlight lines with a pencil.

**Live:** https://thehardikdewra.github.io/tantraraja-reader/

The whole text is here: the front matter and all 36 paṭalas, in Devanagari and in IAST.
The root verses stand out from the commentary, so you always know which is which.

## Features

- **Page turns.** Swipe, tap the page edge, or use the keys. The turn is smooth and short.
- **Themes.** Six reading themes, plus dark mode.
- **Text settings.** Change the font size, line spacing and margins.
- **Two scripts.** Switch between Devanagari and IAST at any time.
- **Pencil highlighter.** Drag across a line with an Apple Pencil, a finger or a mouse. The highlight sweeps in behind your stroke.
- **Notes.** Add a note to any highlight.
- **Bookmarks.** Mark a page and come back to it later.
- **Search.** Find a word across the whole book.
- **Offline.** After your first visit the reader works with no internet. You can add it to the Home Screen on iPad and iPhone.

Your highlights, notes, bookmarks and settings stay in your own browser. Nothing is sent to a server.

## Keyboard shortcuts

| Key | What it does |
| --- | --- |
| Right arrow or Space | Next page |
| Left arrow | Previous page |
| T | Open the contents |
| / | Search |
| B | Bookmark this page |

## Add it to your Home Screen

1. Open the live link in Safari on your iPad or iPhone.
2. Tap the Share button.
3. Tap **Add to Home Screen**.

It opens full screen, like an app. Chapters you have opened are saved for offline reading.

## Run it on your computer

There is no build step and nothing to install. You only need Python 3.

```sh
git clone https://github.com/TheHardikDewra/tantraraja-reader.git
cd tantraraja-reader
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

Opening `index.html` straight from the folder will not work, because the browser blocks `fetch` on `file://` pages. Use the server.

## How the data was built

The book lives in `data/` as small HTML files, one per chapter, in two scripts:

- `data/dev/NN.html` is the Devanagari text.
- `data/iast/NN.html` is the same text in IAST.
- `data/toc.json` lists every chapter id and its title in both scripts.

The chapter ids are `00-front-matter` and `01` to `36`.

These files are made by `scripts/build_data.py` from the Markdown edition of the text (one `.md` file per chapter, in each script). It needs the Python `markdown` package.

```sh
pip install markdown
python3 -I scripts/build_data.py <devanagari-md-dir> <iast-md-dir> .
```

Inside each chapter file:

- `h1` is the chapter label and `h2` is the heading.
- `blockquote > p > strong` is a root verse.
- A plain `p` is the Manoramā commentary.
- `p.mn` marks where the commentary starts.
- `span.pg` is a page number from the printed edition.
- `p.inv` is a centred line, like an invocation.

## Project layout

```
index.html              the page shell
manifest.webmanifest    app name and icons for Add to Home Screen
sw.js                   service worker for offline reading
favicon.svg             the icon
icons/                  PNG icons for iPhone, iPad and Android
css/
  base.css              fonts, variables, book typography
  themes.css            the six themes and dark mode
  pages.css             page layout and turn animation
  highlights.css        highlight colours and the sweep animation
  nav.css               top bar, bottom bar, sheets and panels
js/
  core.js               shared state, events and storage (window.TR)
  paginator.js          splits a chapter into pages and turns them
  settings.js           themes and text settings
  highlights.js         pencil highlighter, notes
  nav.js                contents, search, bookmarks, progress bar
  boot.js               starts the app and opens chapters
  pwa.js                registers the service worker
data/
  toc.json              chapter list
  dev/                  Devanagari chapters
  iast/                 IAST chapters
fonts/                  Noto Serif Devanagari, Noto Serif, and their licences
scripts/
  build_data.py         turns the Markdown edition into data/
```

The modules never call each other directly. They talk through events on `window.TR`. The event list is at the bottom of `js/core.js`.

## Known gaps in the text

These are gaps in the source, kept as they are:

- **Paṭala 4, verse 69** is missing in the printed edition.
- **One verse is lost after 34.27.**
- **Paṭalas 8 and 35** have verses in scrambled letters (vyākulitākṣara). They are kept exactly as printed.

## Credits and licence

- **Code:** MIT licence, (c) 2026 Hardik Dewra. See [LICENSE](LICENSE).
- **Text:** Muktabodha Indological Research Institute, e-text M00122, "tantrarājatantra with commentary manorama". Commentary by Subhagānandanātha. Edited by Lakṣmaṇa Śāstrī and John Woodroffe (Arthur Avalon). Transcribed by Muktabodha staff under the supervision of Mark S. G. Dyczkowski. Source: https://muktalib7.com/DL_CATALOG_ROOT/digital_library.htm
- **Text licence:** CC BY-NC 4.0, https://creativecommons.org/licenses/by-nc/4.0/ . The text here is for non-commercial use only and must keep this credit.
- **Changes to the text:** 539 lines repaired where the Devanagari file lost a virama, rebuilt from Muktabodha's own IAST copy. Three English editorial notes restored. Split into chapters. IAST generated with `indic_transliteration`.
- **Printed original:** Arthur Avalon (ed.), *Tantrik Texts* vol. VIII (Part 1, paṭalas 1 to 18, ed. Lakshmana Shastri, about 1918 to 1919) and vol. XII (Part 2, paṭalas 19 to 36, ed. Sadashiva Mishra, 1926).
- **Fonts:** Noto Serif Devanagari and Noto Serif, SIL Open Font License 1.1. Licence files are in `fonts/`.

Full details are in [NOTICE.md](NOTICE.md).

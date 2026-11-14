# Notice

This repository holds three kinds of material. Each has its own licence.

## 1. Code

All code (HTML, CSS, JavaScript, Python) is under the MIT licence.
Copyright (c) 2026 Hardik Dewra. See [LICENSE](LICENSE).

## 2. The Sanskrit text

The text in `data/` comes from the Muktabodha Indological Research Institute.

- **E-text:** M00122, "tantrarājatantra with commentary manorama"
- **Commentator:** Subhagānandanātha (the Manoramā commentary)
- **Editors:** Lakṣmaṇa Śāstrī and John Woodroffe (Arthur Avalon)
- **Transcribed by:** Muktabodha staff, under the supervision of Mark S. G. Dyczkowski
- **Source:** https://muktalib7.com/DL_CATALOG_ROOT/digital_library.htm
- **Licence:** Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0), https://creativecommons.org/licenses/by-nc/4.0/

The text in this repository is for non-commercial use only. Anyone who copies or adapts it must keep this credit.

### Changes made to the Muktabodha text

- 539 lines were repaired where Muktabodha's Devanagari file lost a virama. Each one was rebuilt from Muktabodha's own IAST copy of the same text.
- Three English editorial notes were restored.
- The text was split into chapters (one file per paṭala, plus the front matter).
- The IAST version was generated from the Devanagari with the `indic_transliteration` Python library.

### Printed original

- Arthur Avalon (ed.), *Tantrik Texts* vol. VIII. Part 1, paṭalas 1 to 18, edited by Lakshmana Shastri, about 1918 to 1919.
- Arthur Avalon (ed.), *Tantrik Texts* vol. XII. Part 2, paṭalas 19 to 36, edited by Sadashiva Mishra, 1926.

## 3. Fonts

Noto Serif Devanagari and Noto Serif are under the SIL Open Font License 1.1.
The licence files are in `fonts/`:

- `fonts/OFL-NotoSerifDevanagari.txt`
- `fonts/OFL-NotoSerif.txt`

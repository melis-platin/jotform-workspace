# App Designer Fonts

Fonts offered in the **App Designer** theme editor. Defined in
[`src/layout/AppDesigner.tsx`](./src/layout/AppDesigner.tsx) (`FONT_OPTIONS` /
`HEADING_FONT_OPTIONS`) and loaded at runtime via `loadGoogleFont`.

- **Default body font:** DM Sans
- **Default heading font:** DM Sans
- **Loader format** (`loadGoogleFont`):
  `https://fonts.googleapis.com/css2?family=<Font>:wght@400;500;600;700&display=swap`
  (the app URL-encodes spaces as `%20`; `+` works too)
- Availability checked against the css2 API with the exact app weights (`400;500;600;700`) — all families below resolve. (`Frances`, which was not on Google Fonts, has been removed.)

---

## Body fonts (`FONT_OPTIONS`) — 13

| Font | OK | Specimen | CSS (`@import` / `<link>`) |
|------|----|----------|----------------------------|
| Bricolage Grotesque | ✅ | https://fonts.google.com/specimen/Bricolage+Grotesque | `https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700&display=swap` |
| **DM Sans** _(default)_ | ✅ | https://fonts.google.com/specimen/DM+Sans | `https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap` |
| Figtree | ✅ | https://fonts.google.com/specimen/Figtree | `https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap` |
| Fredoka | ✅ | https://fonts.google.com/specimen/Fredoka | `https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap` |
| Geist | ✅ | https://fonts.google.com/specimen/Geist | `https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap` |
| Google Sans | ✅ | https://fonts.google.com/specimen/Google+Sans | `https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&display=swap` |
| Hanken Grotesk | ✅ | https://fonts.google.com/specimen/Hanken+Grotesk | `https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&display=swap` |
| IBM Plex Mono | ✅ | https://fonts.google.com/specimen/IBM+Plex+Mono | `https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap` |
| Instrument Sans | ✅ | https://fonts.google.com/specimen/Instrument+Sans | `https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap` |
| Inter | ✅ | https://fonts.google.com/specimen/Inter | `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap` |
| JetBrains Mono | ✅ | https://fonts.google.com/specimen/JetBrains+Mono | `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap` |
| Public Sans | ✅ | https://fonts.google.com/specimen/Public+Sans | `https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&display=swap` |
| Varela Round | ✅ | https://fonts.google.com/specimen/Varela+Round | `https://fonts.googleapis.com/css2?family=Varela+Round:wght@400;500;600;700&display=swap` |

---

## Heading fonts (`HEADING_FONT_OPTIONS`)

These **10** are heading-only; in addition, **all 14 body fonts above** are also selectable for headings.

| Font | OK | Specimen | CSS (`@import` / `<link>`) |
|------|----|----------|----------------------------|
| Bitter | ✅ | https://fonts.google.com/specimen/Bitter | `https://fonts.googleapis.com/css2?family=Bitter:wght@400;500;600;700&display=swap` |
| DM Serif Display | ✅ | https://fonts.google.com/specimen/DM+Serif+Display | `https://fonts.googleapis.com/css2?family=DM+Serif+Display:wght@400;500;600;700&display=swap` |
| Fraunces | ✅ | https://fonts.google.com/specimen/Fraunces | `https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&display=swap` |
| Libre Baskerville | ✅ | https://fonts.google.com/specimen/Libre+Baskerville | `https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;500;600;700&display=swap` |
| Lora | ✅ | https://fonts.google.com/specimen/Lora | `https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap` |
| Merriweather | ✅ | https://fonts.google.com/specimen/Merriweather | `https://fonts.googleapis.com/css2?family=Merriweather:wght@400;500;600;700&display=swap` |
| Outfit | ✅ | https://fonts.google.com/specimen/Outfit | `https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap` |
| Playfair Display | ✅ | https://fonts.google.com/specimen/Playfair+Display | `https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap` |
| Sora | ✅ | https://fonts.google.com/specimen/Sora | `https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap` |
| Space Grotesk | ✅ | https://fonts.google.com/specimen/Space+Grotesk | `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap` |

---

## Combined import (all working fonts)

Single css2 request for all 23 families:

```
https://fonts.googleapis.com/css2?family=Bitter:wght@400;500;600;700&family=Bricolage+Grotesque:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:wght@400;500;600;700&family=Figtree:wght@400;500;600;700&family=Fraunces:wght@400;500;600;700&family=Fredoka:wght@400;500;600;700&family=Geist:wght@400;500;600;700&family=Google+Sans:wght@400;500;600;700&family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&family=Instrument+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Libre+Baskerville:wght@400;500;600;700&family=Lora:wght@400;500;600;700&family=Merriweather:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Public+Sans:wght@400;500;600;700&family=Sora:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Varela+Round:wght@400;500;600;700&display=swap
```

---

_Generated from `AppDesigner.tsx`; availability verified against the Google Fonts css2 API with weights `400;500;600;700`._

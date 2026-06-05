# Landing Templates — Build Plan & Handoff

> Resume doc for the "4 rich landing-page templates" initiative. Captures all research so any
> fresh session can continue. Started 2026-06-05 on branch `feat/navigation-menu-panel`.

## Goal
Design **4 rich landing-page templates in 4 distinct layout archetypes**, packaged as 4 standalone
preset apps. These feed the live product's **AI app copilot** — the AI fills these templates with
generated content. This repo is the designer/reference prototype; devs port to the live product.

## Decisions (confirmed with user)
1. **4 archetypes:** Hero/Conversion · Storefront · Registration · Editorial
2. **Packaging:** 4 separate landing-template presets (`landing=true` first page + 1–2 minimal inner pages)
3. **Content:** realistic sample content + curl-verified images (memory: verify every image URL before shipping)

## Status — BUILT + ENRICHED ✅ (visual review by user pending)
> **Enriched 2026-06-05** (user: "too short / not rich"): rebuilt each landing into a long multi-section
> marketing page (~50–59 landing elements) using section recipes from 8 reference screenshots — eyebrow+title,
> stat cards, 6-tile feature grids, 3-step how-it-works, custom review cards (Circle avatar + 'Name·Role' +
> quote), image showcase cards, strong final CTA. 309 total elements across the 4 presets. Build green;
> all 70 images + 60 lucide icons verified.

- [x] **Plumbing** — `PresetPage` gained `landing?`/`requireLogin?` (appPresets.ts); `BuildPage.tsx`
      fresh-from-preset branch (~L245) now carries them into runtime `AppPage` (was dropping them).
- [x] **Design** — 4 presets built via parallel designers + catalog validator. Brands:
      `landing-hero`=**Ironwell Studio** (fitness), `landing-storefront`=**Fernwell & Co.** (plants),
      `landing-registration`=**Aperture Weekend** (photography intensive, login-signup centerpiece),
      `landing-editorial`=**Northside Table** (food bank). Each: landing page + 2 requireLogin inner pages.
- [x] **Images** — all 33 unique URLs curl-verified live (200). No swaps needed; designers used real Unsplash IDs.
- [x] **Assembled** into `APP_PRESETS` (appPresets.ts ~L2536/2822/3137/3485). Picker auto-lists them.
- [x] **Build gate** — `tsc -b` exit 0 + `vite build` ✅ (2.64s). Dev server (5173) serves all 4 presets w/ content.
- [x] **Render-safety** — `login-signup` register reads exactly the props passed (Mode/Layout/Title/Subtitle/
      Button Label/Input Icons), defaults for empties → won't crash.
- [ ] **Visual review** — USER reviews in their running dev server. (Headless Chrome can't mount this SPA —
      `#root` stays empty in headless, likely the 2.5MB tabler-icons ESM module; real browser renders fine.)

**Preview URLs** (user's dev server on :5173): `http://localhost:5173/?preset=<id>&page=1&fullscreen=phone`
for id ∈ {landing-hero, landing-storefront, landing-registration, landing-editorial}. Or just pick them
from the TopBar preset dropdown. New presets = no IndexedDB snapshot yet, so they build fresh from the definition.

> ⚠️ Build artifacts: `pnpm build` wrote `packages/app-builder/dist/` — gitignored, fine to leave.
> Changes are UNCOMMITTED in the working tree (user chose not to push; same-machine continuation).

## Landing render requirements (already supported in BuildPage)
- `pages[0].landing` truthy → `showLandingNav` while logged-out → auto hamburger/top-nav + Login/Sign-up
  buttons + login popover. **Landing chrome is shell UI, NOT preset elements** — don't add a login element for it.
- Inner pages with `requireLogin: true` are hidden from the logged-out landing nav, appear after login.
- Need **≥2 pages** so post-login has a destination (`handlePreviewLogin` redirects to first non-landing page).
- Branded compact header is forced on landing regardless of `appHeader.show`.

## Validated element catalog (only what landings need; variant → options; props)
- **heading**: Size(Large/Medium/Small), Alignment(Left/Center/Right) · props: `Heading`, `Subheading`
- **paragraph**: Size, Alignment, Toolbar(Inline/Tooltip) · props: `Text`, `Placeholder`
- **image**: `Has Image`(Yes/No), Alignment, Size(Normal/Large) · props: `Image URL`, `Alt Text`
- **image-gallery**: `Layout` = tile-COUNT string '1'..'9' (default '2') · props: `Images` = `JSON.stringify([url, url, ...])` (array of URL **strings**, not objects)
- **spacer**: props `Height`(number, min1 max200 step4). Rhythm: 16 section gap, 24/32 major break, 8 tight.
- **card**: `Image Style`(Square/Circle/Icon/None), Layout(Horizontal/Vertical), Action(None/Icon/Button), `Icon Filled`(Yes/No) · props: `Title`, `Description`, `Icon`(when Image Style=Icon), `Button Label`, `Image URL`(used for Square/Circle), `Shrinked`(bool — **the 2-up feature-tile feature**; repeat 4 consecutive Icon+Vertical+Shrinked cards = 2×2 feature grid)
- **list**: Layout(Basic/Card). **Card grid** = set ALL four: `Card Image Style`(Square/Circle/Icon/None), `Card Layout`(Horizontal/Vertical), `Card Size`(Small/Medium/Large), `Card Action`(None/Icon/Button) + `Show Header`:false + `Items`. `Items` = `JSON.stringify([{title, description, image?}, ...])` (NOT in register props but read at render). Basic layout uses a DIFFERENT set: `Image Style`/`Size`/`Action`. Don't mix.
- **product-list**: Layout(List/Grid/Grid 3) · props: `Title`, `Subtitle`, `Currency`, `Search Placeholder`, `Button Label`, `Show Toolbar`, `Show Images`, `Add New Card`(**MUST be false in presets**), `Products` = `JSON.stringify([{name, price /* string e.g. '21.00' */, image?, description?}, ...])`
- **form**: `Layout Type`(Card/Form), Alignment, Size · Card mode props: `Label`, `Description`, `Show Icon`, `Icon`, `Required`. (This is a tappable form-LAUNCHER card, not an inline form.)
- **login-signup** (registered, UNUSED in presets so far — Registration archetype centerpiece): Mode(Login/Signup), Layout(Left/Center) · props: `Title`, `Subtitle`, `Button Label`, `Input Icons`. VERIFY it renders during preview.
- **button**: Type(Standard/Icon Only), Variant(Default/Secondary/Outlined), Corner(Default/Rounded), Size(Default/Small), Width(Auto/Full), Alignment, Filled(Yes/No) · props: `Label`, `Left Icon`(default 'none'), `Right Icon`(default 'none'), `Icon`(Icon Only), `Shrinked`, `Action`(None/Open Form) + Form* props. Existing presets also pass `'Full Width': true`. For text-only set unused icon to `'none'`. CTA idiom: `Right Icon:'ArrowRight'` or `Left Icon:'Plus'/'Download'/'CalendarPlus'`.
- **testimonial**: props `Show Avatars`(bool). **Fixed default content** (3 quotes+avatars hardcoded) — not customizable via preset. Just `{ 'Show Avatars': true }`.
- **social-follow**: Layout(Horizontal/Wrap), Variant(Primary/Secondary), Filled(Yes/No) · default handles. Footer idiom: `{ Layout:'Wrap', Variant:'Secondary', Filled:'No' }`.
- **donation-box**: `Heading Alignment`, Size(Web/Mobile) · props: `Title`, `Description`, `Show Goal`, `Raised Amount`, `Goal Amount`, `Goal Progress`(0-100), `Show Custom Amount`, `Currency Symbol`, `Button Label`. (Editorial/nonprofit.)

### Pitfalls
- JSON-valued props (`Items`, `Products`, `Images`, button `Form Fields`) MUST be `JSON.stringify(...)` strings.
- `Add New Card: false` on every product-list in a preset (it's an editor affordance).
- No hardcoded values rule governs COMPONENTS, not preset data — preset copy/URLs/icon-names are fine.
- propDocs only matters if you touch a registered component; appPresets.ts just consumes them.

## Image strategy (zero-404 guarantee)
Network is **blocked in sandbox** → curl must use `dangerouslyDisableSandbox: true`.
Verify method that works (inline `$var` loops gave false 000s):
```bash
# write urls to a file, then:
ok=0; bad=0
while IFS= read -r url; do
  code=$(curl -s -o /dev/null -L --max-time 20 -w "%{http_code}" -A "Mozilla/5.0" "$url")
  [ "$code" = "200" ] && ok=$((ok+1)) || { bad=$((bad+1)); echo "BROKEN $code $url"; }
done < /tmp/img_urls.txt
echo "$ok ok, $bad bad"
```
- `source.unsplash.com` is DEAD (503). Unsplash search pages are JS-rendered (no IDs in HTML). `picsum.photos` works but off-subject.
- Plan: designers propose fresh themed Unsplash URLs **+ a verified-pool fallback per image**. Curl-verify all primaries; broken → fallback (guaranteed live).

### Verified image pool (36 Unsplash IDs, all 200 as of 2026-06-05) — `images.unsplash.com/photo-<ID>?w=W&h=H&fit=crop`
Faces/avatars (200/400, +crop=face for tight): 1494790108377-be9c29b29330 (woman, warm), 1607746882042-944635dfe10e (man), 1545996124-0501ebae84d0 (woman pro), 1517841905240-472988babdf9 (man glasses), 1573497019418-b400bb3ab074 (man friendly), 1604881988758-f76ad2f7aac1 (child), 1574701148212-8518049c7b2c (young woman), 1503454537195-1dcabb73ffb9 (man), 1542884748-2b87b36c6b90 (man), 1599566150163-29194dcaad36 (woman), 1504439468489-c8920d796a29 (man), 1502086223501-7ea6ecd79368 (man), 1488477181946-6428a0291777 (person), 1546410531-bb4caa6b424d (student)
Scenes: 1517824806704-9040b037703b (outdoor campfire HERO 900x500), 1551632811-561732d1e306 (hiking/adventure), 1452860606245-08befc0ff44b (arts/pottery), 1571902943202-507ec2618e8f (sports/soccer), 1493225457124-a3eb161ffa5f (music/concert), 1504280390367-361c6d9f38f4 (lake/kayak), 1478737270239-2f02b77fc618 (landscape), 1511497584788-876760111969 (nature 600x600), 1469474968028-56623f02e42e (mountain), 1525193612562-0ec53b0e5d7c (nature), 1530563885674-66db50a1af19 (nature/greenery), 1497486751825-1233686d5d80 (meeting/people), 1488521787991-ed7bbaae773c (kids art), 1497633762265-9d179a990aa6 (picnic), 1521587760476-6c12a4b040da (library/books), 1577896851231-70ef18881754 (field trip/kids), 1503676260728-1c00da094a0b (STEM/science), 1514525253161-7a46d19cd819 (concert), 1546074177-31bfa593f731 (group/class trip), 1576091160399-112ba8d25d1d (clinic/exam), 1559757148-5c350d0d3c56 (medical), 1622253692010-333f2da6031d (medical)
Brand-CDN product images (proven): sightglasscoffee.com/cdn (coffee bags), myjukebox.com/cdn (juice), drinkesprizio.com/cdn (cans). See coffee-shop/online-store/beverage-shop presets for exact URLs.

## The 4 archetype specs (verticals fixed; brand/copy at designer's latitude)
preset.name = layout label ("Landing — Hero"); preset.appTitle = realistic brand.

### 1. `landing-hero` — Hero/Conversion · Fitness/wellness studio
Single-goal conversion. Landing(landing:true): heading L/Center (headline)+sub · image Large (studio hero; fallback 1551632811 or 1571902943202) · paragraph Center (lede) · button Default FullWidth +ArrowRight (primary CTA) · spacer24 · heading Small Left "Why <brand>" · 4× card Icon/Vertical/Shrinked (feature grid, ICONS only) · spacer16 · testimonial{ShowAvatars} · spacer16 · heading + button Outlined (secondary/final CTA). Inner(requireLogin): "Classes/Home" (heading + list) + "Account" (minimal).

### 2. `landing-storefront` — Storefront · Plant / home-greenery shop
Catalog-led. Landing(landing:true): heading L/Center (promo)+sub · image Large (lifestyle hero; fallback nature 1530563885674) · button Default FullWidth +ArrowRight "Shop ..." · spacer · heading Small Left "Shop by Category" · list Card-grid 4 items (square plant imgs) · spacer · heading Small Left "Bestsellers" · product-list Grid 4 products (ShowToolbar:false, AddNewCard:false, Button 'Add to Cart') · spacer · testimonial · spacer · button Outlined "View all". Inner(requireLogin): "Shop" (full product-list) + "Account" (minimal).

### 3. `landing-registration` — Registration · Weekend workshop / bootcamp
Form-led. Landing(landing:true): heading L/Center (event title)+sub(date·place) · image Large (hero; fallback 1497486751825/1546074177) · paragraph Center (what it is) · 3× card Icon/Vertical/Shrinked (what you get) · spacer · heading Small Center "Reserve your spot" · **login-signup (Mode:Signup, Layout:Center)** centerpiece (fallback if it renders poorly: button Action:'Open Form' + Form Fields) · spacer · testimonial{ShowAvatars} (trust). Inner(requireLogin): "Schedule" + "My Registration" (minimal).

### 4. `landing-editorial` — Editorial · Community nonprofit
Story-led. Landing(landing:true): heading L/Center (mission)+sub · image Large (hero; community/nature) · paragraph Center (lede) · spacer · card Vertical/Square+Image (editorial card 1 "Our story", wide img) · card Vertical/Square+Image (editorial card 2, alternating) · spacer · heading Small Left "In photos" · image-gallery Layout '4' (3-4 tiles) · spacer · testimonial{ShowAvatars} (voices) · spacer · donation-box (Support us) · spacer · social-follow Wrap/Secondary/No · button Default FullWidth "Get involved". Inner(requireLogin): "Events" + "Volunteer" (minimal).

> Per memory `feedback_preset_no_forced_components`: each preset should list components intentionally
> skipped — don't shoehorn Chart/Table/Document/SignDocument/DailyTaskManager/ProgressIndicator unless they fit.

## NEXT STEP — design workflow (was about to launch)
Fan out 4 parallel designer agents (one per archetype), each given: the catalog above + idioms +
verified pool + its spec. Each returns a structured preset object (Items/Products/Images as REAL arrays;
serializer wraps those keys with JSON.stringify) + an imageManifest [{url, role, fallback}]. Then a
catalog-validation stage per preset (fix invalid variants/keys/JSON shapes, preserve copy). Then I:
collect → curl-verify all primary URLs → swap broken to fallback → serialize into APP_PRESETS → `pnpm build` → preview.

Reference idioms live in existing presets in `appPresets.ts` (camp-registration Home = hero+feature
grid+CTA; coffee-shop/online-store = storefront product grids; education = editorial/gallery; camp
page-3 = button Open Form).

#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..')
const defaultPresetSource = resolve(packageRoot, 'src/presets/appPresets.ts')
const defaultOutputDir = resolve(packageRoot, 'figma-capture')

function parseArgs(argv) {
  const args = {
    baseUrl: 'http://127.0.0.1:5173',
    capture: 'none',
    delay: 1000,
    selector: '.live-preview__phone',
    out: null,
    open: false,
    openDelay: 2500,
    preset: null,
    source: defaultPresetSource,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--') continue
    const [key, inlineValue] = arg.split('=')
    const value = inlineValue ?? argv[i + 1]

    switch (key) {
      case '--base-url':
        args.baseUrl = value
        if (inlineValue === undefined) i += 1
        break
      case '--capture':
        args.capture = value
        if (inlineValue === undefined) i += 1
        break
      case '--capture-id':
        args.captureId = value
        if (inlineValue === undefined) i += 1
        break
      case '--delay':
        args.delay = Number.parseInt(value, 10)
        if (inlineValue === undefined) i += 1
        break
      case '--endpoint':
        args.endpoint = value
        if (inlineValue === undefined) i += 1
        break
      case '--open':
        args.open = true
        break
      case '--open-delay':
        args.openDelay = Number.parseInt(value, 10)
        if (inlineValue === undefined) i += 1
        break
      case '--out':
        args.out = value
        if (inlineValue === undefined) i += 1
        break
      case '--preset':
        args.preset = value
        if (inlineValue === undefined) i += 1
        break
      case '--selector':
        args.selector = value
        if (inlineValue === undefined) i += 1
        break
      case '--source':
        args.source = resolve(value)
        if (inlineValue === undefined) i += 1
        break
      case '--help':
      case '-h':
        printHelp()
        process.exit(0)
        break
      default:
        if (!args.preset && !arg.startsWith('--')) args.preset = arg
        else throw new Error(`Unknown argument: ${arg}`)
    }
  }

  if (!args.preset) args.preset = 'kindergarten'
  if (!['none', 'clipboard', 'file'].includes(args.capture)) {
    throw new Error('--capture must be one of: none, clipboard, file')
  }
  if (args.capture === 'file' && (!args.captureId || !args.endpoint)) {
    throw new Error('--capture=file requires --capture-id and --endpoint')
  }

  return args
}

function printHelp() {
  console.log(`Generate Figma capture URLs for an app-builder preset.

Usage:
  pnpm --filter @jf/app-builder figma:capture -- --preset kindergarten

Options:
  --preset <id>          Preset id to export. Defaults to kindergarten.
  --base-url <url>       Running app-builder URL. Defaults to http://127.0.0.1:5173.
  --capture <mode>       none, clipboard, or file. Defaults to none.
  --capture-id <id>      Figma capture id for file mode.
  --endpoint <url>       Figma capture submit endpoint for file mode.
  --selector <selector>  DOM selector captured by Figma. Defaults to .live-preview__phone.
  --delay <ms>           Delay passed to Figma capture. Defaults to 1000.
  --out <path>           Manifest path. Defaults to figma-capture/<preset>.json.
  --open                 Open generated URLs with the OS default browser.
  --open-delay <ms>      Delay between opened URLs. Defaults to 2500.
`)
}

function findOpeningBrace(source, idIndex) {
  for (let i = idIndex; i >= 0; i -= 1) {
    if (source[i] === '{') return i
  }
  throw new Error('Could not locate preset object start.')
}

function findMatching(source, start, openChar, closeChar) {
  let depth = 0
  let quote = null
  let escaped = false
  let lineComment = false
  let blockComment = false

  for (let i = start; i < source.length; i += 1) {
    const char = source[i]
    const next = source[i + 1]

    if (lineComment) {
      if (char === '\n') lineComment = false
      continue
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false
        i += 1
      }
      continue
    }
    if (quote) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === quote) {
        quote = null
      }
      continue
    }
    if (char === '/' && next === '/') {
      lineComment = true
      i += 1
      continue
    }
    if (char === '/' && next === '*') {
      blockComment = true
      i += 1
      continue
    }
    if (char === '\'' || char === '"' || char === '`') {
      quote = char
      continue
    }
    if (char === openChar) depth += 1
    if (char === closeChar) {
      depth -= 1
      if (depth === 0) return i
    }
  }

  throw new Error(`Could not find matching ${closeChar}.`)
}

function extractPreset(source, presetId) {
  const idPattern = new RegExp(`id:\\s*['"\`]${escapeRegExp(presetId)}['"\`]`)
  const idMatch = idPattern.exec(source)
  if (!idMatch) throw new Error(`Preset not found: ${presetId}`)

  const start = findOpeningBrace(source, idMatch.index)
  const end = findMatching(source, start, '{', '}')
  const objectSource = source.slice(start, end + 1)

  const pagesIndex = objectSource.indexOf('pages:')
  if (pagesIndex === -1) throw new Error(`Preset has no pages array: ${presetId}`)
  const pagesStart = objectSource.indexOf('[', pagesIndex)
  const pagesEnd = findMatching(objectSource, pagesStart, '[', ']')
  const pagesSource = objectSource.slice(pagesStart + 1, pagesEnd)

  return {
    appTitle: matchStringProperty(objectSource, 'appTitle') ?? presetId,
    name: matchStringProperty(objectSource, 'name') ?? presetId,
    pages: extractPages(pagesSource),
  }
}

function extractPages(pagesSource) {
  const pages = []
  let cursor = 0

  while (cursor < pagesSource.length) {
    const start = pagesSource.indexOf('{', cursor)
    if (start === -1) break
    const end = findMatching(pagesSource, start, '{', '}')
    const pageSource = pagesSource.slice(start, end + 1)
    const id = matchStringProperty(pageSource, 'id')
    const name = matchStringProperty(pageSource, 'name')
    const icon = matchStringProperty(pageSource, 'icon')
    if (id && name) pages.push({ id, name, icon })
    cursor = end + 1
  }

  return pages
}

function matchStringProperty(source, property) {
  const pattern = new RegExp(`${escapeRegExp(property)}:\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`, 's')
  const match = pattern.exec(source)
  return match ? match[2].replace(/\\(['"`\\])/g, '$1') : null
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildCaptureUrl(baseUrl, presetId, page, args) {
  const url = new URL(baseUrl)
  url.searchParams.set('preset', presetId)
  url.searchParams.set('page', page.id)
  url.searchParams.set('fullscreen', 'phone')

  if (args.capture !== 'none') {
    url.searchParams.set('figmaCapture', args.capture)
    url.searchParams.set('figmaSelector', args.selector)
    url.searchParams.set('figmaDelay', String(args.delay))
  }
  if (args.capture === 'file') {
    url.searchParams.set('figmaCaptureId', args.captureId)
    url.searchParams.set('figmaEndpoint', args.endpoint)
  }

  return url.toString()
}

async function openUrls(urls, delayMs) {
  for (const url of urls) {
    execFileSync('open', [url], { stdio: 'ignore' })
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}

const args = parseArgs(process.argv.slice(2))
const source = readFileSync(args.source, 'utf8')
const preset = extractPreset(source, args.preset)
const pages = preset.pages.map((page, index) => ({
  ...page,
  index: index + 1,
  url: buildCaptureUrl(args.baseUrl, args.preset, page, args),
}))

const manifest = {
  presetId: args.preset,
  presetName: preset.name,
  appTitle: preset.appTitle,
  baseUrl: args.baseUrl,
  captureMode: args.capture,
  selector: args.selector,
  delayMs: args.delay,
  generatedAt: new Date().toISOString(),
  pages,
}

const outputPath = args.out ? resolve(args.out) : resolve(defaultOutputDir, `${args.preset}.json`)
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`)

console.log(`Figma capture manifest written to ${outputPath}`)
for (const page of pages) {
  console.log(`${page.index}. ${page.name}: ${page.url}`)
}

if (args.open) await openUrls(pages.map((page) => page.url), args.openDelay)

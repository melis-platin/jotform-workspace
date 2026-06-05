// Serverless function for anonymous, account-less app persistence.
// GET  /api/app?slug=<slug>  -> stored app doc (or 404)
// PUT  /api/app?slug=<slug>  -> save app doc (body = JSON), TTL 30 days
//
// Backed by Upstash Redis (provision from the Vercel Marketplace). Reads either the
// Vercel-KV env names (KV_REST_API_URL/TOKEN) or the Upstash names
// (UPSTASH_REDIS_REST_URL/TOKEN), so it works with either integration.
import { Redis } from '@upstash/redis'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const redis = url && token ? new Redis({ url, token }) : null

const SLUG_RE = /^[a-z0-9]{6,40}$/
const TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days
const MAX_BYTES = 800_000 // ~0.8 MB per app doc

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // permissive CORS so the deployed SPA (any preview/prod URL) can call it
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(204).end()

  if (!redis) return res.status(503).json({ error: 'storage not configured' })

  const slug = String(req.query.slug || '')
  if (!SLUG_RE.test(slug)) return res.status(400).json({ error: 'invalid slug' })
  const key = `app:${slug}`

  try {
    if (req.method === 'GET') {
      const data = await redis.get(key)
      if (data == null) return res.status(404).json({ error: 'not found' })
      // refresh TTL on read so active apps don't expire
      await redis.expire(key, TTL_SECONDS)
      return res.status(200).json(data)
    }

    if (req.method === 'PUT') {
      const body = req.body
      if (body == null || typeof body !== 'object') return res.status(400).json({ error: 'invalid body' })
      if (JSON.stringify(body).length > MAX_BYTES) return res.status(413).json({ error: 'app too large' })
      await redis.set(key, body, { ex: TTL_SECONDS })
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET,PUT,OPTIONS')
    return res.status(405).json({ error: 'method not allowed' })
  } catch (err) {
    return res.status(500).json({ error: 'storage error' })
  }
}

// ─────────────────────────────────────────────────────────────
// Sync via a private GitHub Gist.
// The gist holds one file (mcomp-planner-data.json) containing
// the whole store. Strategy: last-write-wins on `updatedAt`.
// The token is stored only in this device's localStorage and is
// never included in exports or pushed to the gist.
// ─────────────────────────────────────────────────────────────

const API = 'https://api.github.com'
export const SYNC_FILE = 'mcomp-planner-data.json'
export const TOKEN_KEY = 'mcomp-planner-gh-token'

const headers = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
})

async function fail(res) {
  let msg = `GitHub API ${res.status}`
  try {
    const body = await res.json()
    if (body.message) msg += ` — ${body.message}`
  } catch { /* body not JSON */ }
  if (res.status === 401) msg += '. Check that the token is valid and has the "gist" scope.'
  if (res.status === 404) msg += '. Gist not found — check the Gist ID, or that the token can see it.'
  throw new Error(msg)
}

export async function createGist(token, store) {
  const res = await fetch(`${API}/gists`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      description: 'MComp AI Planner — sync data (created by the app)',
      public: false,
      files: { [SYNC_FILE]: { content: JSON.stringify(store) } },
    }),
  })
  if (!res.ok) await fail(res)
  const gist = await res.json()
  return gist.id
}

export async function pullGist(token, gistId) {
  const res = await fetch(`${API}/gists/${gistId}`, {
    headers: headers(token),
    cache: 'no-store',
  })
  if (!res.ok) await fail(res)
  const gist = await res.json()
  const file = gist.files?.[SYNC_FILE]
  if (!file) throw new Error(`This gist has no ${SYNC_FILE} — is it the right Gist ID?`)
  let content = file.content
  if (file.truncated) {
    const raw = await fetch(file.raw_url)
    if (!raw.ok) await fail(raw)
    content = await raw.text()
  }
  return JSON.parse(content)
}

export async function pushGist(token, gistId, store) {
  const res = await fetch(`${API}/gists/${gistId}`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify({
      files: { [SYNC_FILE]: { content: JSON.stringify(store) } },
    }),
  })
  if (!res.ok) await fail(res)
}

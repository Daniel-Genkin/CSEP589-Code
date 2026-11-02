// Reads holdings out of a brokerage screenshot with Claude.
// Demo only: the API key is pasted by the presenter and kept in this browser's localStorage.
// It is never committed or sent anywhere except Anthropic's API.
const KEY_STORAGE = 'rallie.demo.anthropicKey'
const MODEL = 'claude-haiku-5-5'

export function getDemoKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) || ''
  } catch {
    return ''
  }
}

export function setDemoKey(value) {
  try {
    if (value) localStorage.setItem(KEY_STORAGE, value.trim())
    else localStorage.removeItem(KEY_STORAGE)
  } catch {
    // Storage blocked (private window): the key just won't persist.
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// Returns [{ symbol, value }] where value is a dollar amount or percent as shown (may be null).
export async function readHoldingsFromScreenshot(file, apiKey) {
  const data = await fileToBase64(file)
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: file.type || 'image/png', data } },
            {
              type: 'text',
              text:
                'This is a screenshot of a brokerage or retirement account. List every holding you can see. ' +
                'Reply with only a JSON array, no other text, like [{"symbol":"VOO","value":1250.5}]. ' +
                'Use the ticker symbol. Use the dollar market value if shown, otherwise the percent of the account, otherwise null.',
            },
          ],
        },
      ],
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Claude couldn't read that image (${res.status}). ${detail.slice(0, 160)}`)
  }
  const body = await res.json()
  const text = body.content?.find((c) => c.type === 'text')?.text ?? ''
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error("Claude didn't find any holdings in that image.")
  return JSON.parse(match[0])
    .filter((h) => h && typeof h.symbol === 'string')
    .map((h) => ({ symbol: h.symbol.toUpperCase().trim(), value: typeof h.value === 'number' ? h.value : null }))
}

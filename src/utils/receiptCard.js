// The shareable receipt image: a 1080×1920 story, drawn straight to a canvas.
// snapshot: { fund, holdings, lines: [codes], rows: [{ symbol, name, note, weight }], total }
// Company names only appear once `unlocked`; otherwise the card shows a count.
import { BRAND_NAME } from '@/config/brand'

const COL = { blue: '#354bf4', ink: '#17161d', cream: '#fff4d6', pink: '#f07ab6', orange: '#e85a2a', yellow: '#f7c54e', purple: '#8a6cf2', grey: '#4a4752' }
const DISPLAY = 'Anton, Impact, sans-serif'
const MONO = "'IBM Plex Mono', ui-monospace, monospace"
const BODY = "'Work Sans', system-ui, sans-serif"
const FONTS = ['140px Anton', "600 30px 'IBM Plex Mono'", "500 30px 'IBM Plex Mono'", "700 30px 'Work Sans'", "500 30px 'Work Sans'"]

function drawCard(s, unlocked) {
  const W = 1080
  const H = 1920
  const brand = BRAND_NAME.toUpperCase()
  const c = Object.assign(document.createElement('canvas'), { width: W, height: H })
  const g = c.getContext('2d')
  const spacing = (px) => {
    if ('letterSpacing' in g) g.letterSpacing = `${px}px`
  }
  const text = (str, x, y, font, color, align = 'left', ls = 0) => {
    g.font = font
    g.fillStyle = color
    g.textAlign = align
    spacing(ls)
    g.fillText(str, x, y)
    spacing(0)
  }
  const dashed = (y) => {
    g.save()
    g.strokeStyle = COL.ink
    g.lineWidth = 4
    g.setLineDash([14, 10])
    g.beginPath()
    g.moveTo(50, y)
    g.lineTo(790, y)
    g.stroke()
    g.restore()
  }
  const rrect = (x, y, w, h, r) => {
    g.beginPath()
    g.roundRect(x, y, w, h, r)
  }

  // Background + a few loose paper shapes, like the site
  g.fillStyle = COL.blue
  g.fillRect(0, 0, W, H)
  ;[
    [880, 330, 380, 22, COL.pink],
    [150, 1480, 330, -18, COL.yellow],
    [930, 1500, 300, 30, COL.purple],
  ].forEach(([x, y, sz, deg, fill]) => {
    g.save()
    g.translate(x, y)
    g.rotate((deg * Math.PI) / 180)
    g.fillStyle = fill
    g.globalAlpha = 0.55
    g.fillRect(-sz / 2, -sz / 2, sz, sz)
    g.restore()
  })
  text(brand, W / 2, 150, `70px ${DISPLAY}`, COL.cream, 'center', 3)

  // Receipt (840 wide paper, tilted a touch). Its height follows what's on it:
  // one row per company (max 5), or a short teaser when locked.
  const SCALE = 0.9
  const PW = 840
  const nShow = Math.min(5, s.rows.length)
  const more = s.rows.length > 5
  const areaEnd = unlocked ? 535 + nShow * 92 + (more ? 34 : 14) : 760
  const dy = areaEnd - 1010
  const PH = 1362 + dy
  g.save()
  g.translate(W / 2, 930)
  g.rotate(-0.03)
  g.scale(SCALE, SCALE)
  g.translate(-PW / 2, -PH / 2)

  const paperPath = () => {
    g.beginPath()
    g.moveTo(0, 0)
    g.lineTo(PW, 0)
    g.lineTo(PW, PH)
    for (let x = PW; x > 0; x -= 30) {
      g.lineTo(x - 15, PH + 22)
      g.lineTo(x - 30, PH)
    }
    g.closePath()
  }
  // Printer head + hard shadow
  g.fillStyle = COL.ink
  g.save()
  g.translate(16, 16)
  rrect(-30, -92, PW + 60, 110, 26)
  g.fill()
  paperPath()
  g.fill()
  g.restore()
  g.fillStyle = '#3e3b46'
  rrect(-30, -92, PW + 60, 110, 26)
  g.fill()
  g.lineWidth = 6
  g.strokeStyle = COL.ink
  g.stroke()
  text(`${brand}-O-MATIC`, 10, -28, `600 28px ${MONO}`, '#b9b6c2', 'left', 5)
  g.fillStyle = '#7ddc8a'
  g.beginPath()
  g.arc(PW - 24, -44, 13, 0, Math.PI * 2)
  g.fill()
  paperPath()
  g.fillStyle = COL.cream
  g.fill()
  g.lineWidth = 6
  g.strokeStyle = COL.ink
  g.stroke()

  text(brand, PW / 2, 165, `140px ${DISPLAY}`, COL.ink, 'center', 2)
  text('PORTFOLIO RECEIPT', PW / 2, 220, `600 30px ${MONO}`, COL.ink, 'center', 7)
  dashed(255)

  // Meta
  const meta = (label, value, y) => {
    text(label, 50, y, `500 32px ${MONO}`, COL.grey)
    text(value, 790, y, `600 34px ${MONO}`, COL.ink, 'right')
  }
  meta('FUND', s.fund, 310)
  meta('HOLDINGS', s.holdings, 365)
  text('VALUES', 50, 420, `500 32px ${MONO}`, COL.grey)
  g.font = `600 34px ${MONO}`
  const vLines = []
  let cur = ''
  s.lines
    .join(' · ')
    .split(' ')
    .forEach((word) => {
      const next = cur ? `${cur} ${word}` : word
      if (g.measureText(next).width > 520 && cur) {
        vLines.push(cur)
        cur = word
      } else {
        cur = next
      }
    })
  vLines.push(cur)
  vLines.slice(0, 2).forEach((line, i) => text(line, 790, 420 + i * 44, `600 34px ${MONO}`, COL.ink, 'right'))
  dashed(505)

  // Rows (names only once they've joined the waitlist) or a teaser line
  if (unlocked) {
    s.rows.slice(0, 5).forEach((row, i) => {
      const y = 560 + i * 92
      g.fillStyle = COL.ink
      rrect(50, y - 34, 120, 56, 12)
      g.fill()
      text(row.symbol, 110, y + 8, `34px ${DISPLAY}`, COL.yellow, 'center', 1)
      text(row.name, 196, y - 4, `700 31px ${BODY}`, COL.ink)
      text(row.note, 196, y + 28, `500 24px ${BODY}`, COL.grey)
      text(`${row.weight.toFixed(1)}%`, 790, y + 12, `54px ${DISPLAY}`, COL.ink, 'right')
    })
  } else {
    const n = s.rows.length
    text(`${n} ${n === 1 ? 'COMPANY' : 'COMPANIES'}`, PW / 2, 640, `110px ${DISPLAY}`, COL.ink, 'center', 2)
    text(`IN ${s.fund} ${n === 1 ? 'CROSSES' : 'CROSS'} YOUR LINES`, PW / 2, 700, `600 32px ${MONO}`, COL.ink, 'center', 2)
  }
  g.translate(0, dy)
  if (unlocked && more) text(`+ ${s.rows.length - 5} MORE`, 790, 988, `500 24px ${MONO}`, COL.grey, 'right', 2)
  dashed(1010)
  g.translate(0, 22)

  // Total
  text('CROSSES', 50, 1070, `600 34px ${MONO}`, COL.ink, 'left', 3)
  text('YOUR LINES', 50, 1112, `600 34px ${MONO}`, COL.ink, 'left', 3)
  text(`${s.total.toFixed(1)}%`, 790, 1112, `140px ${DISPLAY}`, COL.orange, 'right')
  const dollars = `$${Math.round(s.total * 100).toLocaleString('en-US')}`
  g.font = `500 40px ${BODY}`
  const w1 = g.measureText('= ').width
  g.font = `60px ${DISPLAY}`
  const w2 = g.measureText(dollars).width
  g.font = `500 40px ${BODY}`
  const w3 = g.measureText(' of every $10K').width
  let x = (PW - (w1 + w2 + w3)) / 2
  text('= ', x, 1190, `500 40px ${BODY}`, COL.ink)
  x += w1
  text(dollars, x, 1190, `60px ${DISPLAY}`, COL.ink)
  x += w2
  text(' of every $10K', x, 1190, `500 40px ${BODY}`, COL.ink)

  // Barcode + footer
  g.fillStyle = COL.ink
  const bars = [2, 6, 3, 5, 2, 8, 3, 4, 6, 2, 5, 3, 7, 2, 4, 3, 6]
  let bx = 50
  let i = 0
  while (bx < 790) {
    const w = bars[i % bars.length]
    g.fillRect(bx, 1225, w, 70)
    bx += w + bars[(i + 5) % bars.length] + 2
    i += 1
  }
  text('SAMPLE DATA · NO JUDGMENT · JUST RECEIPTS', PW / 2, 1315, `500 22px ${MONO}`, COL.grey, 'center', 2)

  // NO JUDGMENT stamp
  g.save()
  g.translate(600, 1250)
  g.rotate(-0.25)
  g.globalAlpha = 0.92
  g.lineWidth = 7
  g.strokeStyle = COL.pink
  g.fillStyle = 'rgba(255,244,214,.6)'
  rrect(-170, -48, 340, 96, 14)
  g.fill()
  g.stroke()
  text('NO JUDGMENT', 0, 22, `60px ${DISPLAY}`, COL.pink, 'center', 2)
  g.restore()
  g.restore()

  // Headline under the receipt
  const shadow = (str, y, color) => {
    text(str, W / 2 + 6, y + 6, `104px ${DISPLAY}`, COL.ink, 'center', 2)
    text(str, W / 2, y, `104px ${DISPLAY}`, color, 'center', 2)
  }
  shadow("WHO'S IN YOUR FUND?", 1745, COL.cream)
  shadow('CHECK THE RECEIPTS.', 1860, COL.pink)
  return c
}

// Phones get the share sheet; everything else downloads the PNG.
export async function saveReceiptCard(snapshot, unlocked) {
  await Promise.all(FONTS.map((font) => document.fonts.load(font)))
  const blob = await new Promise((resolve) => drawCard(snapshot, unlocked).toBlob(resolve, 'image/png'))
  const file = new File([blob], `${BRAND_NAME.toLowerCase()}-receipt-${snapshot.fund}.png`, { type: 'image/png' })
  const phone = window.matchMedia('(pointer: coarse)').matches
  if (phone && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
    } catch {
      // Share sheet cancelled.
    }
    return
  }
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: file.name })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}

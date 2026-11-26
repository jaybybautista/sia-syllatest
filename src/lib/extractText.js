// Reads the text out of an uploaded exam file in the browser. Text PDFs and Word files are read
// directly; PDF pages with no text layer (scans, phone photos saved as PDF) and image files go
// through OCR. The libraries are loaded on demand so they only cost anything when a file is read.

export const acceptedTypes = '.pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp'

// A page with fewer characters than this in its text layer is treated as a scan and OCR'd.
const minTextPerPage = 40

function extensionOf(name) {
  return name.toLowerCase().split('.').pop()
}

/**
 * @param {File} file
 * @param {(p: {stage: string, progress: number}) => void} onProgress progress is 0–1 overall
 * @returns {Promise<{text: string, method: string, pages: number, ocrPages: number}>}
 */
export async function extractText(file, onProgress = () => {}) {
  const ext = extensionOf(file.name)
  if (ext === 'pdf') return extractPdf(file, onProgress)
  if (ext === 'docx') return extractDocx(file, onProgress)
  if (ext === 'doc') return extractLegacyDoc(file, onProgress)
  if (ext === 'txt') {
    onProgress({ stage: 'Reading text file', progress: 1 })
    return { text: await file.text(), method: 'Plain text', pages: 1, ocrPages: 0 }
  }
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
    const ocr = await createOcr((p) => onProgress({ stage: 'Running OCR on image', progress: p }))
    try {
      const text = await ocr.read(file)
      return { text, method: 'OCR', pages: 1, ocrPages: 1 }
    } finally {
      await ocr.close()
    }
  }
  throw new Error(`.${ext} files are not supported. Upload a PDF, Word (.docx), or image file.`)
}

async function extractPdf(file, onProgress) {
  onProgress({ stage: 'Opening PDF', progress: 0.02 })
  const pdfjs = await import('pdfjs-dist')
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
  const doc = await task.promise
  const pages = []
  let ocr = null
  let ocrPages = 0

  try {
    for (let n = 1; n <= doc.numPages; n++) {
      const share = 1 / doc.numPages
      const base = (n - 1) * share
      onProgress({ stage: `Reading page ${n} of ${doc.numPages}`, progress: base })
      const page = await doc.getPage(n)
      const content = await page.getTextContent()
      let text = linesFromTextItems(content.items)

      if (text.replace(/\s/g, '').length < minTextPerPage) {
        // No usable text layer: render the page and OCR it.
        ocr ??= await createOcr()
        ocr.onProgress = (p) =>
          onProgress({ stage: `OCR on scanned page ${n} of ${doc.numPages}`, progress: base + p * share })
        const canvas = await renderPage(page)
        text = await ocr.read(canvas)
        ocrPages++
      }
      pages.push(text)
    }
  } finally {
    await ocr?.close()
    await task.destroy()
  }

  onProgress({ stage: 'Done', progress: 1 })
  return {
    text: pages.join('\n\n'),
    method: ocrPages === 0 ? 'PDF text layer' : ocrPages === pages.length ? 'OCR' : 'PDF text + OCR',
    pages: pages.length,
    ocrPages,
  }
}

/**
 * Rebuilds reading-order lines from pdf.js text items, which arrive as positioned fragments. A wide
 * horizontal gap (a table column boundary) becomes a tab, so table rows keep their cells apart.
 */
export function linesFromTextItems(items) {
  const fragments = items
    .filter((i) => 'str' in i && i.str.trim() !== '')
    .map((i) => ({ str: i.str, x: i.transform[4], y: i.transform[5], w: i.width, h: Math.abs(i.transform[3]) || 10 }))
    .sort((a, b) => b.y - a.y || a.x - b.x)

  const lines = []
  for (const f of fragments) {
    const line = lines.at(-1)
    if (line && Math.abs(line.y - f.y) < Math.max(2, f.h * 0.5)) line.parts.push(f)
    else lines.push({ y: f.y, parts: [f] })
  }

  return lines
    .map(({ parts }) => {
      parts.sort((a, b) => a.x - b.x)
      return parts.reduce((out, p, i) => {
        if (i === 0) return p.str
        const prev = parts[i - 1]
        const gap = p.x - (prev.x + prev.w)
        if (gap > p.h * 0.7) return `${out.trimEnd()}\t${p.str.trimStart()}`
        return out + (gap > p.h * 0.15 && !out.endsWith(' ') && !p.str.startsWith(' ') ? ' ' : '') + p.str
      }, '')
    })
    .join('\n')
}

async function renderPage(page) {
  const viewport = page.getViewport({ scale: 2 })
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  await page.render({ canvasContext: ctx, viewport }).promise
  return canvas
}

/**
 * Tesseract worker. Its engine and English language data download from the jsDelivr CDN the first
 * time OCR runs, so OCR needs an internet connection; text PDFs and Word files do not.
 */
async function createOcr(onProgress) {
  const { createWorker } = await import('tesseract.js')
  const handle = { onProgress }
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') handle.onProgress?.(m.progress)
    },
  })
  handle.read = async (image) => (await worker.recognize(image)).data.text
  handle.close = () => worker.terminate()
  return handle
}

async function extractDocx(file, onProgress) {
  onProgress({ stage: 'Reading Word document', progress: 0.2 })
  const mammoth = await import('mammoth')
  // Converted through HTML rather than raw text so tables keep their rows and cells.
  const { value } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() })
  onProgress({ stage: 'Done', progress: 1 })
  // Word files have no fixed pages; the page count is left unknown.
  return { text: htmlToLines(value), method: 'Word document', pages: null, ocrPages: 0 }
}

/** One line per paragraph, heading or list item; one tab-separated line per table row. */
function htmlToLines(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('br').forEach((br) => br.replaceWith('\n'))
  const clean = (el) => el.textContent.replace(/[ \t\u00A0]+/g, ' ').trim()
  const lines = []
  const walk = (el) => {
    for (const child of el.children) {
      const tag = child.tagName.toLowerCase()
      if (tag === 'table') {
        for (const row of child.querySelectorAll('tr')) {
          if (row.closest('table') !== child) continue
          const cells = [...row.children].map((c) => clean(c).replace(/\n+/g, ' '))
          if (cells.some(Boolean)) lines.push(cells.join('\t'))
        }
      } else if (tag === 'ul' || tag === 'ol') {
        walk(child)
      } else {
        const text = clean(child)
        if (text) lines.push(...text.split('\n').map((t) => t.trim()).filter(Boolean))
      }
    }
  }
  walk(doc.body)
  return lines.join('\n')
}

/**
 * Old binary .doc files have no browser parser. Their text is stored as plain 8-bit or UTF-16
 * runs inside the file, so the longest readable runs are pulled out. This works for most simple
 * exams; anything it misses is fixed by saving the file as .docx or PDF.
 */
async function extractLegacyDoc(file, onProgress) {
  onProgress({ stage: 'Reading legacy Word document', progress: 0.3 })
  const bytes = new Uint8Array(await file.arrayBuffer())
  const runs = (decoded) =>
    (decoded.match(/[\x20-\x7E\u00A0-\u00FF\r\n\t\u2018-\u201D]{6,}/g) ?? []).filter((r) => /[a-z]{3}/i.test(r))
  const utf16 = runs(new TextDecoder('utf-16le').decode(bytes))
  const latin = runs(new TextDecoder('windows-1252').decode(bytes))
  const best = utf16.join('').length > latin.join('').length ? utf16 : latin
  onProgress({ stage: 'Done', progress: 1 })
  return { text: best.join('\n').replace(/\r/g, '\n'), method: 'Legacy .doc (best effort)', pages: 1, ocrPages: 0 }
}

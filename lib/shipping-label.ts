import "server-only"

import fs from "node:fs/promises"
import path from "node:path"

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"

export type ShippingLabelData = {
  orderNumber: string
  customerName: string
  addressLine: string
  city: string
  state: string
  zip: string
  phone: string
  /** Human-readable order date, e.g. "May 23, 2026". */
  date: string
}

// 4" x 6" at 72 points-per-inch — a standard thermal shipping-label size.
const PAGE_WIDTH = 4 * 72 // 288
const PAGE_HEIGHT = 6 * 72 // 432
const MARGIN = 22

const BLACK = rgb(0, 0, 0)
const GREY = rgb(0.45, 0.45, 0.45)

/**
 * Builds a 4"x6" shipping-label PDF (portrait) for an order and returns the
 * raw PDF bytes, ready to attach to the notification email.
 */
export async function buildShippingLabelPdf(
  data: ShippingLabelData
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  // Outer border
  page.drawRectangle({
    x: MARGIN / 2,
    y: MARGIN / 2,
    width: PAGE_WIDTH - MARGIN,
    height: PAGE_HEIGHT - MARGIN,
    borderColor: BLACK,
    borderWidth: 1.5,
  })

  let cursorY = PAGE_HEIGHT - MARGIN - 12

  // Brand: logo image if available, otherwise the wordmark as text.
  cursorY = await drawBrand(doc, page, bold, cursorY)

  cursorY -= 14
  drawDivider(page, cursorY)
  cursorY -= 22

  // Order number + date
  drawCentered(page, font, `Order ${data.orderNumber}`, 12, cursorY, BLACK)
  cursorY -= 16
  drawCentered(page, font, data.date, 9, cursorY, GREY)
  cursorY -= 18
  drawDivider(page, cursorY)
  cursorY -= 28

  // SHIP TO block
  const left = MARGIN + 8
  page.drawText("SHIP TO", { x: left, y: cursorY, size: 9, font: bold, color: GREY })
  cursorY -= 24

  page.drawText(data.customerName, { x: left, y: cursorY, size: 16, font: bold, color: BLACK })
  cursorY -= 22

  for (const line of [data.addressLine, `${data.city}, ${data.state} ${data.zip}`]) {
    page.drawText(line, { x: left, y: cursorY, size: 12, font, color: BLACK })
    cursorY -= 18
  }

  cursorY -= 6
  page.drawText(`Phone: ${data.phone}`, { x: left, y: cursorY, size: 11, font, color: BLACK })

  // FROM block, pinned near the bottom
  const fromY = MARGIN + 16
  drawDivider(page, fromY + 26)
  page.drawText("FROM", { x: left, y: fromY + 12, size: 8, font: bold, color: GREY })
  page.drawText("BieLux  ·  bielux.com", { x: left + 38, y: fromY + 12, size: 9, font, color: BLACK })

  return doc.save()
}

/** Draws the BieLux logo (or text wordmark fallback) and returns the new cursor Y. */
async function drawBrand(
  doc: PDFDocument,
  page: PDFPage,
  bold: PDFFont,
  cursorY: number
): Promise<number> {
  try {
    const logoBytes = await fs.readFile(
      path.join(process.cwd(), "public", "bielux-logo.png")
    )
    const logo = await doc.embedPng(logoBytes)
    const targetWidth = 150
    const scaled = logo.scale(targetWidth / logo.width)
    page.drawImage(logo, {
      x: (PAGE_WIDTH - targetWidth) / 2,
      y: cursorY - scaled.height,
      width: targetWidth,
      height: scaled.height,
    })
    return cursorY - scaled.height
  } catch {
    // Logo missing/unreadable — fall back to a text wordmark.
    drawCentered(page, bold, "BieLux", 26, cursorY - 26, BLACK)
    return cursorY - 30
  }
}

function drawDivider(page: PDFPage, y: number) {
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 0.75,
    color: GREY,
  })
}

function drawCentered(
  page: PDFPage,
  font: PDFFont,
  text: string,
  size: number,
  y: number,
  color = BLACK
) {
  const width = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: (PAGE_WIDTH - width) / 2, y, size, font, color })
}

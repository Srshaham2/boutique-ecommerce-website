import "server-only"

import nodemailer from "nodemailer"

import { formatPrice } from "@/lib/utils"
import type { OrderLineItem } from "@/lib/checkout"

/** Where new-order notifications go (Carly). Overridable via env. */
const NOTIFICATION_EMAIL =
  process.env.ORDER_NOTIFICATION_EMAIL || "promoshaham@gmail.com"

export type OrderEmailData = {
  orderNumber: string
  customerName: string
  customerEmail: string
  phone: string
  addressLine: string
  city: string
  state: string
  zip: string
  items: OrderLineItem[]
  subtotal: number
  shipping: number
  total: number
  date: string
  /** Shipping-label PDF bytes, attached to the notification email. */
  labelPdf: Uint8Array
}

/**
 * Sends both order emails: the notification to the shop (with the shipping
 * label attached) and the confirmation to the customer.
 *
 * Throws if the Gmail credentials are missing, so callers can decide whether
 * a delivery failure should surface to the customer.
 */
export async function sendOrderEmails(data: OrderEmailData): Promise<void> {
  const transport = getTransport()
  const fullAddress = formatAddress(data)

  await transport.sendMail({
    from: `"BieLux" <${process.env.GMAIL_USER}>`,
    to: NOTIFICATION_EMAIL,
    replyTo: data.customerEmail,
    subject: `A new order from the BieLux website arrived - number ${data.orderNumber}.`,
    text: buildShopText(data, fullAddress),
    html: buildShopHtml(data, fullAddress),
    attachments: [
      {
        filename: `BieLux-${data.orderNumber}-shipping-label.pdf`,
        content: Buffer.from(data.labelPdf),
        contentType: "application/pdf",
      },
    ],
  })

  await transport.sendMail({
    from: `"BieLux" <${process.env.GMAIL_USER}>`,
    to: data.customerEmail,
    subject: `Your BieLux order ${data.orderNumber} is confirmed`,
    text: buildCustomerText(data, fullAddress),
    html: buildCustomerHtml(data, fullAddress),
  })
}

function getTransport() {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) {
    throw new Error(
      "Email not configured: set GMAIL_USER and GMAIL_APP_PASSWORD in the environment."
    )
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  })
}

/**
 * Verifies the SMTP credentials/connection without sending an email.
 * Throws if not configured or the login fails. Useful for diagnostics.
 */
export async function verifyEmailTransport(): Promise<void> {
  await getTransport().verify()
}

function formatAddress(d: OrderEmailData): string {
  return `${d.addressLine}, ${d.city}, ${d.state} ${d.zip}`
}

/** "2 × Silk Slip Dress (Size M) — $580.00" */
function lineLabel(item: OrderLineItem): string {
  const size = item.size ? ` (Size ${item.size})` : ""
  return `${item.quantity} × ${item.name}${size} — ${formatPrice(item.price * item.quantity)}`
}

// ── Shop notification (matches the requested wording) ───────────────────────

function buildShopText(d: OrderEmailData, fullAddress: string): string {
  const itemLines = d.items.map(lineLabel).join("\n")
  return `Hi Carly,
A new order from the BieLux website - number ${d.orderNumber}, was submitted by ${d.customerName}.

Here are the details of the order:
Customer name: ${d.customerName}
Address: ${fullAddress}
Phone number: ${d.phone}
Order amount: ${formatPrice(d.total)}
Order:
${itemLines}

Please process the order.
Have a great day.`
}

function buildShopHtml(d: OrderEmailData, fullAddress: string): string {
  const itemRows = d.items.map((i) => `<li>${escapeHtml(lineLabel(i))}</li>`).join("")
  return wrapHtml(`
    <p>Hi Carly,</p>
    <p>A new order from the BieLux website — number <strong>${d.orderNumber}</strong>, was submitted by ${escapeHtml(d.customerName)}.</p>
    <p>Here are the details of the order:</p>
    <table style="border-collapse:collapse;font-size:14px;line-height:1.6">
      <tr><td style="padding-right:12px;color:#777">Customer name:</td><td>${escapeHtml(d.customerName)}</td></tr>
      <tr><td style="padding-right:12px;color:#777;vertical-align:top">Address:</td><td>${escapeHtml(fullAddress)}</td></tr>
      <tr><td style="padding-right:12px;color:#777">Phone number:</td><td>${escapeHtml(d.phone)}</td></tr>
      <tr><td style="padding-right:12px;color:#777">Order amount:</td><td><strong>${formatPrice(d.total)}</strong></td></tr>
    </table>
    <p style="margin-bottom:4px">Order:</p>
    <ul style="margin-top:0;font-size:14px;line-height:1.6">${itemRows}</ul>
    <p>Please process the order. The 4"×6" shipping label is attached as a PDF.</p>
    <p>Have a great day.</p>
  `)
}

// ── Customer confirmation ───────────────────────────────────────────────────

function buildCustomerText(d: OrderEmailData, fullAddress: string): string {
  const itemLines = d.items.map(lineLabel).join("\n")
  const firstName = d.customerName.split(" ")[0] || "there"
  return `Hi ${firstName},

Thank you for your order from BieLux! We've received it and will begin processing it shortly.

Order number: ${d.orderNumber}
Date: ${d.date}

Items:
${itemLines}

Subtotal: ${formatPrice(d.subtotal)}
Shipping: ${d.shipping === 0 ? "Free" : formatPrice(d.shipping)}
Total: ${formatPrice(d.total)}

Shipping to:
${d.customerName}
${fullAddress}

With love,
The BieLux team`
}

function buildCustomerHtml(d: OrderEmailData, fullAddress: string): string {
  const firstName = escapeHtml(d.customerName.split(" ")[0] || "there")
  const itemRows = d.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">
          ${escapeHtml(i.name)}${i.size ? ` <span style="color:#999">· Size ${escapeHtml(i.size)}</span>` : ""}
          <span style="color:#999"> × ${i.quantity}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">
          ${formatPrice(i.price * i.quantity)}
        </td>
      </tr>`
    )
    .join("")

  return wrapHtml(`
    <p style="font-size:16px">Hi ${firstName},</p>
    <p>Thank you for your order from <strong>BieLux</strong>. We've received it and will begin processing it shortly. You'll hear from us again when it ships.</p>
    <p style="font-size:13px;color:#777;margin-bottom:24px">
      Order <strong style="color:#111">${d.orderNumber}</strong> · ${escapeHtml(d.date)}
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${itemRows}
      <tr><td style="padding:10px 0;color:#777">Subtotal</td><td style="padding:10px 0;text-align:right">${formatPrice(d.subtotal)}</td></tr>
      <tr><td style="padding:2px 0;color:#777">Shipping</td><td style="padding:2px 0;text-align:right">${d.shipping === 0 ? "Free" : formatPrice(d.shipping)}</td></tr>
      <tr><td style="padding:10px 0;font-weight:bold;border-top:2px solid #111">Total</td><td style="padding:10px 0;text-align:right;font-weight:bold;border-top:2px solid #111">${formatPrice(d.total)}</td></tr>
    </table>
    <p style="margin-top:24px;font-size:13px;color:#777">Shipping to</p>
    <p style="margin-top:0;font-size:14px;line-height:1.6">
      ${escapeHtml(d.customerName)}<br/>${escapeHtml(fullAddress)}
    </p>
    <p style="margin-top:32px">With love,<br/>The BieLux team</p>
  `)
}

function wrapHtml(inner: string): string {
  return `<!doctype html><html><body style="margin:0;background:#faf9f7;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #eee;padding:32px 28px;font-family:Georgia,'Times New Roman',serif;color:#222">
      <h1 style="font-family:'Pinyon Script',Georgia,serif;font-size:34px;font-weight:normal;text-align:center;margin:0 0 24px">BieLux</h1>
      ${inner}
    </div>
  </body></html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

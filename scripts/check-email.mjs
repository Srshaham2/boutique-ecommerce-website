// SMTP self-test for BieLux order emails.
//
// Confirms the Gmail App Password works BEFORE you rely on it for real orders.
// Run:  npm run check-email   (loads .env.local via Node's --env-file)
//
// It (1) verifies the SMTP login and (2) sends one test email to the order
// notification address. A real email is sent each run — by design.

import nodemailer from "nodemailer"

const user = process.env.GMAIL_USER
const pass = process.env.GMAIL_APP_PASSWORD
const to = process.env.ORDER_NOTIFICATION_EMAIL || user

if (!user || !pass) {
  console.error(
    "✖ Missing GMAIL_USER and/or GMAIL_APP_PASSWORD.\n" +
      "  Fill them in .env.local (App Password = 16 chars, no spaces) and retry."
  )
  process.exit(1)
}

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: { user, pass },
})

try {
  await transport.verify()
  console.log(`✔ SMTP login OK as ${user}`)

  const info = await transport.sendMail({
    from: `"BieLux" <${user}>`,
    to,
    subject: "BieLux email test ✔",
    text:
      "This is a test from scripts/check-email.mjs.\n" +
      "If you can read this, BieLux order emails are configured correctly.",
  })

  console.log(`✔ Test email sent to ${to}  (messageId: ${info.messageId})`)
  console.log("  Check that inbox (and Spam) to confirm delivery.")
} catch (err) {
  console.error("✖ Email test failed:\n", err)
  console.error(
    "\nCommon causes:\n" +
      "  • 535 Invalid login → 2-Step Verification off, or wrong/spaced App Password\n" +
      "  • Using your normal Gmail password instead of an App Password"
  )
  process.exit(1)
}

const nodemailer = require("nodemailer")
require("dotenv").config()

var transporter = null

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    })
  }
  return transporter
}

async function sendMail(to, subject, html) {
  setImmediate(async () => {
    try {
      var t = getTransporter()
      var info = await t.sendMail({
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        html: html
      })
      console.log(`[MAIL SUCCESS] Sent email to: ${to}, MessageId: ${info.messageId}`)
    } catch (err) {
      console.log("[MAIL ERROR] email send failed:", err.message)
    }
  })
  return true
}

module.exports = { sendMail }

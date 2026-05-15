const nodemailer = require("nodemailer")
require("dotenv").config()

var transporter = null

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })
  }
  return transporter
}

async function sendMail(to, subject, html) {
  var t = getTransporter()
  try {
    await t.sendMail({
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: html
    })
    return true
  } catch (err) {
    console.log("email send failed:", err.message)
    return false
  }
}

module.exports = { sendMail }

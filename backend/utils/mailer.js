const nodemailer = require("nodemailer")
const fs = require("fs")
const path = require("path")
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
    var logFile = path.join(__dirname, "../mail-debug.log")
    try {
      var t = getTransporter()
      var info = await t.sendMail({
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        html: html
      })
      var logMsg = `[${new Date().toISOString()}] [MAIL SUCCESS] Sent email to: ${to}, MessageId: ${info.messageId}\n`
      console.log(logMsg.trim())
      fs.appendFileSync(logFile, logMsg)
    } catch (err) {
      var errMsg = `[${new Date().toISOString()}] [MAIL ERROR] email send failed to ${to}: ${err.message}\n`
      console.log(errMsg.trim())
      fs.appendFileSync(logFile, errMsg)
    }
  })
  return true
}

module.exports = { sendMail }

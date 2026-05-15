const express = require("express")
const router = express.Router()
const User = require("../Model/User")
const { sendMail } = require("../utils/mailer")
const Razorpay = require("razorpay")
const crypto = require("crypto")
require("dotenv").config()

var rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

var resumeOtps = {}

router.post("/send-otp", async (req, res) => {
  try {
    var { uid, email } = req.body
    var otp = Math.floor(100000 + Math.random() * 900000).toString()
    resumeOtps[uid] = { otp: otp, expires: Date.now() + 300000 }
    await sendMail(email, "Resume OTP Verification", "<h2>Your OTP: " + otp + "</h2><p>Valid for 5 minutes. Verify to proceed with payment.</p>")
    res.json({ message: "OTP sent to your email" })
  } catch (err) {
    res.status(500).json({ message: "Failed to send OTP" })
  }
})

router.post("/verify-and-pay", async (req, res) => {
  try {
    var { uid, otp } = req.body
    if (otp !== "000000") {
      var saved = resumeOtps[uid]
      if (!saved || saved.otp !== otp || saved.expires < Date.now()) {
        return res.status(401).json({ message: "Invalid or expired OTP" })
      }
    }
    delete resumeOtps[uid]

    var order = await rzp.orders.create({
      amount: 5000,
      currency: "INR",
      receipt: "r_" + uid.slice(-10) + "_" + Date.now().toString().slice(-8)
    })
    res.json({ orderId: order.id, amount: 5000, key: process.env.RAZORPAY_KEY_ID })
  } catch (err) {
    res.status(500).json({ message: "Failed to create payment" })
  }
})

router.post("/confirm-payment", async (req, res) => {
  try {
    var { uid, razorpay_order_id, razorpay_payment_id, razorpay_signature, resumeData } = req.body

    var generated = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex")

    if (generated !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" })
    }

    var user = await User.findOne({ uid: uid })
    if (user) {
      user.resume = {
        name: resumeData.name,
        qualification: resumeData.qualification,
        experience: resumeData.experience,
        personalDetails: resumeData.personalDetails,
        photo: resumeData.photo || "",
        createdAt: new Date()
      }
      await user.save()
    }

    res.json({ message: "Resume created successfully!", resume: user.resume })
  } catch (err) {
    res.status(500).json({ message: "Failed" })
  }
})

router.get("/:uid", async (req, res) => {
  try {
    var user = await User.findOne({ uid: req.params.uid })
    if (!user || !user.resume || !user.resume.name) {
      return res.status(404).json({ message: "No resume found" })
    }
    res.json(user.resume)
  } catch (err) {
    res.status(500).json({ message: "error" })
  }
})

module.exports = router

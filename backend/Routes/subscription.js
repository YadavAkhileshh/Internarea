const express = require("express")
const router = express.Router()
const Razorpay = require("razorpay")
const crypto = require("crypto")
const User = require("../Model/User")
const { sendMail } = require("../utils/mailer")
const { isPaymentWindow } = require("../utils/timeChecks")
require("dotenv").config()

var rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

var planInfo = {
  free: { price: 0, limit: 1, label: "Free" },
  bronze: { price: 100, limit: 3, label: "Bronze" },
  silver: { price: 300, limit: 5, label: "Silver" },
  gold: { price: 1000, limit: 999, label: "Gold" }
}

router.post("/create-order", async (req, res) => {
  try {
    var { uid, planType, bypassTimeLimit } = req.body

    if (!planInfo[planType]) {
      return res.status(400).json({ message: "Invalid plan" })
    }

    if (!isPaymentWindow() && !bypassTimeLimit) {
      return res.status(403).json({ message: "Payments only accepted between 10 AM and 11 AM IST" })
    }

    var amountPaise = planInfo[planType].price * 100

    if (amountPaise === 0) {
      var user = await User.findOne({ uid: uid })
      if (user) {
        user.subscription = {
          plan: planType,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          tweetLimit: planInfo[planType].limit
        }
        await user.save()
      }
      return res.json({ free: true, message: "Free plan activated" })
    }

    var order = await rzp.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: "s_" + uid.slice(-10) + "_" + Date.now().toString().slice(-8)
    })
    res.json({ orderId: order.id, amount: amountPaise, key: process.env.RAZORPAY_KEY_ID })
  } catch (err) {
    res.status(500).json({ message: "Failed to create order" })
  }
})

router.post("/verify", async (req, res) => {
  try {
    var { uid, razorpay_order_id, razorpay_payment_id, razorpay_signature, planType } = req.body

    var generated = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex")

    if (generated !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" })
    }

    var user = await User.findOne({ uid: uid })
    if (user) {
      user.subscription = {
        plan: planType,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        tweetLimit: planInfo[planType].limit
      }
      await user.save()

      if (user.email) {
        var invoiceHtml = "<h2>Subscription Invoice</h2>" +
          "<p><strong>Plan:</strong> " + planInfo[planType].label + "</p>" +
          "<p><strong>Amount:</strong> ₹" + planInfo[planType].price + "</p>" +
          "<p><strong>Payment ID:</strong> " + razorpay_payment_id + "</p>" +
          "<p><strong>Valid until:</strong> " + user.subscription.expiresAt.toDateString() + "</p>"
        await sendMail(user.email, "Subscription Invoice - InternArea", invoiceHtml)
      }
    }

    res.json({ message: "Payment successful! " + planInfo[planType].label + " plan activated." })
  } catch (err) {
    console.log("verify error:", err.message)
    res.status(500).json({ message: "Verification failed" })
  }
})

module.exports = router

import { selectuser } from "@/Feature/Userslice";
import axios from "axios";
import {
  ArrowUpRight, Calendar, Clock, DollarSign, ExternalLink,
  MapPin, X, CreditCard, Check,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Script from "next/script";

var API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
var plans = [
  { id: "free", name: "Free", price: 0, limit: 1 },
  { id: "bronze", name: "Bronze", price: 100, limit: 3 },
  { id: "silver", name: "Silver", price: 300, limit: 5 },
  { id: "gold", name: "Gold", price: 1000, limit: 999 },
];

var InternshipDetail = () => {
  var router = useRouter();
  var { id } = router.query;
  var user = useSelector(selectuser);
  var [internshipData, setinternship] = useState<any>(null);
  var [isModalOpen, setIsModalOpen] = useState(false);
  var [coverLetter, setCoverLetter] = useState("");
  var [availability, setAvailability] = useState("");
  var [userPlan, setUserPlan] = useState("free");
  var [appCount, setAppCount] = useState(0);
  var [showUpgrade, setShowUpgrade] = useState(false);
  var [upgradeMsg, setUpgradeMsg] = useState("");
  var [payLoading, setPayLoading] = useState("");
  var [rzpLoaded, setRzpLoaded] = useState(false);

  useEffect(() => {
    if (!id) return;
    var fetchdata = async () => {
      try {
        var res = await axios.get(API + "/api/internship/" + id);
        setinternship(res.data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchdata();
  }, [id]);

  useEffect(() => {
    if (user) {
      axios.get(API + "/api/auth/user/" + user.uid).then((res) => {
        if (res.data.subscription) setUserPlan(res.data.subscription.plan || "free");
      }).catch(() => {});
      axios.get(API + "/api/application").then((res) => {
        var myApps = res.data.filter((a: any) => a.user?.uid === user.uid);
        setAppCount(myApps.length);
      }).catch(() => {});
    }
  }, [user]);

  function getPlanLimit(plan: string) {
    var found = plans.find((p) => p.id === plan);
    return found ? found.limit : 1;
  }

  function handleApplyClick() {
    if (!user) { toast.error("Please login first"); return; }
    var limit = getPlanLimit(userPlan);
    if (appCount >= limit) {
      setShowUpgrade(true);
      setUpgradeMsg("You have used all " + limit + " application(s) on your " + userPlan + " plan. Upgrade to apply more.");
      return;
    }
    setShowUpgrade(false);
    setIsModalOpen(true);
  }

  var handlesubmitapplication = async () => {
    if (!coverLetter.trim()) { toast.error("please write a cover letter"); return; }
    if (!availability) { toast.error("please select your availability"); return; }
    var limit = getPlanLimit(userPlan);
    if (appCount >= limit) {
      setIsModalOpen(false);
      setShowUpgrade(true);
      setUpgradeMsg("Application limit reached on your current plan.");
      return;
    }
    try {
      var applicationdata = {
        category: internshipData.category,
        company: internshipData.company,
        coverLetter: coverLetter,
        user: user,
        Application: id,
        availability,
      };
      await axios.post(API + "/api/application", applicationdata);
      toast.success("Application submitted successfully!");
      setAppCount(appCount + 1);
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit application");
    }
  };

  async function handleUpgrade(planId: string) {
    if (!user) return;

    var now = new Date();
    var istHour = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
    if (istHour < 10 || istHour >= 11) {
      setUpgradeMsg("Payment is only available between 10 AM and 11 AM IST.");
      return;
    }

    setPayLoading(planId);
    try {
      var res = await axios.post(API + "/api/subscription/create-order", { uid: user.uid, planType: planId });
      if (res.data.free) {
        toast.success("Free plan activated!");
        setUserPlan("free");
        setShowUpgrade(false);
        setPayLoading("");
        return;
      }
      if (!rzpLoaded) { toast.error("Payment loading, try again"); setPayLoading(""); return; }

      var options = {
        key: res.data.key,
        amount: res.data.amount,
        currency: "INR",
        name: "InternArea",
        description: planId.charAt(0).toUpperCase() + planId.slice(1) + " Plan",
        order_id: res.data.orderId,
        handler: async function (response: any) {
          try {
            await axios.post(API + "/api/subscription/verify", {
              uid: user.uid,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planType: planId,
            });
            toast.success("Payment successful! Invoice sent to email.");
            setUserPlan(planId);
            setShowUpgrade(false);
          } catch (e) {
            toast.error("Payment verification failed");
          }
        },
        prefill: { name: user.name, email: user.email },
      };
      var rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setUpgradeMsg(err.response?.data?.message || "Payment failed");
    }
    setPayLoading("");
  }

  if (!internshipData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setRzpLoaded(true)} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center space-x-2 text-blue-600 mb-4">
              <ArrowUpRight className="h-5 w-5" />
              <span className="font-medium">Actively Hiring</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{internshipData.title}</h1>
            <p className="text-lg text-gray-600 mb-4">{internshipData.company}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-2 text-gray-600"><MapPin className="h-5 w-5" /><span>{internshipData.location}</span></div>
              <div className="flex items-center space-x-2 text-gray-600"><DollarSign className="h-5 w-5" /><span>{internshipData.stipend}</span></div>
              <div className="flex items-center space-x-2 text-gray-600"><Calendar className="h-5 w-5" /><span>{internshipData.startDate}</span></div>
            </div>
            <div className="mt-4 flex items-center space-x-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-green-500 text-sm">Posted on {internshipData.createdAt}</span>
            </div>
          </div>
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About {internshipData.company}</h2>
            <div className="flex items-center space-x-2 mb-4">
              <a href="#" className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"><span>Visit company website</span><ExternalLink className="h-4 w-4" /></a>
            </div>
            <p className="text-gray-600">{internshipData.aboutCompany}</p>
          </div>
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About the Internship</h2>
            <p className="text-gray-600 mb-6">{internshipData.aboutInternship}</p>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Who can apply</h3>
            <p className="text-gray-600 mb-6">{internshipData.whoCanApply}</p>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Perks</h3>
            <p className="text-gray-600 mb-6">{internshipData.perks}</p>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Information</h3>
            <p className="text-gray-600 mb-6">{internshipData.additionalInfo}</p>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Number of Openings</h3>
            <p className="text-gray-600">{internshipData.numberOfOpening}</p>
          </div>

          {/* Upgrade Section - Always visible for testing */}
          <div className="p-6 border-t bg-gray-50/50">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Premium Plans</h3>
                  <p className="text-sm text-gray-500">Upgrade to apply for more internships and unlock premium features.</p>
                </div>
                <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Clock size={12} /> 10:00 AM - 11:00 AM IST Only
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {plans.map((p) => (
                  <div key={p.id} className={"relative border-2 rounded-2xl p-4 transition-all " + (userPlan === p.id ? "border-blue-500 bg-white shadow-md" : "border-gray-200 bg-white hover:border-blue-200")}>
                    {userPlan === p.id && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Current</div>
                    )}
                    <p className="font-bold text-gray-900 mb-1">{p.name}</p>
                    <div className="flex items-baseline gap-0.5 mb-2">
                      <span className="text-2xl font-black text-gray-900">₹{p.price}</span>
                      <span className="text-[10px] text-gray-500 font-medium">/mo</span>
                    </div>
                    <ul className="space-y-2 mb-4">
                      <li className="flex items-center gap-2 text-[11px] text-gray-600">
                        <Check size={12} className="text-green-500" />
                        {p.limit === 999 ? "Unlimited" : p.limit} Applications
                      </li>
                    </ul>
                    {userPlan !== p.id && (
                      <button
                        onClick={() => handleUpgrade(p.id)}
                        disabled={payLoading === p.id}
                        className="w-full bg-blue-600 text-white text-xs font-bold py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {payLoading === p.id ? "..." : (p.price === 0 ? "Select Plan" : "Upgrade Now")}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {upgradeMsg && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg text-center font-medium">
                  {upgradeMsg}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Apply Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Apply to {internshipData.company}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Resume</h3>
                  <p className="text-gray-600">Your current resume will be submitted with the application</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Cover Letter</h3>
                  <p className="text-gray-600 mb-2">Why should you be selected for this internship?</p>
                  <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black" placeholder="Write your cover letter here..." />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Availability</h3>
                  <div className="space-y-3">
                    {["Yes, I am available to join immediately", "No, I am currently on notice period", "No, I will have to serve notice period", "Other"].map((option) => (
                      <label key={option} className="flex items-center space-x-2">
                        <input type="radio" value={option} checked={availability === option} onChange={(e) => setAvailability(e.target.value)} className="h-4 w-4 text-blue-600" />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700" onClick={handlesubmitapplication}>
                    Submit Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default InternshipDetail;

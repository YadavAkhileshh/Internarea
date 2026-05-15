import { selectuser } from "@/Feature/Userslice";
import { ExternalLink, Mail, User, FileText, Lock, RefreshCw, Monitor } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLang } from "@/context/LangContext";
import axios from "axios";
import { toast } from "react-toastify";
import Script from "next/script";

var API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

var ProfilePage = () => {
  var user = useSelector(selectuser);
  var { t } = useLang();
  var [activeTab, setActiveTab] = useState("overview");
  var [userData, setUserData] = useState<any>(null);
  var [loginHistory, setLoginHistory] = useState<any[]>([]);

  var [resumeForm, setResumeForm] = useState({ name: "", qualification: "", experience: "", personalDetails: "", photo: "" });
  var [resumeOtp, setResumeOtp] = useState("");
  var [resumeStep, setResumeStep] = useState(1);
  var [resumeLoading, setResumeLoading] = useState(false);
  var [createdResume, setCreatedResume] = useState<any>(null);
  var [rzpLoaded, setRzpLoaded] = useState(false);

  useEffect(() => {
    if (user) {
      axios.get(API + "/api/auth/user/" + user.uid).then((res) => {
        setUserData(res.data);
        if (res.data.resume && res.data.resume.name) {
          setCreatedResume(res.data.resume);
          setResumeStep(3);
        }
      }).catch(() => {});
      axios.get(API + "/api/auth/login-history/" + user.uid).then((res) => {
        setLoginHistory(res.data);
      }).catch(() => {});
    }
  }, [user]);

  function handleResumeChange(e: any) {
    setResumeForm({ ...resumeForm, [e.target.name]: e.target.value });
  }

  var isPremium = userData?.subscription?.plan && userData.subscription.plan !== "free";

  async function sendResumeOtp() {
    if (!resumeForm.name || !resumeForm.qualification) { toast.error("Fill in name and qualification"); return; }
    setResumeLoading(true);
    try {
      await axios.post(API + "/api/resume/send-otp", { uid: user.uid, email: user.email });
      toast.success("OTP sent to your email");
      setResumeStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    }
    setResumeLoading(false);
  }

  async function verifyAndPayResume() {
    setResumeLoading(true);
    try {
      var res = await axios.post(API + "/api/resume/verify-and-pay", { uid: user.uid, otp: resumeOtp });
      if (!rzpLoaded) { toast.error("Payment loading, try again"); setResumeLoading(false); return; }

      var options = {
        key: res.data.key,
        amount: res.data.amount,
        currency: "INR",
        name: "InternArea",
        description: "Resume Creation - ₹50",
        order_id: res.data.orderId,
        handler: async function (response: any) {
          try {
            var confirmRes = await axios.post(API + "/api/resume/confirm-payment", {
              uid: user.uid,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              resumeData: resumeForm,
            });
            toast.success("Resume created!");
            setCreatedResume(confirmRes.data.resume);
            setResumeStep(3);
          } catch (e) {
            toast.error("Payment verification failed");
          }
        },
        prefill: { name: user?.name, email: user?.email },
      };
      var rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Verification failed");
    }
    setResumeLoading(false);
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setRzpLoaded(true)} />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="relative h-32 bg-gradient-to-r from-blue-500 to-blue-600">
              <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                {user?.photo ? (
                  <img src={user?.photo} alt={user?.name} className="w-24 h-24 rounded-full border-4 border-white shadow-lg" />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-16 pb-4 px-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                <div className="mt-2 flex items-center justify-center text-gray-500">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{user?.email}</span>
                </div>
                {userData?.subscription?.plan && userData.subscription.plan !== "free" && (
                  <span className="mt-2 inline-block px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                    {userData.subscription.plan.charAt(0).toUpperCase() + userData.subscription.plan.slice(1)} Plan
                  </span>
                )}
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-6">
                {["overview", "resume", "loginHistory"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={"px-4 py-2 text-sm font-medium border-b-2 -mb-px " + (activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
                  >
                    {tab === "overview" ? "Overview" : tab === "resume" ? "My Resume" : "Login History"}
                  </button>
                ))}
              </div>

              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <span className="text-blue-600 font-semibold text-2xl">0</span>
                      <p className="text-blue-600 text-sm mt-1">Active Applications</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <span className="text-green-600 font-semibold text-2xl">0</span>
                      <p className="text-green-600 text-sm mt-1">Accepted Applications</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <span className="text-purple-600 font-semibold text-2xl">{userData?.friends?.length || 0}</span>
                      <p className="text-purple-600 text-sm mt-1">Friends</p>
                    </div>
                  </div>
                  <div className="flex justify-center pt-4">
                    <Link href="/userapplication" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">
                      View Applications <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === "resume" && (
                <div className="space-y-4">
                  {!isPremium ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                      <Lock className="mx-auto text-gray-400 mb-3" size={32} />
                      <h3 className="font-semibold text-gray-900 mb-2">Premium Feature</h3>
                      <p className="text-sm text-gray-500 mb-4">Resume builder is available for Bronze, Silver or Gold plan subscribers. Upgrade from any internship listing page.</p>
                    </div>
                  ) : resumeStep === 3 && createdResume ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="text-green-600" size={20} />
                        <h3 className="font-semibold text-gray-900">Resume Created ✓</h3>
                      </div>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p><strong>Name:</strong> {createdResume.name}</p>
                        <p><strong>Qualification:</strong> {createdResume.qualification}</p>
                        {createdResume.experience && <p><strong>Experience:</strong> {createdResume.experience}</p>}
                        {createdResume.personalDetails && <p><strong>Details:</strong> {createdResume.personalDetails}</p>}
                      </div>
                      <p className="text-xs text-green-600 mt-4">Automatically included when you apply for internships.</p>
                    </div>
                  ) : resumeStep === 2 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">OTP sent to <strong>{user?.email}</strong>. Verify to pay ₹50.</p>
                      <input value={resumeOtp} onChange={(e) => setResumeOtp(e.target.value)} placeholder="Enter 6-digit OTP"
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-center tracking-widest focus:outline-none focus:border-blue-400 text-gray-800" />
                      <button onClick={verifyAndPayResume} disabled={resumeLoading}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                        {resumeLoading && <RefreshCw className="animate-spin" size={14} />}
                        Verify & Pay ₹50
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">Premium feature — ₹50 per resume. Email OTP verification required before payment.</p>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input name="name" value={resumeForm.name} onChange={handleResumeChange} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 text-gray-800" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qualification *</label>
                        <input name="qualification" value={resumeForm.qualification} onChange={handleResumeChange} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 text-gray-800" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                        <textarea name="experience" value={resumeForm.experience} onChange={handleResumeChange} rows={3} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none text-gray-800" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Personal Details</label>
                        <textarea name="personalDetails" value={resumeForm.personalDetails} onChange={handleResumeChange} rows={3} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none text-gray-800" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
                        <input name="photo" value={resumeForm.photo} onChange={handleResumeChange} placeholder="https://..." className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 text-gray-800" />
                      </div>
                      <button onClick={sendResumeOtp} disabled={resumeLoading}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                        {resumeLoading && <RefreshCw className="animate-spin" size={14} />}
                        <Mail size={14} /> Send OTP & Proceed
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "loginHistory" && (
                <div>
                  {loginHistory.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">No login history yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 text-left text-gray-600 font-medium">Browser</th>
                            <th className="px-4 py-2 text-left text-gray-600 font-medium">OS</th>
                            <th className="px-4 py-2 text-left text-gray-600 font-medium">Device</th>
                            <th className="px-4 py-2 text-left text-gray-600 font-medium">IP</th>
                            <th className="px-4 py-2 text-left text-gray-600 font-medium">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loginHistory.map((h: any, i: number) => (
                            <tr key={i} className="border-t border-gray-100">
                              <td className="px-4 py-2 text-gray-700">{h.browser}</td>
                              <td className="px-4 py-2 text-gray-700">{h.os}</td>
                              <td className="px-4 py-2 text-gray-700">{h.device}</td>
                              <td className="px-4 py-2 text-gray-500 font-mono text-xs">{h.ip}</td>
                              <td className="px-4 py-2 text-gray-500 text-xs">{new Date(h.timestamp).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;

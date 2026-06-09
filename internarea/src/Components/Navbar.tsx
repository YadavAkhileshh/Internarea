import React, { useState } from "react";
import Link from "next/link";
import { auth, provider } from "../firebase/firebase";
import { Search, KeyRound, RefreshCw, X, Menu, Lock, Eye, EyeOff } from "lucide-react";
import { signInWithPopup, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { selectuser, login } from "@/Feature/Userslice";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLang } from "@/context/LangContext";
import axios from "axios";

var API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

var Navbar = () => {
  var user = useSelector(selectuser);
  var dispatch = useDispatch();
  var { t } = useLang();
  var [showForgot, setShowForgot] = useState(false);
  var [forgotInput, setForgotInput] = useState("");
  var [forgotLoading, setForgotLoading] = useState(false);
  var [generatedPass, setGeneratedPass] = useState("");
  var [forgotDone, setForgotDone] = useState(false);
  var [isMenuOpen, setIsMenuOpen] = useState(false);

  var [showClassicLogin, setShowClassicLogin] = useState(false);
  var [classicEmail, setClassicEmail] = useState("");
  var [classicPassword, setClassicPassword] = useState("");
  var [classicLoading, setClassicLoading] = useState(false);
  var [showClassicPassword, setShowClassicPassword] = useState(false);

  var handlelogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      sessionStorage.setItem("login_type", "google");
      sessionStorage.removeItem("classic_user");
      setIsMenuOpen(false);
      toast.success("logged in successfully");
    } catch (error) {
      console.error(error);
      toast.error("login failed");
    }
  };

  var handlelogout = () => {
    signOut(auth);
    sessionStorage.removeItem("login_type");
    sessionStorage.removeItem("classic_user");
    setIsMenuOpen(false);
  };

  async function handleClassicLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!classicEmail.trim() || !classicPassword.trim()) {
      toast.error("Email and password are required");
      return;
    }
    setClassicLoading(true);
    try {
      var res = await axios.post(API + "/api/auth/login-classic", {
        email: classicEmail,
        password: classicPassword
      });

      if (res.data.status === "OTP_REQUIRED") {
        var uid = res.data.uid;
        var otp = prompt("Security Verification: Enter the OTP sent to your email (" + classicEmail + ").");
        if (otp) {
          try {
            var verifyRes = await axios.post(API + "/api/auth/verify-login-otp", { uid: uid, otp: otp });
            if (verifyRes.data.status === "SUCCESS") {
              toast.success("Logged in successfully!");
              var userData = {
                uid: verifyRes.data.user.uid,
                email: verifyRes.data.user.email,
                name: verifyRes.data.user.name,
                photo: verifyRes.data.user.photo || "https://www.gravatar.com/avatar/?d=mp"
              };
              sessionStorage.setItem("login_type", "classic");
              sessionStorage.setItem("otp_verified_" + uid, "true");
              sessionStorage.setItem("classic_user", JSON.stringify(userData));
              dispatch(login(userData));
              setShowClassicLogin(false);
              setClassicEmail("");
              setClassicPassword("");
              setShowClassicPassword(false);
            } else {
              toast.error("Invalid OTP");
            }
          } catch (verifyErr: any) {
            toast.error(verifyErr.response?.data?.message || "Invalid OTP");
          }
        } else {
          toast.info("Verification cancelled");
        }
      } else {
        toast.success("Logged in successfully!");
        var userData = {
          uid: res.data.user.uid,
          email: res.data.user.email,
          name: res.data.user.name,
          photo: res.data.user.photo || "https://www.gravatar.com/avatar/?d=mp"
        };
        sessionStorage.setItem("login_type", "classic");
        sessionStorage.setItem("otp_verified_" + res.data.user.uid, "true");
        sessionStorage.setItem("classic_user", JSON.stringify(userData));
        dispatch(login(userData));
        setShowClassicLogin(false);
        setClassicEmail("");
        setClassicPassword("");
        setShowClassicPassword(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setClassicLoading(false);
    }
  }

  async function handleForgotSubmit() {
      if (!forgotInput.trim()) { toast.error("Enter email or phone"); return; }
      setForgotLoading(true);
      try {
        var res = await axios.post(API + "/api/auth/forgot-password", { emailOrPhone: forgotInput });
        setGeneratedPass(res.data.newPassword);
        setForgotDone(true);
        toast.success("Password reset successful!");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Something went wrong");
      }
      setForgotLoading(false);
    }

    function closeForgotModal() {
      setShowForgot(false);
      setForgotInput("");
      setGeneratedPass("");
      setForgotDone(false);
    }

    return (
      <div className="relative">
        <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex-shrink-0">
                <a href="/" className="text-xl font-bold text-blue-600">
                  <img src={"/logo.png"} alt="" className="h-12 sm:h-16" />
                </a>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <Link href="/internship" className="text-gray-600 hover:text-blue-600 text-sm font-semibold transition-colors">{t("internships")}</Link>
                <Link href="/job" className="text-gray-600 hover:text-blue-600 text-sm font-semibold transition-colors">{t("jobs")}</Link>

                <div className="flex items-center bg-gray-50/50 border border-gray-100 rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <Search size={14} className="text-gray-400" />
                  <input type="text" placeholder={t("search")} className="ml-2 bg-transparent focus:outline-none text-xs w-32 text-gray-700" />
                </div>
              </div>

              <div className="hidden md:flex items-center gap-6">
                <LanguageSwitcher />

                {user ? (
                  <div className="flex items-center gap-4 border-l pl-6">
                    <Link href="/profile" className="flex items-center gap-2 group">
                      <img src={user.photo} alt="" className="w-8 h-8 rounded-full ring-2 ring-transparent group-hover:ring-blue-400 transition-all" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 hidden sm:block">{user.name}</span>
                    </Link>
                    <button
                      className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-100 transition-all uppercase tracking-wider"
                      onClick={handlelogout}
                    >
                      {t("logout")}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                      <button
                        onClick={handlelogin}
                        title="Login with Google"
                        className="bg-white border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setShowClassicLogin(true)}
                        className="bg-blue-600 text-white rounded-lg px-4 py-2 text-xs font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
                      >
                        Login with Email
                      </button>
                    </div>

                    <div className="flex flex-col items-end">
                      <button
                        onClick={() => setShowForgot(true)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-tight"
                      >
                        {t("forgotPassword")}?
                      </button>
                      <Link href="/adminlogin" className="text-[9px] font-medium text-gray-400 hover:text-gray-600 transition-colors mt-0.5">
                        Admin Panel
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <div className="md:hidden flex items-center gap-4">
                <LanguageSwitcher />
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white border-t border-gray-100 ${isMenuOpen ? 'max-h-[500px] py-4' : 'max-h-0'}`}>
            <div className="px-6 space-y-3 pb-6">
              <Link href="/internship" onClick={() => setIsMenuOpen(false)} className="block text-gray-700 font-bold py-2 border-b border-gray-50 active:text-blue-600">{t("internships")}</Link>
              <Link href="/job" onClick={() => setIsMenuOpen(false)} className="block text-gray-700 font-bold py-2 border-b border-gray-50 active:text-blue-600">{t("jobs")}</Link>

              <div className="flex items-center bg-gray-50/50 rounded-xl px-4 py-2.5 mb-2 border border-gray-100">
                <Search size={16} className="text-gray-400" />
                <input type="text" placeholder={t("search")} className="ml-3 bg-transparent focus:outline-none text-xs w-full text-gray-700" />
              </div>

              {user ? (
                <div className="space-y-4">
                  <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <img src={user.photo} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{user.name}</p>
                      <p className="text-xs text-blue-600">View Profile</p>
                    </div>
                  </Link>
                  <button
                    onClick={handlelogout}
                    className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform"
                  >
                    {t("logout")}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={handlelogin}
                    className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 py-3.5 rounded-2xl font-bold text-sm text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="text-gray-700">Login with Google</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setShowClassicLogin(true);
                    }}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-100 active:scale-95 transition-transform"
                  >
                    Login with Email
                  </button>
                  <div className="flex justify-between items-center px-1">
                    <button onClick={() => { setIsMenuOpen(false); setShowForgot(true); }} className="text-xs font-bold text-blue-600 uppercase tracking-wider">{t("forgotPassword")}?</button>
                    <Link href="/adminlogin" onClick={() => setIsMenuOpen(false)} className="text-[10px] font-medium text-gray-400">Admin Panel</Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        {showForgot && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={closeForgotModal}>
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={closeForgotModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="text-blue-600" size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("forgotPassword")}</h2>
                <p className="text-gray-500 text-sm mt-1">You can reset only once per day</p>
              </div>

              {!forgotDone ? (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email or Phone</label>
                    <input
                      type="text" value={forgotInput}
                      onChange={(e) => setForgotInput(e.target.value)}
                      placeholder={t("enterEmail")}
                      className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 text-gray-900 bg-gray-50"
                    />
                  </div>

                  <button
                    onClick={handleForgotSubmit}
                    disabled={forgotLoading}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
                  >
                    {forgotLoading && <RefreshCw className="animate-spin" size={16} />}
                    Reset & Generate Password
                  </button>
                  <p className="text-[10px] text-gray-400 text-center mt-4 uppercase tracking-widest font-bold">Letters-only password will be generated</p>
                </>
              ) : (
                <div className="text-center">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-800 text-sm font-medium mb-2">Your new password:</p>
                    <p className="text-2xl font-mono font-bold text-green-700 tracking-wider">{generatedPass}</p>
                  </div>
                  <p className="text-gray-500 text-xs">Letters only. No numbers or special characters.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {showClassicLogin && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={() => setShowClassicLogin(false)}>
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowClassicLogin(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock className="text-blue-600" size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Login with Email</h2>
                <p className="text-gray-500 text-sm mt-1">Enter your registered email and password</p>
              </div>

              <form onSubmit={handleClassicLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={classicEmail}
                    onChange={(e) => setClassicEmail(e.target.value)}
                    placeholder="Enter email"
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 text-gray-900 bg-gray-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showClassicPassword ? "text" : "password"}
                      value={classicPassword}
                      onChange={(e) => setClassicPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full border-2 border-gray-100 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-blue-400 text-gray-900 bg-gray-50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowClassicPassword(!showClassicPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showClassicPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={classicLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] mt-2"
                >
                  {classicLoading && <RefreshCw className="animate-spin" size={16} />}
                  Sign In
                </button>
              </form>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 text-xs">
                <button
                  onClick={() => { setShowClassicLogin(false); setShowForgot(true); }}
                  className="font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider"
                >
                  {t("forgotPassword")}?
                </button>
                <span className="text-gray-400 font-medium">Use generated pass to log in</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  export default Navbar;

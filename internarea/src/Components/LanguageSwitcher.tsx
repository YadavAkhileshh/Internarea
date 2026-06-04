import React, { useState, useRef, useEffect } from "react";
import { useLang } from "@/context/LangContext";
import { Globe, Check, RefreshCw, ChevronDown, Mail, X } from "lucide-react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";

var rawAPI = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
var API = rawAPI.endsWith("/") ? rawAPI.slice(0, -1) : rawAPI;

var LanguageSwitcher = () => {
  var { lang, switchLang, t } = useLang();
  var user = useSelector(selectuser);
  var [isOpen, setIsOpen] = useState(false);
  var [showOtp, setShowOtp] = useState(false);
  var [otp, setOtp] = useState("");
  var [loading, setLoading] = useState(false);
  var [mounted, setMounted] = useState(false);
  var dropdownRef = useRef<HTMLDivElement>(null);

  var languages = [
    { id: "en", label: "English" },
    { id: "hi", label: "हिन्दी" },
    { id: "mr", label: "मराठी" },
    { id: "gu", label: "ગુજરાતી" },
    { id: "ta", label: "தமிழ்" },
    { id: "fr", label: "Français" },
  ];

  useEffect(() => {
    setMounted(true);
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLangSelect(langId: string) {
    setIsOpen(false);
    if (langId === "fr" && lang !== "fr") {
      if (!user) { toast.error("Login to switch to French"); return; }
      try {
        setLoading(true);
        await axios.post(API + "/api/lang/request-otp", { uid: user.uid, email: user.email, targetLang: "fr" });
        setShowOtp(true);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to send OTP");
      } finally {
        setLoading(false);
      }
    } else {
      if (user) {
        try {
          await axios.post(API + "/api/lang/switch", { uid: user.uid, targetLang: langId });
        } catch (err) {
          console.error("Failed to persist language switch on backend:", err);
        }
      }
      switchLang(langId);
    }
  }

  async function verifyFrench() {
    try {
      setLoading(true);
      await axios.post(API + "/api/lang/verify-otp", { uid: user.uid, otp });
      switchLang("fr");
      setShowOtp(false);
      setOtp("");
      toast.success("Switched to French!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }

  var currentLangLabel = languages.find(l => l.id === lang)?.label || "English";

  return (
    <div 
      className="relative" 
      ref={dropdownRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button 
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-all text-sm font-medium text-gray-700"
      >
        <Globe size={16} className="text-blue-600" />
        <span>{currentLangLabel}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in zoom-in duration-200 origin-top-right">
          <p className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Language</p>
          {languages.map((l) => (
            <button
              key={l.id}
              onClick={() => handleLangSelect(l.id)}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                lang === l.id ? "bg-blue-50 text-blue-600 font-bold" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                {l.label}
                {l.id === "fr" && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-bold">OTP</span>}
              </div>
              {lang === l.id && <Check size={14} />}
            </button>
          ))}
        </div>
      )}

      {showOtp && mounted && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300" onClick={() => setShowOtp(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowOtp(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="text-blue-600" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Verify French</h3>
              <p className="text-sm text-gray-500 leading-relaxed px-2">
                We sent a 6-digit verification code to <strong className="text-gray-900 font-semibold">{user?.email}</strong>. Use <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs text-blue-600">000000</code> for testing.
              </p>
            </div>

            <div className="relative mb-8">
              <div className="flex justify-center gap-3">
                {Array(6).fill("").map((_, index) => {
                  var val = otp[index] || "";
                  var isFocused = otp.length === index;
                  return (
                    <div
                      key={index}
                      className={`w-12 h-14 border-2 rounded-xl flex items-center justify-center text-2xl font-bold transition-all ${
                        val 
                          ? "border-blue-600 text-blue-600 bg-blue-50/20" 
                          : isFocused 
                            ? "border-blue-500 ring-4 ring-blue-50" 
                            : "border-gray-200 text-gray-700 bg-gray-50"
                      }`}
                    >
                      {val}
                    </div>
                  );
                })}
              </div>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  var clean = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                  setOtp(clean);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                maxLength={6}
                autoFocus
              />
            </div>

            <button 
              onClick={verifyFrench} 
              disabled={loading || otp.length < 6} 
              className="w-full bg-blue-600 text-white py-4 rounded-2xl text-base font-bold hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading && <RefreshCw className="animate-spin" size={18} />}
              Verify & Switch
            </button>

            <button 
              onClick={() => setShowOtp(false)} 
              className="w-full mt-4 text-gray-400 text-sm font-semibold hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
};

export default LanguageSwitcher;

import Footer from "@/Components/Fotter";
import Navbar from "@/Components/Navbar";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { store } from "../store/store";
import { Provider, useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { auth } from "@/firebase/firebase";
import { login, logout, selectuser } from "@/Feature/Userslice";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { LangProvider, useLang } from "@/context/LangContext";
import axios from "axios";

var API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

export default function App({ Component, pageProps }: AppProps) {
  var [isMobileBlocked, setIsMobileBlocked] = useState(false);

  useEffect(() => {
    function checkMobileTime() {
      var ua = navigator.userAgent;
      var isMobile = /Mobile|Android|iPhone/.test(ua);
      if (isMobile) {
        var now = new Date();
        var utc = now.getTime() + now.getTimezoneOffset() * 60000;
        var istTime = new Date(utc + (330 * 60000)); // UTC + 5.5 hours for IST
        var istHour = istTime.getHours();
        if (istHour < 10 || istHour >= 13) {
          setIsMobileBlocked(true);
        } else {
          setIsMobileBlocked(false);
        }
      }
    }
    checkMobileTime();
    var interval = setInterval(checkMobileTime, 10000);
    return () => clearInterval(interval);
  }, []);

  function AuthListener() {
    var dispatch = useDispatch();
    var { switchLang } = useLang();
    useEffect(() => {
      var classicUserStr = sessionStorage.getItem("classic_user");
      if (classicUserStr) {
        try {
          var classicUser = JSON.parse(classicUserStr);
          dispatch(login(classicUser));
          if (classicUser.language) {
            switchLang(classicUser.language);
          }
        } catch (e) {}
      }

      var unsubscribe = auth.onAuthStateChanged((authuser) => {
        if (authuser) {
          sessionStorage.setItem("login_type", "google");
          sessionStorage.removeItem("classic_user");
          dispatch(
            login({
              uid: authuser.uid,
              photo: authuser.photoURL,
              name: authuser.displayName,
              email: authuser.email,
              phoneNumber: authuser.phoneNumber,
            })
          );
          if (sessionStorage.getItem("otp_verified_" + authuser.uid)) return;
          if (sessionStorage.getItem("login_track_pending_" + authuser.uid)) return;

          sessionStorage.setItem("login_track_pending_" + authuser.uid, "true");

          axios.post(API + "/api/auth/login-track", {
            uid: authuser.uid,
            email: authuser.email,
            name: authuser.displayName,
            photo: authuser.photoURL
          }).then((res) => {
            sessionStorage.removeItem("login_track_pending_" + authuser.uid);
            if (res.data.status === "OTP_REQUIRED") {
              var otp = prompt("Security Verification: Enter the OTP sent to your email (" + authuser.email + ").")
              if (otp) {
                axios.post(API + "/api/auth/verify-login-otp", { uid: authuser.uid, otp: otp })
                  .then((verifyRes) => {
                    if (verifyRes.data.status === "SUCCESS") {
                      sessionStorage.setItem("otp_verified_" + authuser.uid, "true");
                      if (verifyRes.data.user?.language) {
                        switchLang(verifyRes.data.user.language);
                      }
                    }
                  })
                  .catch(() => {
                    alert("Invalid OTP. Please refresh and try again.");
                    auth.signOut();
                  });
              } else {
                auth.signOut();
              }
            } else {
              sessionStorage.setItem("otp_verified_" + authuser.uid, "true");
              if (res.data.user?.language) {
                switchLang(res.data.user.language);
              }
            }
          }).catch((err) => {
            sessionStorage.removeItem("login_track_pending_" + authuser.uid);
            if (err.response?.status === 403) {
              alert(err.response.data.message);
              auth.signOut();
            }
          })
        } else {
          if (sessionStorage.getItem("login_type") === "google" || !sessionStorage.getItem("classic_user")) {
            dispatch(logout());
            sessionStorage.removeItem("login_type");
          }
        }
      });

      return () => {
        unsubscribe();
      };
    }, [dispatch, switchLang]);
    return null;
  }

  if (isMobileBlocked) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-md backdrop-blur-md">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Access Schedule Restriction</h1>
          <p className="text-sm text-gray-400 mb-6 font-medium">
            Mobile access is restricted. You can only access this platform between <span className="text-red-400 font-bold">10:00 AM</span> and <span className="text-red-400 font-bold">1:00 PM IST</span>.
          </p>
          <div className="text-xs text-gray-500 font-mono">
            Current Timezone: India Standard Time (IST)
          </div>
        </div>
      </div>
    );
  }

  return (
    <Provider store={store}>
      <LangProvider>
        <AuthListener />
        <div className="bg-white">
          <ToastContainer />
          <Navbar />
          <Component {...pageProps} />
          <Footer />
        </div>
      </LangProvider>
    </Provider>
  );
}

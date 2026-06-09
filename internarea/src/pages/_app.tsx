import Footer from "@/Components/Fotter";
import Navbar from "@/Components/Navbar";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { store } from "../store/store";
import { Provider, useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { auth } from "@/firebase/firebase";
import { login, logout, selectuser } from "@/Feature/Userslice";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { LangProvider, useLang } from "@/context/LangContext";
import axios from "axios";

var API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

export default function App({ Component, pageProps }: AppProps) {
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

      auth.onAuthStateChanged((authuser) => {
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

          axios.post(API + "/api/auth/login-track", {
            uid: authuser.uid,
            email: authuser.email,
            name: authuser.displayName,
            photo: authuser.photoURL
          }).then((res) => {
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
    }, [dispatch, switchLang]);
    return null;
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

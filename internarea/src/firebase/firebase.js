import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDbYTYs_oSK2rvtzHxBCPFrqdXM-l7MokQ",
  authDomain: "internshala-9e300.firebaseapp.com",
  projectId: "internshala-9e300",
  storageBucket: "internshala-9e300.firebasestorage.app",
  messagingSenderId: "304425115290",
  appId: "1:304425115290:web:1b0653f1acd4192b848923",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export { auth, provider };

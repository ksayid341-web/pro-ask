import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCRollVt1RQ3JPODt4AVgz1ZhDvtTJH9eM",
  authDomain: "gen-lang-client-0845301755.firebaseapp.com",
  projectId: "gen-lang-client-0845301755",
  storageBucket: "gen-lang-client-0845301755.firebasestorage.app",
  messagingSenderId: "1011573965886",
  appId: "1:1011573965886:web:53f563285cf3a3aa1f7d6f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
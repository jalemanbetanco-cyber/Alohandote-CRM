import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const adminEmails = String(import.meta.env.VITE_ADMIN_EMAILS || 'jgalemanbetanco24@gmail.com,jgalemanbetanco@gmail.com')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

export const isFirebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
const app = isFirebaseReady ? initializeApp(firebaseConfig) : null
export const db = app ? getFirestore(app) : null
export const auth = app ? getAuth(app) : null
export const storage = app ? getStorage(app) : null

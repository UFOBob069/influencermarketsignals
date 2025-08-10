'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { app } from './firebase'
import { db } from './firebase'
import { collection, doc, getDoc } from 'firebase/firestore'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  isPro: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPro, setIsPro] = useState(false)
  
  useEffect(() => {
    try {
      const auth = getAuth(app)
      
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setUser(user)
        
        // Check for Pro status from Firestore using UID
        if (user) {
          console.log('Auth: User signed in:', user.email, 'UID:', user.uid)
          try {
            const usersRef = collection(db, 'users')
            const userDoc = doc(usersRef, user.uid)
            const userSnapshot = await getDoc(userDoc)
            
            if (userSnapshot.exists()) {
              const userData = userSnapshot.data()
              const proStatus = userData.isPro === true
              console.log('Auth: User Pro status:', proStatus, 'Data:', userData)
              setIsPro(proStatus)
            } else {
              console.log('Auth: No user document found for UID:', user.uid)
              setIsPro(false)
            }
          } catch (err) {
            console.error('Error getting user data:', err)
            setIsPro(false)
          }
        } else {
          console.log('Auth: No user signed in')
          setIsPro(false)
        }
        
        setLoading(false)
        setError(null)
      }, (error) => {
        console.error('Auth state change error:', error)
        setError(error.message)
        setLoading(false)
      })

      return () => unsubscribe()
    } catch (err) {
      console.error('Firebase auth initialization error:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize Firebase auth')
      setLoading(false)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const auth = getAuth(app)
      await signInWithEmailAndPassword(auth, email, password)
      setError(null)
    } catch (error) {
      console.error('Error signing in:', error)
      setError(error instanceof Error ? error.message : 'Failed to sign in')
      throw error
    }
  }

  const signInWithGoogle = async () => {
    try {
      const auth = getAuth(app)
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      setError(null)
    } catch (error) {
      console.error('Error with Google sign-in:', error)
      setError(error instanceof Error ? error.message : 'Failed to sign in with Google')
      throw error
    }
  }

  const signOutUser = async () => {
    try {
      const auth = getAuth(app)
      await signOut(auth)
      setError(null)
    } catch (error) {
      console.error('Error signing out:', error)
      setError(error instanceof Error ? error.message : 'Failed to sign out')
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, isPro, signIn, signOut: signOutUser, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 
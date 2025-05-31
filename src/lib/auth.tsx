'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { app } from './firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    try {
      const auth = getAuth(app)
      
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user)
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
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 
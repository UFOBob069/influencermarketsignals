import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

let adminDb: Firestore | null | undefined

/**
 * Firestore with admin privileges (bypasses security rules).
 * Set FIREBASE_SERVICE_ACCOUNT_JSON to a stringified service account JSON object in production.
 */
export function getAdminFirestore(): Firestore | null {
  if (adminDb !== undefined) return adminDb

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw) {
    adminDb = null
    return null
  }

  try {
    if (!getApps().length) {
      const cred = JSON.parse(raw) as ServiceAccount
      initializeApp({ credential: cert(cred) })
    }
    adminDb = getFirestore()
    return adminDb
  } catch (e) {
    console.error('firebase-admin init failed:', e)
    adminDb = null
    return null
  }
}

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getAdminFirestore } from '@/lib/firebaseAdmin'

export async function contentDocGet(contentId: string) {
  const admin = getAdminFirestore()
  if (admin) {
    const snap = await admin.collection('content').doc(contentId).get()
    return { exists: snap.exists, data: snap.exists ? snap.data() : undefined }
  }
  const snap = await getDoc(doc(db, 'content', contentId))
  return { exists: snap.exists(), data: snap.exists() ? snap.data() : undefined }
}

export async function contentDocUpdate(contentId: string, patch: DocumentData) {
  const admin = getAdminFirestore()
  if (admin) {
    await admin.collection('content').doc(contentId).update(patch)
    return
  }
  await updateDoc(doc(db, 'content', contentId), patch)
}

export async function contentDocCreate(data: DocumentData): Promise<string> {
  const admin = getAdminFirestore()
  if (admin) {
    const ref = await admin.collection('content').add(data)
    return ref.id
  }
  const ref = await addDoc(collection(db, 'content'), data)
  return ref.id
}

export async function contentExistsWithVideoId(videoId: string): Promise<boolean> {
  const admin = getAdminFirestore()
  if (admin) {
    const q = await admin.collection('content').where('videoId', '==', videoId).limit(1).get()
    return !q.empty
  }
  const q = query(collection(db, 'content'), where('videoId', '==', videoId), limit(1))
  const snap = await getDocs(q)
  return !snap.empty
}

const META_COLLECTION = 'meta'
const CHANNEL_SYNC_DOC = 'channelSync'

export type ChannelSyncState = { lastRunIso: string | null }

/** Cron sync window; only admin can read/write `meta` with default Firestore rules. */
export async function getChannelSyncState(): Promise<ChannelSyncState> {
  const admin = getAdminFirestore()
  if (!admin) return { lastRunIso: null }
  const snap = await admin.collection(META_COLLECTION).doc(CHANNEL_SYNC_DOC).get()
  const d = snap.data() as ChannelSyncState | undefined
  return { lastRunIso: d?.lastRunIso ?? null }
}

export async function setChannelSyncState(state: ChannelSyncState) {
  const admin = getAdminFirestore()
  if (!admin) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is required to persist channel sync state')
  await admin.collection(META_COLLECTION).doc(CHANNEL_SYNC_DOC).set(state, { merge: true })
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { uid, isPro } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'User UID is required' }, { status: 400 });
    }

    // Use UID as document ID for direct access
    const usersRef = collection(db, 'users');
    const userDoc = doc(usersRef, uid);
    
    await setDoc(userDoc, {
      uid,
      isPro,
      proSince: isPro ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({ 
      success: true, 
      message: `User ${uid} ${isPro ? 'upgraded to' : 'downgraded from'} Pro` 
    });

  } catch (error) {
    console.error('Error setting Pro status:', error);
    return NextResponse.json({ error: 'Failed to update Pro status' }, { status: 500 });
  }
}

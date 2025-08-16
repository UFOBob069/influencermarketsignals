import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil',
    })
  : null

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    )
  }

  try {
    const { email, userId, planType = 'monthly' } = await req.json()

    if (!email || !userId) {
      return NextResponse.json(
        { error: 'Email and userId are required' },
        { status: 400 }
      )
    }

    // Determine price ID based on plan type
    const priceId = planType === 'annual'
      ? process.env.STRIPE_ANNUAL_PRICE_ID
      : process.env.STRIPE_MONTHLY_PRICE_ID

    if (!priceId) {
      console.error('Stripe Price ID missing', {
        planType,
        hasMonthly: Boolean(process.env.STRIPE_MONTHLY_PRICE_ID),
        hasAnnual: Boolean(process.env.STRIPE_ANNUAL_PRICE_ID)
      })
      return NextResponse.json(
        { error: 'Price ID not configured' },
        { status: 500 }
      )
    }

    // Resolve base URL (works locally and in prod if env is missing)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin

    // Create a checkout session for the subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/dashboard?success=true`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      customer_email: email,
      metadata: {
        userId: userId,
        planType: planType,
      },
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
        metadata: {
          userId: userId,
          planType: planType,
        },
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

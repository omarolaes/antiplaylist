import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.has('stripe-signature') ? headersList.get('stripe-signature') : null;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 400 }
    );
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Store the customer ID in a temporary table or cache
    // This will be used to verify the subscription during signup
    const { error } = await supabase
      .from('pending_subscriptions')
      .insert({
        stripe_customer_id: session.customer as string,
        session_id: session.id,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error storing pending subscription:', error);
      return NextResponse.json({ error: 'Error storing pending subscription' }, { status: 500 });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_premium: false,
        subscription_status: 'cancelled'
      })
      .eq('stripe_customer_id', subscription.customer);

    if (error) {
      console.error('Error updating subscription status:', error);
      return NextResponse.json({ error: 'Error updating subscription status' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
} 
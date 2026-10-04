import { NextResponse } from 'next/server';
import { stripe } from '@zoerai/integration';
import type { CheckoutSessionResult } from '@zoerai/integration';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode, priceId, productName, productDescription, amount, credits } = body;

    // Check if Stripe is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey || stripeKey === 'your_stripe_secret_key') {
      // Demo mode - return a mock response
      return NextResponse.json(
        {
          success: false,
          error: 'Stripe not configured. Demo mode active.',
          demo: true,
        },
        { status: 200 }
      );
    }

    let result: CheckoutSessionResult;

    if (mode === 'subscription' && priceId) {
      // Subscription checkout
      result = await stripe.createCheckoutSession({
        stripeKey,
        request: {
          mode: 'subscription',
          lineItems: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3050'}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3050'}/billing?canceled=true`,
        },
      });
    } else if (mode === 'payment' && amount) {
      // One-time payment (credits)
      result = await stripe.createCheckoutSession({
        stripeKey,
        request: {
          mode: 'payment',
          lineItems: [
            {
              priceData: {
                currency: 'usd',
                unitAmount: amount,
                productData: {
                  name: productName || 'Hydrascout Credits',
                  description: credits
                    ? `${credits} Hydrascout Credits`
                    : productDescription || 'Hydrascout Purchase',
                },
              },
              quantity: 1,
            },
          ],
          successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3050'}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3050'}/billing?canceled=true`,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.data?.url || '',
      sessionId: result.data?.id || '',
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

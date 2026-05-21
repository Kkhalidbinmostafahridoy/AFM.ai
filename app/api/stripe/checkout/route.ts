import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { stripe, PREMIUM_PRICE_ID } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Get or create Stripe customer
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      const { data: user } = await supabase
        .from("users")
        .select("email, full_name")
        .eq("id", userId)
        .single();

      const customer = await stripe.customers.create({
        email: user?.email,
        name: user?.full_name || undefined,
        metadata: { clerk_user_id: userId },
      });

      customerId = customer.id;

      await supabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        plan: "free",
        status: "active",
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: PREMIUM_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: { clerk_user_id: userId },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

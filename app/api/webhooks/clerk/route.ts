import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (evt.type) {
    case "user.created":
    case "user.updated": {
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;
      const email = email_addresses[0]?.email_address;

      await supabase.from("users").upsert({
        id,
        email: email || "",
        full_name: [first_name, last_name].filter(Boolean).join(" ") || null,
        avatar_url: image_url,
      });

      if (evt.type === "user.created") {
        await supabase.from("credits").upsert({
          user_id: id,
          plan: "free",
          generations_today: 0,
          last_reset_date: new Date().toISOString().split("T")[0],
        });

        await supabase.from("subscriptions").upsert({
          user_id: id,
          plan: "free",
          status: "active",
        });
      }
      break;
    }

    case "user.deleted": {
      const { id } = evt.data;
      await supabase.from("users").delete().eq("id", id!);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

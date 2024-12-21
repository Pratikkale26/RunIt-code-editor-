import { httpRouter } from "convex/server";
import { httpAction } from './_generated/server'
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import {api} from "./_generated/api";

const http = httpRouter();

http.route({
    path: "/clerk-webhook",
    method: "POST",
    handler: httpAction(async (ctx, req) => {
      const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  
      if (!webhookSecret) {
        console.error("Missing webhook secret");
        return new Response("Internal server error", { status: 500 });
      }
  
      const svix_id = req.headers.get("svix-id");
      const svix_timestamp = req.headers.get("svix-timestamp");
      const svix_signature = req.headers.get("svix-signature");
  
      if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response("Missing svix headers", { status: 400 });
      }
  
      let payload;
      try {
        payload = await req.json();
      } catch (err) {
        console.error("Error parsing JSON payload:", err);
        return new Response("Invalid JSON payload", { status: 400 });
      }
  
      const body = JSON.stringify(payload);
      const wh = new Webhook(webhookSecret);
  
      let evt: WebhookEvent;
      try {
        evt = await wh.verify(body, {
          "svix-id": svix_id,
          "svix-timestamp": svix_timestamp,
          "svix-signature": svix_signature,
        }) as WebhookEvent;
      } catch (err) {
        console.error("Error verifying webhook:", err);
        return new Response("Invalid svix signature", { status: 400 });
      }
  
      const eventType = evt.type;
  
      if (eventType === "user.created") {
        const { id, email_addresses, first_name, last_name } = evt.data;
        const email = email_addresses[0].email_address;
        const name = `${first_name || ""} ${last_name || ""}`.trim();
  
        try {
          await ctx.runMutation(api.users.syncUser, {
            userId: id,
            email,
            name,
          });
        } catch (err) {
          console.error("Error creating user:", err);
          return new Response("Error creating user", { status: 500 });
        }
  
        return new Response("Webhook processed successfully", { status: 200 });
      }
  
      console.warn(`Unhandled event type: ${eventType}`);
      return new Response(`Event type ${eventType} is not supported`, { status: 400 });
    }),
  });
  
export default http  
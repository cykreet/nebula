import { Controller, Get, Post, Req, Res } from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { isInitiator } from "./helpers/is-initiator.js";
import { sendResponse } from "./helpers/send-response.js";
import { WhatsAppNotificationPayload, WhatsAppVerifyQuery } from "./helpers/whatsapp-request.js";
import { config } from "./config.js";

@Controller()
export class AppController {
  @Get("webhook")
  async verify(@Req() request: FastifyRequest, @Res() reply: FastifyReply) {
    const query = request.query as WhatsAppVerifyQuery;
    if (query["hub.mode"] !== "subscribe" || query["hub.verify_token"] !== config.verifyToken) return reply.status(400);
    return reply.send(query["hub.challenge"]);
  }

  @Post("webhook")
  async webhoook(@Req() request: FastifyRequest): Promise<void> {
    const payload = request.body as WhatsAppNotificationPayload;
    const changes = payload.entry[0].changes[0];
    const statuses = changes.value.statuses;
    // if the recipient_id is present, it's probably a message from us
    // and shouldn't be handled.
    if (statuses && statuses[0] && statuses[0].recipient_id) return;

    const message = changes.value.messages[0];
    if (message == null) return;
    const metadata = changes.value.metadata;
    if (message.text?.body && isInitiator(message.text.body)) {
      // user initiated converstaion with "hello" or "hi", etc.
      // the "intro" identifier is used by the first message the user should see.
      return await sendResponse(metadata.phone_number_id, message.from, message.id, "intro");
    }

    if (message.interactive) {
      // user interacted with a button or list option.
      const identifier = message.interactive.button_reply ?? message.interactive.list_reply;
      return await sendResponse(metadata.phone_number_id, message.from, message.id, identifier?.id!);
    }
  }
}

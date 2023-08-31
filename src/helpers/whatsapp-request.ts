import { Logger } from "@nestjs/common";
import { fetch } from "undici";
import { config } from "../config.js";

const CLOUD_API_BASE = `https://graph.facebook.com/v15.0/`;

export interface WhatsAppVerifyQuery {
  "hub.mode": string;
  "hub.verify_token": string;
  "hub.challenge": string;
}

export interface WhatsAppNotificationPayload {
  entry: [
    {
      changes: [
        {
          value: {
            statuses?: [{ recipient_id: string }];
            metadata: { phone_number_id: string };
            messages: [
              {
                id: string;
                from: string;
                interactive?: {
                  type: string;
                  button_reply?: {
                    id: string;
                    title: string;
                  };
                  list_reply?: {
                    id: string;
                  };
                };
                text?: {
                  body: string;
                };
              }
            ];
          };
        }
      ];
    }
  ];
}

export interface WhatsAppReplyBody {
  to: string;
  context: {
    message_id: string;
  };
  text?: {
    body: string;
  };
  type?: "image" | "interactive" | "text";
  interactive?: {
    type: "button" | "list";
    action: {
      // List message button content.
      button?: string;
      buttons?: WhatsAppReplyBodyButton[];
      // List message section rows
      sections?: WhatsAppReplyBodySection[];
    };
    body: {
      text: string;
    };
    header?: {
      type: string;
      text: string;
    };
    footer?: {
      text: string;
    };
  };
  image?: {
    link: string;
    caption?: string;
  };
}

export interface WhatsAppReplyBodyButton {
  type: "reply";
  reply: {
    title: string;
    id: string;
  };
}

export interface WhatsAppReplyBodySection {
  title?: string;
  rows: WhatsAppReplyBodySectionRow[];
}

export interface WhatsAppReplyBodySectionRow {
  id: string;
  title: string;
  description?: string;
}

export enum WhatsAppEndpoint {
  MESSAGES = "messages",
}

const logger = new Logger("Request");

export async function whatsAppRequest(
  phoneId: string,
  endpoint: WhatsAppEndpoint,
  body: WhatsAppReplyBody
): Promise<void> {
  const payload = Object.assign(body, { messaging_product: "whatsapp" });
  const response = await fetch(`${CLOUD_API_BASE}/${phoneId}/${endpoint}`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.whatsappToken}`,
    },
  });

  if (!response.ok) {
    const body = JSON.stringify(await response.json(), null, 4);
    return logger.error(`Failed to deliver request: (${response.status})\n${body}`);
  }
}

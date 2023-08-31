import { Logger } from "@nestjs/common";
import { getAssetData, getResponseData } from "./get-content-data.js";
import {
  WhatsAppEndpoint,
  WhatsAppReplyBody,
  WhatsAppReplyBodyButton,
  WhatsAppReplyBodySection,
  WhatsAppReplyBodySectionRow,
  whatsAppRequest,
} from "./whatsapp-request.js";

const logger = new Logger("Response");

export async function sendResponse(
  phoneId: string,
  to: string,
  messageId: string,
  responseIdentifier: string
): Promise<void> {
  const responseData = await getResponseData(responseIdentifier);
  if (responseData == null) return logger.error(`Couldn't deliver response, no entry for "${responseIdentifier}".`);
  if (responseData.fields.header || responseData.fields.footer || responseData.fields.interactions) {
    let buttons: WhatsAppReplyBodyButton[] = [];
    let sections: WhatsAppReplyBodySection[] = [];
    if (responseData.fields.interactions) {
      switch (responseData.fields.interactionType) {
        case "Buttons":
          // only 3 buttons are allowed on a message.
          for await (const interaction of responseData.fields.interactions.slice(0, 2)) {
            const interactionEntry = await getResponseData(interaction.sys.id, true);
            const title = interactionEntry?.fields.interactionTitle;
            if (!title) continue;
            buttons.push({
              type: "reply",
              reply: {
                id: interactionEntry.fields.identifier,
                title: title,
              },
            });
          }
        default:
        case "List":
          const rows: WhatsAppReplyBodySectionRow[] = [];
          for await (const interaction of responseData.fields.interactions) {
            const interactionEntry = await getResponseData(interaction.sys.id, true);
            const title = interactionEntry?.fields.interactionTitle;
            const description = interactionEntry?.fields.interactionDescription;
            if (!title) continue;
            rows.push({
              id: interactionEntry.fields.identifier,
              title,
              description,
            });
          }

          const section: WhatsAppReplyBodySection = {
            title: responseData.fields.listTitle,
            rows,
          };

          sections.push(section);
      }
    }

    const isButtonsInteraction = responseData.fields.interactionType === "Buttons";
    const interactionData = isButtonsInteraction ? { buttons } : { sections };
    const responseBody: WhatsAppReplyBody = {
      to,
      type: "interactive",
      context: {
        message_id: messageId,
      },
      interactive: {
        type: isButtonsInteraction ? "button" : "list",
        action: Object.assign({ button: "View List Options" }, interactionData),
        body: {
          text: responseData.fields.content,
        },
      },
    };

    const header = responseData.fields.header;
    if (header) responseBody.interactive!.header = { type: "text", text: header };
    const footer = responseData.fields.footer;
    if (footer) responseBody.interactive!.footer = { text: footer };
    return await whatsAppRequest(phoneId, WhatsAppEndpoint.MESSAGES, responseBody);
  }

  const media = responseData.fields.media;
  if (media) {
    const asset = await getAssetData(media.sys.id);
    if (!asset) return logger.error(`Unable to find asset with the id: "${media.sys.id}"`);
    const responseBody: WhatsAppReplyBody = {
      to,
      type: "image",
      context: {
        message_id: messageId,
      },
      text: {
        body: responseData.fields.content,
      },
      image: {
        // Contentful assets use relative protocols
        link: asset.fields.file.url.slice(2),
        caption: asset.fields.description,
      },
    };

    return await whatsAppRequest(phoneId, WhatsAppEndpoint.MESSAGES, responseBody);
  }

  if (!responseData.fields.content) return;
  return await whatsAppRequest(phoneId, WhatsAppEndpoint.MESSAGES, {
    to,
    context: { message_id: messageId },
    text: { body: responseData.fields.content },
  });
}

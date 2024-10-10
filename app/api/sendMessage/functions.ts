import { DBTables } from "@/lib/enums/Tables";
import { createServiceClient } from "@/lib/supabase/service-client";
import {
  TemplateRequest,
  TextParameter,
} from "@/types/message-template-request";
import { MessageTemplateComponent } from "@/types/message-template";
type Media = {
  id?: string;
  filename?: string;
  caption?: string | null | undefined;
};

type Message = {
  recipient_type: "individual";
  messaging_product: "whatsapp";
  to: string;
  type?: "document" | "image" | "text" | "video" | "template";
  audio?: Media;
  document?: Media;
  video?: Media;
  image?: Media;
  sticker?: Media;
  text?: {
    body: string;
  };
  template?: TemplateRequest;
};

function getFileExtention(fileName: string): string | null {
  const fileNameRegexRes = /[.]/.exec(fileName)
    ? /[^.]+$/.exec(fileName)
    : undefined;
  if (fileNameRegexRes && fileNameRegexRes.length) {
    return fileNameRegexRes[0];
  }
  return null;
}

function regexSearchTextReplace(
  input: string,
  replacement: { text: string }[]
) {
  const varsRegex = /{{(\d+)}}/g;
  const allVars = input.matchAll(varsRegex);
  for (const headerVar of allVars) {
    const varIndex = Number.parseInt(headerVar[1]) - 1;
    const replacementText = replacement[varIndex].text;
    if (replacementText) {
      input = input.replace(headerVar[0], replacementText);
    }
  }
  return input;
}

function replaceVarsInTemplate(
  components: MessageTemplateComponent[],
  vars: TemplateRequest["components"]
) {
  components.forEach((c) => {
    switch (c.type) {
      case "HEADER":
        const headerVarValue = vars.find((v) => v.type === "header");
        if (headerVarValue) {
          if (c.format === "TEXT") {
            c.text = regexSearchTextReplace(
              c.text,
              headerVarValue.parameters as { text: string }[]
            );
          } else if (
            c.format === "IMAGE" &&
            headerVarValue.parameters &&
            headerVarValue.parameters[0].type === "image"
          ) {
            c.image = headerVarValue.parameters[0].image;
          } else if (
            c.format === "VIDEO" &&
            headerVarValue.parameters &&
            headerVarValue.parameters[0].type === "video"
          ) {
            c.video = headerVarValue.parameters[0].video;
          } else if (
            c.format === "DOCUMENT" &&
            headerVarValue.parameters &&
            headerVarValue.parameters[0].type === "document"
          ) {
            c.document = headerVarValue.parameters[0].document;
          }
        }
        break;
      case "BODY":
        const bodyVarValue = vars.find((v) => v.type === "body");
        if (bodyVarValue) {
          c.text = regexSearchTextReplace(
            c.text,
            bodyVarValue.parameters as TextParameter[]
          );
        }
        break;
      case "BUTTONS":
        const buttonPayloads = vars.filter((v) => v.type === "button");
        if (buttonPayloads) {
          c.buttons.forEach((b, bIndex) => {
            if (b.type === "URL" && b.url.endsWith("{{1}}")) {
              const payloadObj = buttonPayloads.find(
                (x) => "index" in x && Number.parseInt(x.index) === bIndex
              );
              if (
                payloadObj &&
                "sub_type" in payloadObj &&
                payloadObj?.sub_type === "url"
              ) {
                const replacement =
                  payloadObj.parameters && payloadObj.parameters[0].payload;
                b.url = b.url.replace("{{1}}", replacement);
              }
            }
          });
        }
        break;
    }
  });
}

async function uploadFile(file: File, to: string) {
  const WHATSAPP_API_URL = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_API_PHONE_NUMBER_ID}/media`;
  const headers = {
    Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
  };
  const formData = new FormData();
  formData.set("type", file.type);
  formData.set("messaging_product", "whatsapp");
  formData.set("file", file);
  const res = await fetch(WHATSAPP_API_URL, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) {
    const responseStatus = await res.status;
    const response = await res.text();
    throw new Error(responseStatus + response);
  }
  const response = await res.json();

  let extension = getFileExtention(file.name);

  const supabase = createServiceClient();

  const { data, error } = await supabase.storage
    .from("media")
    .upload(`${to}/${response.id}.${extension}`, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
      duplex: "half",
    });
  console.log(`media stored at ${data?.path}`);
  if (error) throw error;
  return [response.id, data.path];
}

export async function sendWhatsAppMessage(
  to: string,
  message: string | null | undefined,
  fileType: string | undefined | null,
  file: File | undefined | null,
  template: TemplateRequest | undefined | null
) {
  const WHATSAPP_API_URL = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_API_PHONE_NUMBER_ID}/messages`;
  const payload: Message = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
  };
  let mediaUrl: string | null = null;
  if (file) {
    let mediaId;
    [mediaId, mediaUrl] = await uploadFile(file, to);
    switch (fileType) {
      case "image":
        payload["type"] = "image";
        payload["image"] = {
          id: mediaId,
        };
        if (message) {
          payload["image"]["caption"] = message;
        }
        break;
      case "video":
        payload["type"] = "video";
        payload["video"] = {
          id: mediaId,
        };
        if (message) {
          payload["video"]["caption"] = message;
        }
        break;
      case "file":
      default:
        payload["type"] = "document";
        payload["document"] = {
          id: mediaId,
          filename: file.name,
        };
        if (message) {
          payload["document"]["caption"] = message;
        }
        break;
    }
  } else if (template) {
    payload["type"] = "template";
    payload["template"] = template;
  } else {
    payload["type"] = "text";
    payload["text"] = {
      body: message!!,
    };
  }
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
  };
  const res = await fetch(WHATSAPP_API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const responseStatus = await res.status;
    const response = await res.text();
    throw new Error(responseStatus + response);
  }
  const msgToPut: any = structuredClone(payload);
  delete msgToPut.messaging_product;
  const response = await res.json();
  const wamId = response.messages[0].id;
  msgToPut["id"] = wamId;
  const supabase = createServiceClient();
  if (payload.template) {
    const { data: templateArrFromDB } = await supabase
      .from("message_template")
      .select("*")
      .eq("name", payload.template.name)
      .eq("language", payload.template.language.code);
    const templateFromDB = templateArrFromDB && templateArrFromDB[0];
    const templateComponents =
      templateFromDB.components as MessageTemplateComponent[];
    replaceVarsInTemplate(templateComponents, payload.template.components);
    msgToPut.template.components = templateComponents;
  }
  await supabase.from(DBTables.Messages).insert({
    message: msgToPut,
    wam_id: wamId,
    chat_id: Number.parseInt(response.contacts[0].wa_id),
    media_url: mediaUrl,
  });

  let { error } = await supabase
    .from(DBTables.Contacts)
    .update({
      last_message_at: new Date(),
    })
    .eq("wa_id", to);
  if (error) console.error("error while updating last message field");
}

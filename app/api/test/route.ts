import { NextResponse } from "next/server";
import { functionMap, handleOpenAIResponse } from "../../webhook/function-map";
import fs from "fs/promises";
import path from "path";
import { TemplateRequest } from "@/types/message-template-request";
import { sendWhatsAppMessage } from "../sendMessage/functions";

export async function GET(request: Request) {
  try {
    await handleOpenAIResponse({
      wa_id: "77770765776",
      message: "Возврат кашан болады?",
    });
    return NextResponse.json({ response: "success" }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/test:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function sendBulkTemplateMessages() {
  try {
    // Read the JSON file
    const jsonPath = path.join(process.cwd(), "app/api/test/users.json");
    const jsonData = await fs.readFile(jsonPath, "utf-8");
    const sellers = JSON.parse(jsonData);

    for (const seller of sellers) {
      const templateRequest: TemplateRequest = {
        name: "enable_smart_price",
        language: {
          code: "ru",
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: seller.product.title,
              },
              {
                type: "text",
                text: seller.product.deeplink,
              },
            ],
          },
          {
            type: "button",
            sub_type: "quick_reply",
            index: "0",
            parameters: [
              {
                type: "payload",
                payload: JSON.stringify({
                  action: "enableSmartPrice",
                  data: { user_id: seller._id.$oid },
                }),
              },
            ],
          },
        ],
      };

      // Replace "+77782550525" with the actual phone number for each seller
      await sendWhatsAppMessage(
        seller.user.phone,
        null,
        null,
        null,
        templateRequest
      );

      // Add a delay to avoid rate limiting (adjust as needed)
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    console.log("Bulk messages sent successfully");
  } catch (error) {
    console.error("Error sending bulk messages:", error);
  }
}

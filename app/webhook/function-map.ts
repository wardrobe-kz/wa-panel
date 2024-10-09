import { sendWhatsAppMessage } from "../api/sendMessage/functions";

type ActionFunction = (data: any) => Promise<void>;

interface FunctionMap {
  [key: string]: ActionFunction;
}

async function enableSmartPrice(data: {
  user_id: string;
  wa_id: string;
}): Promise<void> {
  console.log(`Enabling smart price for user: ${data.user_id}`);
  try {
    console.log(
      `sending post request to https://dake.dev/api/users/${data.user_id}/apply-smart-price-to-products`
    );
    const response = await fetch(
      `https://dake.dev/api/users/${data.user_id}/apply-smart-price-to-products`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log("Successfully applied smart price to products");

    await sendWhatsAppMessage(
      data.wa_id,
      "Спасибо, мы применили smart price для ваших товаров",
      null,
      null,
      null
    );

    console.log("WhatsApp message sent successfully");
  } catch (error) {
    console.error("Error in enableSmartPrice:", error);
  }
}

export const functionMap: FunctionMap = {
  enableSmartPrice: enableSmartPrice,
};

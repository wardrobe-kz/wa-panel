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
    const response = await fetch(
      `https://dake.dev/api/users/${data.user_id}/apply-smart-price-to-products`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Smart price applied successfully:", result);

    // Send WhatsApp message
    const formData = new FormData();
    formData.set("to", data.wa_id);
    formData.set(
      "message",
      "Smart pricing has been successfully enabled for your products."
    );

    const messageResponse = await fetch("/api/sendMessage", {
      method: "POST",
      body: formData,
    });

    if (messageResponse.status !== 200) {
      throw new Error(
        `Failed to send WhatsApp message. Status: ${messageResponse.status}`
      );
    }

    console.log("WhatsApp message sent successfully");
  } catch (error) {
    console.error("Error in enableSmartPrice:", error);
  }
}

export const functionMap: FunctionMap = {
  enableSmartPrice: enableSmartPrice,
};

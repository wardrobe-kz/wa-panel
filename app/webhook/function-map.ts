type ActionFunction = (data: any) => Promise<void>;

interface FunctionMap {
  [key: string]: ActionFunction;
}

async function enableSmartPrice(data: { user_id: string }): Promise<void> {
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
  } catch (error) {
    console.error("Error applying smart price:", error);
  }
}

export const functionMap: FunctionMap = {
  enableSmartPrice: enableSmartPrice,
};

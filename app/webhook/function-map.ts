type ActionFunction = (data: any) => Promise<void>;

interface FunctionMap {
  [key: string]: ActionFunction;
}

async function enableSmartPrice(data: { user_id: string }): Promise<void> {
  console.log(`Enabling smart price for user: ${data.user_id}`);
}

export const functionMap: FunctionMap = {
  enableSmartPrice: enableSmartPrice,
};

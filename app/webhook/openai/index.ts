import OpenAI from "openai";
import { FAQ_CONTEXT } from "./context-faq";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getOpenAIResponse(message: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: FAQ_CONTEXT },
        { role: "user", content: message },
      ],
      max_tokens: 150,
      n: 1,
      temperature: 0.7,
    });

    return (
      completion.choices[0].message.content ||
      "I'm sorry, I couldn't generate a response."
    );
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return "I apologize, but I'm having trouble processing your request right now. Please try again later.";
  }
}

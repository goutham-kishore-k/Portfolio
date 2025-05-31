import { ChatGoogleGenerativeAI } from "langchain/chat_models/google";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";

const memory = new BufferMemory();
const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-pro",
  temperature: 0.7,
  apiKey: process.env.GOOGLE_API_KEY,
});
const chain = new ConversationChain({ llm: model, memory });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end(); // Method not allowed
    return;
  }

  const { message } = req.body;
  try {
    const result = await chain.call({ input: message });
    res.status(200).json({ reply: result.response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

import 'dotenv/config';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("OPENAI_API_KEY is required (set it in your environment or .env file)");
}

const client = new OpenAI({ apiKey });

export async function embedText(text: string): Promise<number[]> {
  const result = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  const [first] = result.data;
  if (!first) {
    throw new Error("No embedding returned from OpenAI");
  }

  return first.embedding;
}

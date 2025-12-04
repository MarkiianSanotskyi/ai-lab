import 'dotenv/config';
import OpenAI from 'openai';
import { embedText } from './embeddings.js';
import { cosineSimilarity } from './similarity.js';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("OPENAI_API_KEY is required (set it in your environment or .env file)");
}

const client = new OpenAI({ apiKey });

type Doc = {
  id: string;
  content: string;
  embedding: number[];
};

const docsRaw: Omit<Doc, "embedding">[] = [
  {
    id: "wp",
    content: "WordPress is a PHP-based CMS widely used for websites and blogs.",
  },
  {
    id: "laravel",
    content: "Laravel is a modern PHP framework for building web applications.",
  },
  {
    id: "react",
    content: "React is a JavaScript library for building user interfaces.",
  },
];

let docs: Doc[] = [];

async function buildIndex() {
  docs = [];
  for (const doc of docsRaw) {
    const embedding = await embedText(doc.content);
    docs.push({ ...doc, embedding });
  }
}

function search(queryEmbedding: number[], topK = 2): Doc[] {
  return docs
    .map((doc) => ({
      doc,
      score: cosineSimilarity(doc.embedding, queryEmbedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((x) => x.doc);
}

async function answer(query: string) {
  if (docs.length === 0) {
    await buildIndex();
  }

  const queryEmbedding = await embedText(query);
  const results = search(queryEmbedding);

  const context = results.map((d) => `- ${d.content}`).join("\n");

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: "You are an assistant that answers based only on the provided context.",
    },
    {
      role: "user",
      content: `Context:\n${context}\n\nQuestion: ${query}\n\nIf the context is not enough, say you are not sure.`,
    },
  ];

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
  });

  console.log("Query:", query);
  console.log("Context used:\n", context);
  console.log("Answer:", completion.choices[0]?.message?.content);
}

async function main() {
  const query = process.argv[2] ?? "What is WordPress?";
  await answer(query);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

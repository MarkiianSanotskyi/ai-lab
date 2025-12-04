import 'dotenv/config';
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { loadDocsFromDir } from "./loader.js";
import type { RawDoc } from "./loader.js";
import { cosineSimilarity } from "./similarity.js";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("OPENAI_API_KEY is required (set it in your environment or .env file)");
}

const client = new OpenAI({ apiKey });

export type DocVector = {
  id: string;
  content: string;
  source: string;
  embedding: number[];
};

const INDEX_PATH = path.resolve("data", "index.json");

async function embedText(text: string): Promise<number[]> {
  const result = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  const first = result.data[0];
  if (!first) {
    throw new Error("No embedding returned from OpenAI");
  }

  return first.embedding;
}

export async function buildIndexIfNeeded() {
  if (fs.existsSync(INDEX_PATH)) {
    return; // already exists
  }

  console.log("No index found, building…");

  const rawDocs: RawDoc[] = loadDocsFromDir("data");
  const vectors: DocVector[] = [];

  for (const doc of rawDocs) {
    console.log("Embedding:", doc.id);
    const embedding = await embedText(doc.content);
    vectors.push({
      ...doc,
      embedding,
    });
  }

  fs.writeFileSync(INDEX_PATH, JSON.stringify(vectors));
  console.log("Index built at", INDEX_PATH);
}

export function loadIndex(): DocVector[] {
  if (!fs.existsSync(INDEX_PATH)) {
    throw new Error("Index file not found. Run buildIndexIfNeeded first.");
  }

  const raw = fs.readFileSync(INDEX_PATH, "utf-8");
  return JSON.parse(raw) as DocVector[];
}

export function searchIndex(queryEmbedding: number[], topK = 3): DocVector[] {
  const index = loadIndex();

  return index
    .map((doc) => ({
      doc,
      score: cosineSimilarity(doc.embedding, queryEmbedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.doc);
}

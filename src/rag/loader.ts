import fs from "fs";
import path from "path";

export type RawDoc = {
  id: string;
  content: string;
  source: string; // file path or logical name
};

export function loadDocsFromDir(dirPath: string): RawDoc[] {
  const fullDir = path.resolve(dirPath);

  const files = fs.readdirSync(fullDir).filter((file) =>
    file.endsWith(".md") || file.endsWith(".txt")
  );

  const docs: RawDoc[] = [];

  for (const file of files) {
    const fullPath = path.join(fullDir, file);
    const content = fs.readFileSync(fullPath, "utf-8");

    docs.push({
      id: path.basename(file, path.extname(file)),
      content,
      source: fullPath,
    });
  }

  return docs;
}

import { Router, type Request, type Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOCK_ARTICLES_DIR = path.join(__dirname, "../services/mock-articles");

const router = Router();


router.get("/", async (req: Request, res: Response) => {
  try {
    const files = await fs.promises.readdir(MOCK_ARTICLES_DIR);
    const articles = files.filter((file) => file.endsWith(".html"));
    res.status(200).json({ articles });
  } catch (error) {
    res.status(500).json({ error: "Failed to read mock articles directory" });
  }
});

// GET /:filename - Retrieve a specific mock article by filename or ID (e.g., article1.html, article1, or 1)
router.get("/:filename", (req: Request, res: Response) => {
  let { filename } = req.params;

  if (!filename) {
    return res.status(400).json({ error: "Filename is required" });
  }

  if (!(filename as string).endsWith(".html")) {
    if (!isNaN(Number(filename))) {
      filename = `article${filename}.html`;
    } else {
      filename = `${filename}.html`;
    }
  }

  const filePath = path.join(MOCK_ARTICLES_DIR, filename as string);

  // Prevent directory traversal
  if (!filePath.startsWith(MOCK_ARTICLES_DIR)) {
    return res.status(403).json({ error: "Access denied" });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: `Article '${filename}' not found` });
  }

  res.sendFile(filePath);
});

export default router;

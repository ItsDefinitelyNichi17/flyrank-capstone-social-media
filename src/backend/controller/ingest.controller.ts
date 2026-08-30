import type { Response, Request } from "express";
import { storePost } from "../services/repositories/ingest.repository";

export async function ingestContent(req : Request, res: Response) {
  const { content } = req.body;
  if (isURL(content)) {
    const page_res = await fetch(content);
    const text = await page_res.text();
    storePost(text, "url");
    res.status(200).send("success");
  } else {
    res.status(200).send("markdown")
  }
}


function isURL(url: string) {
  try {
    const urlToCheck = new URL(url);
    return urlToCheck.protocol === "http:" || urlToCheck.protocol === "https:"
  } catch (_) {
    return false
  }
}

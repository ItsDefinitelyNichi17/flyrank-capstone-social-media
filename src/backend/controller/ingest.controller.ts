import type { Response, Request } from "express";
import { storePost } from "../services/repositories/ingest.repository.js";
import { genEachVarStore } from "../services/variant/variant.gen.js";
import { storeVariant } from "../services/repositories/variant.repository.js";



export async function ingestContent(req : Request, res: Response) {
  const { content } = req.body;
  if (isURL(content)) {
    const page_res = await fetch(content);
    const text = await page_res.text();
    const post = await storePost(text, "url");

    if (!post) {
      res.status(500).send("failed to store post")
      return
    }

    let postId = post.rows[0].id;
    const variants = await genEachVarStore(content)
    let values = {
      post_id : [] as string[],
      hashtags : [] as string[][],
      variant_content : [] as string[],
      platform : [] as string []
    }
    variants.forEach((e) => {
      if (!e) {
        console.log(`variant is undefined`)
        res.status(500).send("<h1>variant is undefined</h1>")
        return
      }
      const {content, hashtag, platform} = e
      values.post_id.push(postId)
      values.hashtags.push(hashtag)
      values.variant_content.push(content)
      values.platform.push(platform as string)
    })
    await storeVariant(values.post_id, values.hashtags, values.variant_content, values.platform)
    res.status(200).send(`postId: ${postId}`)
  } else {
    res.status(200).send("markdown")
  }
}


function isURL(url: string) {
  try {
    const urlToCheck = new URL(url);
    return urlToCheck.protocol === "http:" || urlToCheck.protocol === "https:"
  } catch (e) {
    if (e instanceof Error) {
      throw e
    }
  }
}

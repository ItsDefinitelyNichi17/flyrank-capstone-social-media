import Router from "express"
import { ingestPost, getPosts } from "../controller/post.controller.js"

const router = Router()

router.post('/', ingestPost);
router.get('/', getPosts);

export default router

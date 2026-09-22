import Router from "express"
import { ingestPost } from "../controller/post.controller.js"

const router = Router()

router.post('/', ingestPost);

export default router

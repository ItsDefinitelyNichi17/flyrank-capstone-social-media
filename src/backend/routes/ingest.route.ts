import Router from "express"
import { ingestContent } from "../controller/ingest.controller.js"

const router = Router()

router.post('/', ingestContent);

export default router

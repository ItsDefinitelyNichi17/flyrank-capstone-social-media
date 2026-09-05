import Router from "express"
import type { Request, Response } from "express"
import { updateVariantStatus } from "../controller/variant.controller.js"
const router = Router()

router.get('/', (req : Request , res : Response) => {
  res.send('get all posts')
})

router.patch('/:id', updateVariantStatus)

export default router

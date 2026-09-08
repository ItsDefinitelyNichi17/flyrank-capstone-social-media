import Router from "express"
import { scheduleVariantController, updateVariantStatusController, getAllVariantsController } from "../controller/variant.controller.js"


const router = Router()

router.get('/', getAllVariantsController)
router.patch('/status/:variantId', updateVariantStatusController)
router.post('/schedule/:variantId', scheduleVariantController)

export default router

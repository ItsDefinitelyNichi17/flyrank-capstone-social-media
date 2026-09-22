import Router from "express"
import {
  scheduleVariantController, updateVariantStatusController,
  getAllVariantsController,getAllVariantsScheduledController,
} from "../controller/variant.controller.js"


const router = Router()

router.get('/', getAllVariantsController)
router.patch('/status/:variantId', updateVariantStatusController)
router.post('/schedule/:variantId', scheduleVariantController)
router.get('/schedule', getAllVariantsScheduledController)

export default router

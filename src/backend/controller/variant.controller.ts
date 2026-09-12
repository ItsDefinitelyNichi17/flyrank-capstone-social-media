import type { Request, Response } from "express";
import {
  scheduleVariant, getVariant, setVariantStatus, VALID_VARIANT_STATUSES,
  type VariantStatus, getAllVariants
}
  from "../services/repositories/variant.repository.js";
import { scheduleJob } from "../services/bullmq/variant.queue.js";
export { VALID_VARIANT_STATUSES, type VariantStatus };

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Controller to update the status of a variant.
 * Complies with the 'poststatus' enum ('draft', 'approved', 'rejected')
 * defined in src/backend/db/schemas/variants.sql and types.sql.
 */
export async function updateVariantStatusController(req: Request, res: Response) {
  try {
    const { variantId } = req.params;
    const { status, post_id } = req.body;

    if (!variantId || typeof variantId !== "string" || !variantId.trim()) {
      return res.status(400).json({ error: "Variant ID is required" });
    }

    const trimmedId = variantId.trim();
    if (!UUID_REGEX.test(trimmedId)) {
      return res
        .status(400)
        .json({ error: "Invalid variant ID format. Expected a valid UUID." });
    }

    if (!status || typeof status !== "string") {
      return res.status(400).json({
        error: `Missing or invalid 'status'. Allowed statuses are: ${VALID_VARIANT_STATUSES.join(", ")}`,
      });
    }

    const normalizedStatus = status.trim().toLowerCase() as VariantStatus;
    if (!VALID_VARIANT_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        error: `Invalid status '${status}'. Allowed statuses are: ${VALID_VARIANT_STATUSES.join(", ")}`,
      });
    }

    const postIdStr =
      typeof post_id === "string" && post_id.trim() ? post_id.trim() : undefined;

    const updatedVariant = await setVariantStatus(
      trimmedId,
      normalizedStatus,
      postIdStr
    );

    if (!updatedVariant) {
      return res
        .status(404)
        .json({ error: `Variant with ID '${trimmedId}' not found` });
    }

    return res.status(200).json({
      message: "Variant status updated successfully",
      variant: updatedVariant,
    });
  } catch (error) {
    console.error("Error updating variant status:", error);
    return res
      .status(500)
      .json({ error: "Internal server error while updating variant status" });
  }
}

export async function scheduleVariantController(req: Request, res: Response) {
  const { variantId } = req.params;
  const { schedule } = req.body;

  const scheduled_at = new Date(schedule);
  //safety checks
  if (!variantId || !schedule) {
    return res.status(400).json({ error: "Missing 'id' in request params or 'schedule' in request body" });
  }
  if (!(typeof variantId === 'string')) {
    return res.status(400).json({ error: "Invalid 'id' in request params" });
  }

  const variantExists = await getVariant(variantId);

  if (!variantExists) {
    return res.status(404).json({ error: `Variant with ID '${variantId}' not found` });
  }

  if (!(variantExists.status === "approved")) {
    return res.status(400).json({message: "Variant is not approved"});
  }

  if (scheduled_at < new Date()) {
    console.log(scheduled_at, new Date())
    return res.status(400).json({message: "Schedule time should be in the future"});
  }
  // schedule logic
  try {
    const scheduledVariant = await scheduleVariant(variantId, scheduled_at);
    if (scheduledVariant) {
      const ms = Math.max(0, new Date(scheduled_at).getTime() - Date.now());
      console.log(ms);
      await scheduleJob(ms, variantId, scheduledVariant.id);
    }
    return res.status(200).json({
      message: "Variant scheduled successfully",
      variant: scheduledVariant,
    });
  } catch (e) {
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message });
    }
  }
}

export async function getAllVariantsController(req: Request, res: Response) {
  const variants = await getAllVariants();
  res.status(200).json({
    message: "Variants retrieved successfully",
    variants: variants
  });
  return
}

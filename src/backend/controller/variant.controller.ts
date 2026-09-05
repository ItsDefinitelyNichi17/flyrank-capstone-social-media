import type { Request, Response } from "express";
import {
  setVariantStatus,
  VALID_VARIANT_STATUSES,
  type VariantStatus,
} from "../services/repositories/variant.repository.js";

export { VALID_VARIANT_STATUSES, type VariantStatus };

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Controller to update the status of a variant.
 * Complies with the 'poststatus' enum ('draft', 'approved', 'rejected')
 * defined in src/backend/db/schemas/variants.sql and types.sql.
 */
export async function updateVariantStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, post_id } = req.body;

    if (!id || typeof id !== "string" || !id.trim()) {
      return res.status(400).json({ error: "Variant ID is required" });
    }

    const trimmedId = id.trim();
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


type MaybeNdiProof = {
  status: "PENDING" | "VERIFIED" | "EXPIRED" | "FAILED";
  error?: string;
};

export const isInactiveNdiError = (message = "") => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("unknown proof request") ||
    (normalized.includes("expired") && normalized.includes("reset")) ||
    normalized.includes("no longer active")
  );
};

export const isInactiveNdiProof = (proof: MaybeNdiProof) => proof.status === "EXPIRED" || isInactiveNdiError(proof.error);

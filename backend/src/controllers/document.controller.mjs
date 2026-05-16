import { SHARES_PER_PROPERTY } from "../config/constants.mjs";
import { writeDb } from "../db/store.mjs";
import { serializeProperty } from "../models/property.model.mjs";
import { audit } from "../services/audit.service.mjs";
import { requireUser } from "../services/auth.service.mjs";
import { encryptDocument, uploadPropertyPhoto } from "../services/document.service.mjs";
import { isVerifiedWallet } from "../services/wallet.service.mjs";
import { httpError } from "../utils/errors.mjs";
import { created } from "../utils/http.mjs";
import { isWallet, makeId, normalizeWallet, now } from "../utils/values.mjs";

export const submit = async ({ db, req, body, res }) => {
  const user = requireUser(db, req, body);
  if (!user.walletAddress || !isWallet(user.walletAddress)) {
    throw httpError(400, "Link a wallet before submitting property documents");
  }
  if (!isVerifiedWallet(db, user.walletAddress)) {
    throw httpError(400, "Your linked wallet must be NDI-verified before submitting property documents");
  }
  if (!body.title || !body.location || !body.documentData) {
    throw httpError(400, "Title, location, and document upload are required");
  }

  const [encrypted, photo] = await Promise.all([
    encryptDocument(body.documentData, body.documentName),
    body.photoData ? uploadPropertyPhoto(body.photoData, body.photoName) : Promise.resolve(null),
  ]);
  const property = {
    _id: makeId("PROP"),
    tokenId: "",
    title: String(body.title).trim(),
    location: String(body.location).trim(),
    propertyType: body.propertyType || "Residential",
    price: body.price || `Nu. ${Number(body.pricePerShare || 0) * SHARES_PER_PROPERTY}`,
    ownerWallet: normalizeWallet(user.walletAddress),
    docHash: encrypted.hash,
    documentHash: encrypted.hash,
    docStorageRef: encrypted.storageRef,
    docGatewayUrl: encrypted.gatewayUrl,
    docCid: encrypted.cid,
    imageUrl: photo?.gatewayUrl || body.imageUrl || "",
    imageStorageRef: photo?.storageRef || "",
    imageCid: photo?.cid || "",
    imageName: body.photoName || "",
    totalSupply: SHARES_PER_PROPERTY,
    requestedListingShares: Number(body.requestedListingShares || SHARES_PER_PROPERTY),
    requestedPricePerShare: Number(body.pricePerShare || 1),
    status: "PENDING",
    submittedAt: now(),
    approvedAt: null,
    updatedAt: now(),
    description: body.description || "",
  };

  db.properties.unshift(property);
  audit(db, user.walletAddress, "DOCUMENT_SUBMITTED", property._id, {
    docHash: encrypted.hash,
    storageRef: encrypted.storageRef,
    cid: encrypted.cid || null,
    imageCid: photo?.cid || null,
  });
  await writeDb(db);
  return created(res, { property: serializeProperty(db, property) });
};

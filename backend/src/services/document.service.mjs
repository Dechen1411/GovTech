import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  DOCS_DIR,
  HAS_IPFS_DOCUMENT_CONFIG,
  IPFS_API_TOKEN,
  IPFS_API_URL,
  PINATA_API_URL,
  PINATA_FILE_API_URL,
  PINATA_GATEWAY_URL,
  PINATA_JWT,
  PINATA_NETWORK,
  USE_IPFS_DOCUMENT_STORAGE,
} from "../config/constants.mjs";
import { httpError } from "../utils/errors.mjs";
import { makeId, now, sha256Hex } from "../utils/values.mjs";

const makeDocumentBlob = (body) => new Blob([body], { type: "application/json" });
const makeFileBlob = (body, type) => new Blob([body], { type });

const gatewayUrlFor = (cid) => (PINATA_GATEWAY_URL ? `https://${PINATA_GATEWAY_URL}/ipfs/${cid}` : "");

const decodeJwtPart = (part) => {
  const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
};

const assertValidPinataJwt = () => {
  const parts = PINATA_JWT.split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) {
    throw httpError(500, "PINATA_JWT is not a complete JWT. Create a new Pinata API key and paste the full JWT into backend/.env.");
  }

  try {
    JSON.parse(decodeJwtPart(parts[0]));
    JSON.parse(decodeJwtPart(parts[1]));
  } catch {
    throw httpError(500, "PINATA_JWT is malformed or incomplete. Create a new Pinata API key and paste the full JWT into backend/.env.");
  }
};

const pinJsonWithPinata = async (fileName, payload) => {
  assertValidPinataJwt();

  const body = JSON.stringify({
    pinataOptions: { cidVersion: 1 },
    pinataMetadata: { name: fileName },
    pinataContent: payload,
  });

  const response = await fetch(PINATA_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      "Content-Type": "application/json",
    },
    body,
  });

  if (!response.ok) {
    throw httpError(502, `IPFS pinning failed: ${response.status} ${await response.text()}`);
  }

  const result = await response.json();
  const cid = result.IpfsHash || result.cid || result.Hash || result.data?.cid;
  if (!cid) {
    throw httpError(502, "IPFS pinning response did not include a CID");
  }

  return { storageRef: `ipfs://${cid}`, gatewayUrl: gatewayUrlFor(cid), cid };
};

const uploadFileWithPinata = async (fileName, body) => {
  assertValidPinataJwt();

  const form = new FormData();
  form.append("network", PINATA_NETWORK);
  form.append("file", makeDocumentBlob(body), fileName);
  form.append("name", fileName);

  const response = await fetch(PINATA_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form,
  });

  if (!response.ok) {
    throw httpError(502, `IPFS pinning failed: ${response.status} ${await response.text()}`);
  }

  const result = await response.json();
  const cid = result.IpfsHash || result.cid || result.Hash || result.data?.cid;
  if (!cid) {
    throw httpError(502, "IPFS pinning response did not include a CID");
  }

  return { storageRef: `ipfs://${cid}`, gatewayUrl: gatewayUrlFor(cid), cid };
};

const pinWithPinata = async (fileName, payload, body) =>
  PINATA_API_URL.includes("/v3/files") ? uploadFileWithPinata(fileName, body) : pinJsonWithPinata(fileName, payload);

const pinBinaryWithPinata = async (fileName, bytes, contentType) => {
  assertValidPinataJwt();

  const form = new FormData();
  form.append("file", makeFileBlob(bytes, contentType), fileName);

  const response = await fetch(PINATA_FILE_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form,
  });

  if (!response.ok) {
    throw httpError(502, `IPFS image pinning failed: ${response.status} ${await response.text()}`);
  }

  const result = await response.json();
  const cid = result.IpfsHash || result.cid || result.Hash || result.data?.cid;
  if (!cid) {
    throw httpError(502, "IPFS image pinning response did not include a CID");
  }

  return { storageRef: `ipfs://${cid}`, gatewayUrl: gatewayUrlFor(cid), cid };
};

const pinBinaryWithKubo = async (fileName, bytes, contentType) => {
  const form = new FormData();
  form.append("file", makeFileBlob(bytes, contentType), fileName);

  const headers = IPFS_API_TOKEN ? { Authorization: `Bearer ${IPFS_API_TOKEN}` } : {};
  const response = await fetch(`${IPFS_API_URL}/api/v0/add?pin=true&cid-version=1`, {
    method: "POST",
    headers,
    body: form,
  });

  if (!response.ok) {
    throw httpError(502, `IPFS image add failed: ${response.status} ${await response.text()}`);
  }

  const text = await response.text();
  const lastLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1);
  const result = lastLine ? JSON.parse(lastLine) : {};
  const cid = result.Hash || result.IpfsHash || result.cid;
  if (!cid) {
    throw httpError(502, "IPFS image add response did not include a CID");
  }

  return { storageRef: `ipfs://${cid}`, gatewayUrl: gatewayUrlFor(cid), cid };
};

const parseDataUrl = (value) => {
  const match = String(value || "").match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) {
    throw httpError(400, "Property photo must be uploaded as a valid image file");
  }

  return {
    contentType: match[1],
    bytes: Buffer.from(match[2], "base64"),
  };
};

const photoExtensionFor = (contentType) => {
  const extensions = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return extensions[contentType] || "jpg";
};

export const uploadPropertyPhoto = async (photoData, photoName = "property-photo") => {
  const { contentType, bytes } = parseDataUrl(photoData);
  if (!contentType.startsWith("image/")) {
    throw httpError(400, "Property photo must be an image");
  }

  const extension = path.extname(photoName) ? "" : `.${photoExtensionFor(contentType)}`;
  const fileName = `${makeId("IMG")}-${String(photoName || "property-photo").replace(/[^\w.-]+/g, "-")}${extension}`;

  if (USE_IPFS_DOCUMENT_STORAGE) {
    if (!HAS_IPFS_DOCUMENT_CONFIG) {
      throw httpError(500, "IPFS document storage is enabled but PINATA_JWT or IPFS_API_URL is missing");
    }

    return PINATA_JWT ? pinBinaryWithPinata(fileName, bytes, contentType) : pinBinaryWithKubo(fileName, bytes, contentType);
  }

  return {
    storageRef: "inline://property-photo",
    gatewayUrl: photoData,
    cid: "",
  };
};

const pinWithKubo = async (fileName, body) => {
  const form = new FormData();
  form.append("file", makeDocumentBlob(body), fileName);

  const headers = IPFS_API_TOKEN ? { Authorization: `Bearer ${IPFS_API_TOKEN}` } : {};
  const response = await fetch(`${IPFS_API_URL}/api/v0/add?pin=true&cid-version=1`, {
    method: "POST",
    headers,
    body: form,
  });

  if (!response.ok) {
    throw httpError(502, `IPFS add failed: ${response.status} ${await response.text()}`);
  }

  const text = await response.text();
  const lastLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1);
  const result = lastLine ? JSON.parse(lastLine) : {};
  const cid = result.Hash || result.IpfsHash || result.cid;
  if (!cid) {
    throw httpError(502, "IPFS add response did not include a CID");
  }

  return { storageRef: `ipfs://${cid}`, gatewayUrl: gatewayUrlFor(cid), cid };
};

const saveEncryptedDocument = async (fileName, payload) => {
  const body = JSON.stringify(payload, null, 2);

  if (USE_IPFS_DOCUMENT_STORAGE) {
    if (!HAS_IPFS_DOCUMENT_CONFIG) {
      throw httpError(500, "IPFS document storage is enabled but PINATA_JWT or IPFS_API_URL is missing");
    }

    return PINATA_JWT ? pinWithPinata(fileName, payload, body) : pinWithKubo(fileName, body);
  }

  await mkdir(DOCS_DIR, { recursive: true });
  await writeFile(path.join(DOCS_DIR, fileName), body);
  return { storageRef: `storage://documents/${fileName}`, gatewayUrl: "", cid: "" };
};

export const encryptDocument = async (documentData, documentName) => {
  const keyMaterial = process.env.DOCUMENT_ENCRYPTION_KEY || "local-development-document-key";
  const key = createHash("sha256").update(keyMaterial).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const clear = Buffer.from(String(documentData || ""), "utf8");
  const encrypted = Buffer.concat([cipher.update(clear), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const fileName = `${makeId("DOC")}.json`;
  const payload = {
    documentName: documentName || "property-document.txt",
    algorithm: "aes-256-gcm",
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    cipherText: encrypted.toString("base64"),
    createdAt: now(),
  };

  const storage = await saveEncryptedDocument(fileName, payload);

  return {
    ...storage,
    hash: sha256Hex(`${documentName || "document"}:${documentData || ""}`),
  };
};

import { MongoClient } from "mongodb";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { DB_FILE, DOCS_DIR, MONGODB_DB_NAME, MONGODB_FALLBACK_TO_LOCAL, MONGODB_URI, USE_MONGODB } from "../config/constants.mjs";
import { baseDb } from "./seed.mjs";
import { isWallet, normalizeRole, normalizeWallet, seededVerifiedWallets } from "../utils/values.mjs";

const collectionNames = {
  meta: "meta",
  users: "users",
  pendingSessions: "pendingSessions",
  walletChallenges: "walletChallenges",
  properties: "properties",
  listings: "listings",
  balances: "balances",
  approvals: "approvals",
  orders: "orders",
  leases: "leases",
  transferEvents: "transferEvents",
  auditLog: "auditLog",
  verifiedWallets: "verifiedWallets",
};

let clientPromise = null;
let mongoReadyPromise = null;
const parseBoolean = (value = "") => ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
const mongoTlsAllowInvalidHostnames = parseBoolean(process.env.MONGODB_TLS_ALLOW_INVALID_HOSTNAMES || "");
let mongoFallbackActive = MONGODB_FALLBACK_TO_LOCAL;

const wait = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const withMongoRetry = async (operation, attempts = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      clientPromise = null;
      mongoReadyPromise = null;
      if (attempt < attempts) {
        await wait(attempt * 1500);
      }
    }
  }

  throw lastError;
};

const mongoClient = async () => {
  if (!clientPromise) {
    const client = new MongoClient(MONGODB_URI, {
      connectTimeoutMS: 15_000,
      maxPoolSize: 10,
      retryReads: true,
      retryWrites: true,
      serverSelectionTimeoutMS: 5_000,
      tlsAllowInvalidHostnames: mongoTlsAllowInvalidHostnames,
    });
    clientPromise = client.connect().catch((error) => {
      clientPromise = null;
      throw error;
    });
  }

  return clientPromise;
};

const mongoDb = async () => {
  const client = await mongoClient();
  return client.db(MONGODB_DB_NAME);
};

const stripMongoId = (doc, { keepStringId = false } = {}) => {
  const clone = { ...doc };
  if (!keepStringId || typeof clone._id !== "string") {
    delete clone._id;
  }
  return clone;
};

const collectionRows = async (database, collectionName, options = {}) => {
  const rows = await database.collection(collectionName).find({}).toArray();
  return rows.map((row) => stripMongoId(row, options));
};

const balancesToObject = (rows) =>
  rows.reduce((acc, row) => {
    const wallet = normalizeWallet(row.wallet);
    if (isWallet(wallet)) {
      acc[wallet] = row.tokens ?? {};
    }
    return acc;
  }, {});

const verifiedWalletsToObject = (rows) =>
  rows.reduce((acc, row) => {
    const wallet = normalizeWallet(row.wallet);
    if (isWallet(wallet)) {
      acc[wallet] = Boolean(row.verified);
    }
    return acc;
  }, {});

const objectToBalances = (balances = {}) =>
  Object.entries(balances).map(([wallet, tokens]) => ({
    wallet: normalizeWallet(wallet),
    tokens: tokens ?? {},
  }));

const objectToVerifiedWallets = (verifiedWallets = {}) =>
  Object.entries(verifiedWallets).map(([wallet, verified]) => ({
    wallet: normalizeWallet(wallet),
    verified: Boolean(verified),
  }));

const dedupeByField = (docs = [], field) => {
  const byField = new Map();
  const withoutField = [];

  for (const doc of docs) {
    const value = doc?.[field];
    if (value === undefined || value === null || value === "") {
      withoutField.push(doc);
      continue;
    }
    byField.set(String(value), doc);
  }

  return [...byField.values(), ...withoutField];
};

const replaceCollection = async (database, collectionName, docs, options = {}) => {
  const collection = database.collection(collectionName);
  await collection.deleteMany({});
  const safeDocs = dedupeByField(docs.map((doc) => stripMongoId(doc, options)), "_id");
  if (safeDocs.length) {
    await collection.insertMany(safeDocs, { ordered: false });
  }
};

const writeMongoDb = async (db) => {
  const database = await mongoDb();

  await database.collection(collectionNames.meta).replaceOne(
    { _id: "state" },
    {
      _id: "state",
      version: db.version ?? 2,
      nextTokenId: db.nextTokenId ?? 1004,
      updatedAt: new Date(),
    },
    { upsert: true },
  );

  await Promise.all([
    replaceCollection(database, collectionNames.users, db.users ?? []),
    replaceCollection(database, collectionNames.pendingSessions, db.pendingSessions ?? []),
    replaceCollection(database, collectionNames.walletChallenges, db.walletChallenges ?? []),
    replaceCollection(database, collectionNames.properties, db.properties ?? [], { keepStringId: true }),
    replaceCollection(database, collectionNames.listings, db.listings ?? []),
    replaceCollection(database, collectionNames.balances, objectToBalances(db.balances)),
    replaceCollection(database, collectionNames.approvals, db.approvals ?? []),
    replaceCollection(database, collectionNames.orders, db.orders ?? []),
    replaceCollection(database, collectionNames.leases, db.leases ?? []),
    replaceCollection(database, collectionNames.transferEvents, db.transferEvents ?? []),
    replaceCollection(database, collectionNames.auditLog, db.auditLog ?? []),
    replaceCollection(database, collectionNames.verifiedWallets, objectToVerifiedWallets(db.verifiedWallets)),
  ]);
};

const initializeMongoDb = async () => {
  const database = await mongoDb();
  await Promise.all([
    database.collection(collectionNames.users).createIndex({ holderDid: 1 }),
    database.collection(collectionNames.users).createIndex({ privyWalletExternalId: 1 }),
    database.collection(collectionNames.users).createIndex({ sessionToken: 1 }),
    database.collection(collectionNames.properties).createIndex({ tokenId: 1 }),
    database.collection(collectionNames.listings).createIndex({ tokenId: 1, status: 1 }),
    database.collection(collectionNames.orders).createIndex({ buyerWallet: 1 }),
    database.collection(collectionNames.leases).createIndex({ tokenId: 1, status: 1 }),
    database.collection(collectionNames.leases).createIndex({ lessorWallet: 1 }),
    database.collection(collectionNames.leases).createIndex({ lesseeWallet: 1 }),
    database.collection(collectionNames.verifiedWallets).createIndex({ wallet: 1 }, { unique: true }),
  ]);

  const state = await database.collection(collectionNames.meta).findOne({ _id: "state" });
  if (!state) {
    await writeMongoDb(baseDb());
  }
};

const ensureMongoDb = async () => {
  if (!mongoReadyPromise) {
    mongoReadyPromise = withMongoRetry(initializeMongoDb);
  }

  return mongoReadyPromise;
};

const normalizeDb = (db) => {
  const normalizedDb = {
    ...baseDb(),
    ...db,
    users: db.users ?? [],
    pendingSessions: db.pendingSessions ?? [],
    walletChallenges: db.walletChallenges ?? [],
    properties: dedupeByField(db.properties ?? [], "_id"),
    listings: db.listings ?? [],
    verifiedWallets: hydrateVerifiedWallets(db),
    balances: db.balances ?? {},
    approvals: db.approvals ?? [],
    orders: db.orders ?? [],
    leases: db.leases ?? [],
    transferEvents: db.transferEvents ?? [],
    auditLog: db.auditLog ?? [],
  };

  normalizedDb.users = normalizedDb.users.map((user) => ({
    ...user,
    role: normalizeRole(user.role),
  }));
  normalizedDb.pendingSessions = normalizedDb.pendingSessions.map((session) => ({
    ...session,
    role: normalizeRole(session.role),
  }));

  return normalizedDb;
};

const localBackupPath = () => `${DB_FILE}.${new Date().toISOString().replace(/[:.]/g, "-")}.corrupt`;

const writeLocalDb = async (db) => {
  await mkdir(DOCS_DIR, { recursive: true });
  const tempFile = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempFile, JSON.stringify(db, null, 2));
  await rename(tempFile, DB_FILE);
};

const resetLocalDb = async (reason, raw = "") => {
  const backupFile = localBackupPath();
  await mkdir(DOCS_DIR, { recursive: true });
  await writeFile(backupFile, raw);

  const freshDb = baseDb();
  await writeLocalDb(freshDb);
  console.warn(`Local JSON database was unreadable (${reason}); reset seed data at ${DB_FILE}. Backup saved to ${backupFile}`);
  return freshDb;
};

const readLocalDb = async () => {
  await ensureLocalDb();
  const raw = await readFile(DB_FILE, "utf8");

  if (!raw.trim()) {
    return normalizeDb(await resetLocalDb("empty file", raw));
  }

  try {
    return normalizeDb(JSON.parse(raw));
  } catch (error) {
    const reason = error instanceof Error ? error.message : "invalid JSON";
    return normalizeDb(await resetLocalDb(reason, raw));
  }
};

export const ensureDb = async () => {
  if (USE_MONGODB) {
    if (mongoFallbackActive && MONGODB_FALLBACK_TO_LOCAL) {
      await ensureLocalDb();
      return;
    }

    try {
      await ensureMongoDb();
      mongoFallbackActive = false;
    } catch (error) {
      if (!MONGODB_FALLBACK_TO_LOCAL) {
        throw error;
      }
      mongoFallbackActive = true;
      console.warn(`MongoDB unavailable, using local JSON fallback: ${error instanceof Error ? error.message : "Unknown MongoDB error"}`);
      await ensureLocalDb();
    }
    return;
  }

  await ensureLocalDb();
};

const ensureLocalDb = async () => {
  await mkdir(DOCS_DIR, { recursive: true });

  try {
    await readFile(DB_FILE, "utf8");
  } catch {
    await writeLocalDb(baseDb());
  }
};

export const normalizeVerifiedWallets = (wallets = {}) =>
  Object.entries(wallets).reduce((acc, [wallet, verified]) => {
    const normalized = normalizeWallet(wallet);
    if (isWallet(normalized)) {
      acc[normalized] = Boolean(verified);
    }
    return acc;
  }, {});

export const hydrateVerifiedWallets = (db) => {
  const verifiedWallets = {
    ...seededVerifiedWallets(),
    ...normalizeVerifiedWallets(db.verifiedWallets),
  };

  for (const user of db.users ?? []) {
    const wallet = normalizeWallet(user.walletAddress);
    if (isWallet(wallet) && user.ndiVerifiedAt && !Object.prototype.hasOwnProperty.call(verifiedWallets, wallet)) {
      verifiedWallets[wallet] = true;
    }
  }

  return verifiedWallets;
};

export const readDb = async () => {
  await ensureDb();

  if (USE_MONGODB && !mongoFallbackActive) {
    let database;
    try {
      database = await mongoDb();
    } catch (error) {
      if (!MONGODB_FALLBACK_TO_LOCAL) {
        throw error;
      }
      mongoFallbackActive = true;
      console.warn(`MongoDB read unavailable, using local JSON fallback: ${error instanceof Error ? error.message : "Unknown MongoDB error"}`);
      return readLocalDb();
    }

    const [
      meta,
      users,
      pendingSessions,
      walletChallenges,
      properties,
      listings,
      balanceRows,
      approvals,
      orders,
      leases,
      transferEvents,
      auditLog,
      verifiedWalletRows,
    ] = await Promise.all([
      database.collection(collectionNames.meta).findOne({ _id: "state" }),
      collectionRows(database, collectionNames.users),
      collectionRows(database, collectionNames.pendingSessions),
      collectionRows(database, collectionNames.walletChallenges),
      collectionRows(database, collectionNames.properties, { keepStringId: true }),
      collectionRows(database, collectionNames.listings),
      collectionRows(database, collectionNames.balances),
      collectionRows(database, collectionNames.approvals),
      collectionRows(database, collectionNames.orders),
      collectionRows(database, collectionNames.leases),
      collectionRows(database, collectionNames.transferEvents),
      collectionRows(database, collectionNames.auditLog),
      collectionRows(database, collectionNames.verifiedWallets),
    ]);

    return normalizeDb({
      version: meta?.version ?? 2,
      nextTokenId: meta?.nextTokenId ?? 1004,
      users,
      pendingSessions,
      walletChallenges,
      properties,
      listings,
      balances: balancesToObject(balanceRows),
      approvals,
      orders,
      leases,
      transferEvents,
      auditLog,
      verifiedWallets: verifiedWalletsToObject(verifiedWalletRows),
    });
  }

  return readLocalDb();
};

export const writeDb = async (db) => {
  if (USE_MONGODB && !mongoFallbackActive) {
    try {
      await writeMongoDb(db);
      return;
    } catch (error) {
      if (!MONGODB_FALLBACK_TO_LOCAL) {
        throw error;
      }
      mongoFallbackActive = true;
      console.warn(`MongoDB write unavailable, using local JSON fallback: ${error instanceof Error ? error.message : "Unknown MongoDB error"}`);
    }
  }

  await ensureLocalDb();
  await writeLocalDb(db);
};

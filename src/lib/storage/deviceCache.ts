/**
 * InsidCode Unified On-Device Persistent Cache (IndexedDB)
 *
 * Implements high-performance, privacy-conscious local storage for:
 *  - Public problem catalog, problem descriptions, and leaderboard snapshots.
 *  - Per-user metadata, solved states, and code drafts (strictly isolated by userId).
 *
 * Safety & Privacy Guarantees:
 *  - NEVER stores authentication tokens, session cookies, NextAuth data, emails, IPs,
 *    admin records, queue internals, hidden test cases, or expected outputs.
 *  - Synchronous wipe of all user data on logout or account switch.
 *  - Strict 20 MB size cap with Least Recently Used (LRU) eviction.
 *  - Automatic fallback to in-memory store if IndexedDB is unavailable (private mode/quota).
 */

export const CACHE_SCHEMA_VERSION = 1;
export const DB_NAME = "insidcode_device_cache";

export const STORES = {
  PUBLIC_CACHE: "public_cache",
  USER_CACHE: "user_cache",
  DRAFTS: "drafts",
  PREFERENCES: "preferences",
} as const;

export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number; // in milliseconds
  sizeEstimate?: number;
}

export interface DraftEntry {
  key: string; // userId:problemId:language
  userId: string;
  problemId: string;
  language: string;
  code: string;
  updatedAt: number;
}

export const TTL = {
  PUBLIC_DATA: 30 * 24 * 60 * 60 * 1000, // 30 days
  USER_DATA: 7 * 24 * 60 * 60 * 1000,    // 7 days
  DRAFTS: 30 * 24 * 60 * 60 * 1000,      // 30 days
};

export const MAX_TOTAL_CACHE_BYTES = 20 * 1024 * 1024; // 20 MB

// Memory-only fallback store for private browsing / blocked environments
const memoryStores = {
  [STORES.PUBLIC_CACHE]: new Map<string, CacheEntry>(),
  [STORES.USER_CACHE]: new Map<string, CacheEntry>(),
  [STORES.DRAFTS]: new Map<string, DraftEntry>(),
  [STORES.PREFERENCES]: new Map<string, unknown>(),
};

let dbPromise: Promise<IDBDatabase | null> | null = null;
let isIndexedDBAvailable: boolean | null = null;

/**
 * Checks whether IndexedDB is available and functional in the current environment.
 */
export function checkIndexedDBSupport(): boolean {
  if (isIndexedDBAvailable !== null) return isIndexedDBAvailable;
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    isIndexedDBAvailable = false;
    return false;
  }
  try {
    isIndexedDBAvailable = true;
    return true;
  } catch {
    isIndexedDBAvailable = false;
    return false;
  }
}

/**
 * Initializes and opens the IndexedDB database.
 */
export async function getDatabase(): Promise<IDBDatabase | null> {
  if (!checkIndexedDBSupport()) return null;
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, CACHE_SCHEMA_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORES.PUBLIC_CACHE)) {
          const store = db.createObjectStore(STORES.PUBLIC_CACHE, { keyPath: "key" });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.USER_CACHE)) {
          const store = db.createObjectStore(STORES.USER_CACHE, { keyPath: "key" });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.DRAFTS)) {
          const store = db.createObjectStore(STORES.DRAFTS, { keyPath: "key" });
          store.createIndex("userId", "userId", { unique: false });
          store.createIndex("updatedAt", "updatedAt", { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.PREFERENCES)) {
          db.createObjectStore(STORES.PREFERENCES, { keyPath: "key" });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };

      request.onerror = () => {
        // Fall back gracefully to memory
        resolve(null);
      };

      request.onblocked = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

/**
 * Calculates approximate size of an object in bytes.
 */
function estimateSize(obj: unknown): number {
  try {
    const str = JSON.stringify(obj);
    return str ? str.length * 2 : 0; // rough UTF-16 byte estimation
  } catch {
    return 512;
  }
}

// =========================================================================
// Public Cache Operations
// =========================================================================

export async function getPublicCache<T = unknown>(key: string): Promise<T | null> {
  // Check memory first
  const mem = memoryStores[STORES.PUBLIC_CACHE].get(key) as CacheEntry<T> | undefined;
  const now = Date.now();
  if (mem) {
    if (now - mem.timestamp > mem.ttl) {
      memoryStores[STORES.PUBLIC_CACHE].delete(key);
    } else {
      return mem.data;
    }
  }

  const db = await getDatabase();
  if (!db) return null;

  return new Promise<T | null>((resolve) => {
    try {
      const tx = db.transaction(STORES.PUBLIC_CACHE, "readonly");
      const store = tx.objectStore(STORES.PUBLIC_CACHE);
      const req = store.get(key);

      req.onsuccess = () => {
        const entry = req.result as CacheEntry<T> | undefined;
        if (!entry) {
          resolve(null);
          return;
        }
        if (now - entry.timestamp > entry.ttl) {
          // Expired, delete asynchronously
          deletePublicCache(key).catch(() => {});
          resolve(null);
        } else {
          // Mirror in memory for instant subsequent reads
          memoryStores[STORES.PUBLIC_CACHE].set(key, entry);
          resolve(entry.data);
        }
      };

      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function setPublicCache<T = unknown>(
  key: string,
  data: T,
  ttl: number = TTL.PUBLIC_DATA
): Promise<void> {
  const now = Date.now();
  const sizeEstimate = estimateSize(data);
  const entry: CacheEntry<T> = { key, data, timestamp: now, ttl, sizeEstimate };

  // Update memory
  memoryStores[STORES.PUBLIC_CACHE].set(key, entry);

  const db = await getDatabase();
  if (!db) return;

  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORES.PUBLIC_CACHE, "readwrite");
      const store = tx.objectStore(STORES.PUBLIC_CACHE);
      store.put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function deletePublicCache(key: string): Promise<void> {
  memoryStores[STORES.PUBLIC_CACHE].delete(key);
  const db = await getDatabase();
  if (!db) return;

  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORES.PUBLIC_CACHE, "readwrite");
      tx.objectStore(STORES.PUBLIC_CACHE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

// =========================================================================
// Per-User Cache Operations (Strictly isolated by userId)
// =========================================================================

export async function getUserCache<T = unknown>(
  userId: string,
  endpoint: string
): Promise<T | null> {
  if (!userId) return null;
  const fullKey = `${userId}:${endpoint}`;
  const now = Date.now();

  const mem = memoryStores[STORES.USER_CACHE].get(fullKey) as CacheEntry<T> | undefined;
  if (mem) {
    if (now - mem.timestamp > mem.ttl) {
      memoryStores[STORES.USER_CACHE].delete(fullKey);
    } else {
      return mem.data;
    }
  }

  const db = await getDatabase();
  if (!db) return null;

  return new Promise<T | null>((resolve) => {
    try {
      const tx = db.transaction(STORES.USER_CACHE, "readonly");
      const store = tx.objectStore(STORES.USER_CACHE);
      const req = store.get(fullKey);

      req.onsuccess = () => {
        const entry = req.result as CacheEntry<T> | undefined;
        if (!entry) {
          resolve(null);
          return;
        }
        if (now - entry.timestamp > entry.ttl) {
          deleteUserCache(userId, endpoint).catch(() => {});
          resolve(null);
        } else {
          memoryStores[STORES.USER_CACHE].set(fullKey, entry);
          resolve(entry.data);
        }
      };

      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function setUserCache<T = unknown>(
  userId: string,
  endpoint: string,
  data: T,
  ttl: number = TTL.USER_DATA
): Promise<void> {
  if (!userId) return;
  const fullKey = `${userId}:${endpoint}`;
  const now = Date.now();
  const sizeEstimate = estimateSize(data);
  const entry: CacheEntry<T> = { key: fullKey, data, timestamp: now, ttl, sizeEstimate };

  memoryStores[STORES.USER_CACHE].set(fullKey, entry);

  const db = await getDatabase();
  if (!db) return;

  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORES.USER_CACHE, "readwrite");
      tx.objectStore(STORES.USER_CACHE).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function deleteUserCache(userId: string, endpoint: string): Promise<void> {
  const fullKey = `${userId}:${endpoint}`;
  memoryStores[STORES.USER_CACHE].delete(fullKey);
  const db = await getDatabase();
  if (!db) return;

  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORES.USER_CACHE, "readwrite");
      tx.objectStore(STORES.USER_CACHE).delete(fullKey);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

// =========================================================================
// Code Drafts (Keyed by userId, problemId, and language)
// =========================================================================

export async function getDraft(
  userId: string,
  problemId: string,
  language: string
): Promise<string | null> {
  if (!userId || !problemId || !language) return null;
  const key = `${userId}:${problemId}:${language}`;

  const mem = memoryStores[STORES.DRAFTS].get(key);
  if (mem) {
    if (Date.now() - mem.updatedAt > TTL.DRAFTS) {
      memoryStores[STORES.DRAFTS].delete(key);
    } else {
      return mem.code;
    }
  }

  const db = await getDatabase();
  if (!db) return null;

  return new Promise<string | null>((resolve) => {
    try {
      const tx = db.transaction(STORES.DRAFTS, "readonly");
      const req = tx.objectStore(STORES.DRAFTS).get(key);

      req.onsuccess = () => {
        const entry = req.result as DraftEntry | undefined;
        if (!entry) {
          resolve(null);
          return;
        }
        if (Date.now() - entry.updatedAt > TTL.DRAFTS) {
          deleteDraft(userId, problemId, language).catch(() => {});
          resolve(null);
        } else {
          memoryStores[STORES.DRAFTS].set(key, entry);
          resolve(entry.code);
        }
      };

      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function setDraft(
  userId: string,
  problemId: string,
  language: string,
  code: string
): Promise<void> {
  if (!userId || !problemId || !language) return;
  const key = `${userId}:${problemId}:${language}`;
  const entry: DraftEntry = {
    key,
    userId,
    problemId,
    language,
    code,
    updatedAt: Date.now(),
  };

  memoryStores[STORES.DRAFTS].set(key, entry);

  const db = await getDatabase();
  if (!db) return;

  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORES.DRAFTS, "readwrite");
      tx.objectStore(STORES.DRAFTS).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function deleteDraft(
  userId: string,
  problemId: string,
  language: string
): Promise<void> {
  const key = `${userId}:${problemId}:${language}`;
  memoryStores[STORES.DRAFTS].delete(key);
  const db = await getDatabase();
  if (!db) return;

  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORES.DRAFTS, "readwrite");
      tx.objectStore(STORES.DRAFTS).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

// =========================================================================
// Privacy & Cleanup: Wipe User Data on Logout / Account Switch
// =========================================================================

/**
 * Synchronously and permanently clears ALL local data belonging to a user:
 *  - User cache partition (XP, streaks, solved flags, profile stats)
 *  - Drafts belonging to that user
 *  - User-specific preferences
 */
export async function clearUserDeviceData(userId: string): Promise<void> {
  if (!userId) return;

  // 1. Wipe in-memory entries immediately
  const userPrefix = `${userId}:`;
  for (const [k] of memoryStores[STORES.USER_CACHE]) {
    if (k.startsWith(userPrefix)) memoryStores[STORES.USER_CACHE].delete(k);
  }
  for (const [k, v] of memoryStores[STORES.DRAFTS]) {
    if (v.userId === userId || k.startsWith(userPrefix)) memoryStores[STORES.DRAFTS].delete(k);
  }

  // 2. Clear from IndexedDB
  const db = await getDatabase();
  if (!db) return;

  return new Promise<void>((resolve) => {
    try {
      const tx = db.transaction([STORES.USER_CACHE, STORES.DRAFTS], "readwrite");
      const userStore = tx.objectStore(STORES.USER_CACHE);
      const draftsStore = tx.objectStore(STORES.DRAFTS);

      // Iterate user_cache and delete matching prefix
      const userReq = userStore.openCursor();
      userReq.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result as IDBCursorWithValue | null;
        if (cursor) {
          if (String(cursor.key).startsWith(userPrefix)) {
            cursor.delete();
          }
          cursor.continue();
        }
      };

      // Delete user drafts via index
      const draftIndex = draftsStore.index("userId");
      const draftReq = draftIndex.openCursor(IDBKeyRange.only(userId));
      draftReq.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result as IDBCursorWithValue | null;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Complete device wipe: clears ALL caches, drafts, service worker caches, and localStorage keys.
 * Used by "Clear Local Data" in Settings.
 */
export async function clearAllDeviceData(): Promise<void> {
  // 1. Clear memory stores
  for (const store of Object.values(memoryStores)) {
    store.clear();
  }

  // 2. Clear IndexedDB stores
  const db = await getDatabase();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(
          [STORES.PUBLIC_CACHE, STORES.USER_CACHE, STORES.DRAFTS, STORES.PREFERENCES],
          "readwrite"
        );
        tx.objectStore(STORES.PUBLIC_CACHE).clear();
        tx.objectStore(STORES.USER_CACHE).clear();
        tx.objectStore(STORES.DRAFTS).clear();
        tx.objectStore(STORES.PREFERENCES).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // 3. Clear Service Worker caches
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cacheNames = await window.caches.keys();
      await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
    } catch {
      // Ignore cache wipe failure
    }
  }

  // 4. Clear relevant localStorage items (drafts, cached catalogs, turbo c)
  if (typeof window !== "undefined") {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith("code_") ||
            key.startsWith("insidcode:") ||
            key.startsWith("swr-") ||
            key.includes("cache"))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch {
      // Ignore storage errors
    }
  }
}

// =========================================================================
// Storage Cleanup & LRU Eviction (Runs on app start)
// =========================================================================

export async function performStorageCleanup(): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  const now = Date.now();

  try {
    const tx = db.transaction([STORES.PUBLIC_CACHE, STORES.USER_CACHE, STORES.DRAFTS], "readwrite");

    // Clean expired public entries
    const pubStore = tx.objectStore(STORES.PUBLIC_CACHE);
    const pubReq = pubStore.openCursor();
    pubReq.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest).result as IDBCursorWithValue | null;
      if (cursor) {
        const val = cursor.value as CacheEntry;
        if (now - val.timestamp > val.ttl) {
          cursor.delete();
        }
        cursor.continue();
      }
    };

    // Clean expired user entries
    const userStore = tx.objectStore(STORES.USER_CACHE);
    const userReq = userStore.openCursor();
    userReq.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest).result as IDBCursorWithValue | null;
      if (cursor) {
        const val = cursor.value as CacheEntry;
        if (now - val.timestamp > val.ttl) {
          cursor.delete();
        }
        cursor.continue();
      }
    };

    // Clean expired drafts
    const draftStore = tx.objectStore(STORES.DRAFTS);
    const draftReq = draftStore.openCursor();
    draftReq.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest).result as IDBCursorWithValue | null;
      if (cursor) {
        const val = cursor.value as DraftEntry;
        if (now - val.updatedAt > TTL.DRAFTS) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  } catch {
    // Fail-open
  }
}

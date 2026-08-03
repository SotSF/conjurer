// Local autosave history for the experience editor. Stored in IndexedDB so
// large experience JSON is not constrained by localStorage quotas. At most
// MAX_AUTOSAVES entries are kept per experience key.

const DB_NAME = "conjurer-autosaves";
const DB_VERSION = 1;
const STORE_NAME = "autosaves";

export const MAX_AUTOSAVES = 15;

export type AutosaveRecord = {
  id: number;
  experienceKey: string;
  savedAt: number;
  snapshot: string;
};

export type AutosaveMeta = {
  id: number;
  experienceKey: string;
  savedAt: number;
};

const openDb = (): Promise<IDBDatabase> => {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available"));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("experienceKey", "experienceKey", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to open autosave DB"));
  });
};

const withStore = async <T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      const result = fn(store);
      result.onsuccess = () => resolve(result.result);
      result.onerror = () =>
        reject(result.error ?? new Error("Autosave request failed"));
      tx.onerror = () =>
        reject(tx.error ?? new Error("Autosave transaction failed"));
    });
  } finally {
    db.close();
  }
};

const listRecordsForKey = async (
  experienceKey: string,
): Promise<AutosaveRecord[]> => {
  const records = await withStore<AutosaveRecord[]>("readonly", (store) =>
    store.index("experienceKey").getAll(experienceKey),
  );
  return records.sort((a, b) => b.savedAt - a.savedAt);
};

const pruneExcess = async (experienceKey: string): Promise<void> => {
  const records = await listRecordsForKey(experienceKey);
  if (records.length <= MAX_AUTOSAVES) return;

  const toDelete = records.slice(MAX_AUTOSAVES);
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      for (const record of toDelete) {
        store.delete(record.id);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error("Failed to prune autosaves"));
    });
  } finally {
    db.close();
  }
};

export const listAutosaves = async (
  experienceKey: string,
): Promise<AutosaveMeta[]> => {
  if (!experienceKey) return [];
  const records = await listRecordsForKey(experienceKey);
  return records.map(({ id, experienceKey: key, savedAt }) => ({
    id,
    experienceKey: key,
    savedAt,
  }));
};

export const getAutosave = async (
  id: number,
): Promise<AutosaveRecord | undefined> => {
  return withStore<AutosaveRecord | undefined>("readonly", (store) =>
    store.get(id),
  );
};

export const addAutosave = async (
  experienceKey: string,
  snapshot: string,
  savedAt: number = Date.now(),
): Promise<AutosaveMeta> => {
  if (!experienceKey) {
    throw new Error("Cannot autosave without an experience key");
  }

  const id = (await withStore<IDBValidKey>("readwrite", (store) =>
    store.add({ experienceKey, savedAt, snapshot }),
  )) as number;
  await pruneExcess(experienceKey);
  return { id, experienceKey, savedAt };
};

/** Move autosave history when an experience gets a stable id/name key. */
export const migrateAutosaves = async (
  fromKey: string,
  toKey: string,
): Promise<void> => {
  if (!fromKey || !toKey || fromKey === toKey) return;

  const records = await listRecordsForKey(fromKey);
  if (records.length === 0) return;

  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      for (const record of records) {
        store.put({ ...record, experienceKey: toKey });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error("Failed to migrate autosaves"));
    });
  } finally {
    db.close();
  }

  await pruneExcess(toKey);
};

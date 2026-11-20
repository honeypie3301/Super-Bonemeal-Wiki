import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  startAt,
  Timestamp,
  where,
  Firestore,
  DocumentData
} from 'firebase/firestore';

export interface ArchivedTelemetryLog {
  id: string;
  timestamp: string;
  tsMs: number;
  type: 'unique' | 'repeat' | 'click' | string;
  slug: string;
  visitorId: string;
  os?: string;
  browser?: string;
  target?: string;
  page?: string;
  category?: string;
}

export interface ArchiveSyncStatus {
  totalIndexed: number;
  isSyncing: boolean;
  isComplete: boolean;
  quotaExceeded: boolean;
  error: string | null;
}

interface ArchiveMeta {
  backfillComplete: boolean;
  newestTsMs: number | null;
  oldestTsMs: number | null;
}

const DB_NAME = 'backwoods_telemetry_archive_v1';
const LOGS_STORE = 'logs';
const META_KEY = 'backwoods_telemetry_archive_meta_v1';
const BATCH_SIZE = 1000;

function parseTimestamp(rawTs: any): { iso: string; ms: number } {
  if (rawTs) {
    if (typeof rawTs.toDate === 'function') {
      const d = rawTs.toDate();
      const ms = d.getTime();
      if (!Number.isNaN(ms)) return { iso: d.toISOString(), ms };
    } else if (typeof rawTs.seconds === 'number') {
      const ms = rawTs.seconds * 1000 + Math.floor((rawTs.nanoseconds || 0) / 1e6);
      return { iso: new Date(ms).toISOString(), ms };
    } else {
      const d = new Date(rawTs);
      const ms = d.getTime();
      if (!Number.isNaN(ms)) return { iso: d.toISOString(), ms };
    }
  }
  const now = Date.now();
  return { iso: new Date(now).toISOString(), ms: now };
}

function docToLog(id: string, data: DocumentData): ArchivedTelemetryLog {
  const { iso, ms } = parseTimestamp(data.timestamp);
  return {
    id,
    timestamp: iso,
    tsMs: ms,
    type: data.type || 'repeat',
    slug: data.slug || 'home',
    visitorId: data.visitorId || 'unknown',
    os: data.os,
    browser: data.browser,
    target: data.target,
    page: data.page,
    category: data.category
  };
}

function loadMeta(): ArchiveMeta {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        backfillComplete: Boolean(parsed.backfillComplete),
        newestTsMs: typeof parsed.newestTsMs === 'number' ? parsed.newestTsMs : null,
        oldestTsMs: typeof parsed.oldestTsMs === 'number' ? parsed.oldestTsMs : null
      };
    }
  } catch {
    // Ignore storage errors
  }
  return { backfillComplete: false, newestTsMs: null, oldestTsMs: null };
}

function saveMeta(meta: ArchiveMeta) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // Ignore storage errors
  }
}

function openArchiveDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const idb = req.result;
        if (!idb.objectStoreNames.contains(LOGS_STORE)) {
          idb.createObjectStore(LOGS_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function readAllFromIDB(): Promise<ArchivedTelemetryLog[]> {
  const idb = await openArchiveDB();
  if (!idb) return [];
  return new Promise((resolve) => {
    try {
      const tx = idb.transaction(LOGS_STORE, 'readonly');
      const store = tx.objectStore(LOGS_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        idb.close();
        resolve((req.result as ArchivedTelemetryLog[]) || []);
      };
      req.onerror = () => {
        idb.close();
        resolve([]);
      };
    } catch {
      try { idb.close(); } catch {}
      resolve([]);
    }
  });
}

async function writeBatchToIDB(logs: ArchivedTelemetryLog[]): Promise<void> {
  if (logs.length === 0) return;
  const idb = await openArchiveDB();
  if (!idb) return;
  return new Promise((resolve) => {
    try {
      const tx = idb.transaction(LOGS_STORE, 'readwrite');
      const store = tx.objectStore(LOGS_STORE);
      for (const log of logs) {
        store.put(log);
      }
      tx.oncomplete = () => {
        idb.close();
        resolve();
      };
      tx.onerror = () => {
        idb.close();
        resolve();
      };
    } catch {
      try { idb.close(); } catch {}
      resolve();
    }
  });
}

// Singleton in-memory archive state across modal interactions
const archiveMap = new Map<string, ArchivedTelemetryLog>();
let metaState: ArchiveMeta = loadMeta();
let idbHydrated = false;
let idbHydrationPromise: Promise<void> | null = null;
let activeSyncPromise: Promise<void> | null = null;
let lastForwardSyncAt = 0;

let currentStatus: ArchiveSyncStatus = {
  totalIndexed: 0,
  isSyncing: false,
  isComplete: metaState.backfillComplete,
  quotaExceeded: false,
  error: null
};

type ArchiveListener = (logs: Map<string, ArchivedTelemetryLog>, status: ArchiveSyncStatus) => void;
const listeners = new Set<ArchiveListener>();

function notifyListeners() {
  currentStatus = {
    ...currentStatus,
    totalIndexed: archiveMap.size,
    isComplete: metaState.backfillComplete
  };
  listeners.forEach((cb) => {
    try {
      cb(archiveMap, currentStatus);
    } catch {
      // Ignore subscriber errors
    }
  });
}

export function subscribeTelemetryArchive(cb: ArchiveListener): () => void {
  listeners.add(cb);
  cb(archiveMap, currentStatus);
  return () => {
    listeners.delete(cb);
  };
}

export function getArchiveSnapshot(): {
  logs: Map<string, ArchivedTelemetryLog>;
  status: ArchiveSyncStatus;
} {
  return { logs: archiveMap, status: currentStatus };
}

export function mergeLiveLogsIntoArchive(liveLogs: Array<{
  id?: string;
  timestamp: string;
  type: string;
  slug: string;
  visitorId: string;
  os?: string;
  browser?: string;
  target?: string;
  page?: string;
  category?: string;
}>) {
  const newlyAdded: ArchivedTelemetryLog[] = [];
  for (const item of liveLogs) {
    if (!item.id) continue;
    if (!archiveMap.has(item.id)) {
      const ms = new Date(item.timestamp).getTime() || Date.now();
      const record: ArchivedTelemetryLog = {
        id: item.id,
        timestamp: item.timestamp,
        tsMs: ms,
        type: item.type,
        slug: item.slug,
        visitorId: item.visitorId,
        os: item.os,
        browser: item.browser,
        target: item.target,
        page: item.page,
        category: item.category
      };
      archiveMap.set(item.id, record);
      newlyAdded.push(record);
      if (metaState.newestTsMs === null || ms > metaState.newestTsMs) {
        metaState.newestTsMs = ms;
      }
      if (metaState.oldestTsMs === null || ms < metaState.oldestTsMs) {
        metaState.oldestTsMs = ms;
      }
    }
  }
  if (newlyAdded.length > 0) {
    saveMeta(metaState);
    void writeBatchToIDB(newlyAdded);
    notifyListeners();
  }
}

export async function ensureArchiveHydrated(): Promise<void> {
  if (idbHydrated) return;
  if (!idbHydrationPromise) {
    idbHydrationPromise = (async () => {
      const cached = await readAllFromIDB();
      let minTs: number | null = metaState.oldestTsMs;
      let maxTs: number | null = metaState.newestTsMs;
      for (const item of cached) {
        archiveMap.set(item.id, item);
        if (minTs === null || item.tsMs < minTs) minTs = item.tsMs;
        if (maxTs === null || item.tsMs > maxTs) maxTs = item.tsMs;
      }
      if (cached.length > 0) {
        metaState.oldestTsMs = minTs;
        metaState.newestTsMs = maxTs;
        saveMeta(metaState);
      } else if (metaState.backfillComplete) {
        // IDB was cleared externally while localStorage meta remained
        metaState = { backfillComplete: false, newestTsMs: null, oldestTsMs: null };
        saveMeta(metaState);
      }
      idbHydrated = true;
      notifyListeners();
    })();
  }
  await idbHydrationPromise;
}

export async function syncFullTelemetryArchive(
  db: Firestore,
  options?: { forceDelta?: boolean }
): Promise<void> {
  await ensureArchiveHydrated();

  if (activeSyncPromise) {
    return activeSyncPromise;
  }

  const now = Date.now();
  const shouldSkipDelta =
    metaState.backfillComplete &&
    !options?.forceDelta &&
    now - lastForwardSyncAt < 15000;

  if (shouldSkipDelta) {
    notifyListeners();
    return;
  }

  activeSyncPromise = (async () => {
    currentStatus = {
      ...currentStatus,
      isSyncing: true,
      quotaExceeded: false,
      error: null
    };
    notifyListeners();

    const logsCol = collection(db, 'telemetry_logs');

    const ingestSnapshot = async (
      docs: QueryDocumentSnapshot<DocumentData>[]
    ): Promise<number> => {
      const batchToSave: ArchivedTelemetryLog[] = [];
      let addedCount = 0;
      for (const docSnap of docs) {
        const log = docToLog(docSnap.id, docSnap.data());
        if (!archiveMap.has(log.id)) {
          addedCount++;
        }
        archiveMap.set(log.id, log);
        batchToSave.push(log);
        if (metaState.newestTsMs === null || log.tsMs > metaState.newestTsMs) {
          metaState.newestTsMs = log.tsMs;
        }
        if (metaState.oldestTsMs === null || log.tsMs < metaState.oldestTsMs) {
          metaState.oldestTsMs = log.tsMs;
        }
      }
      saveMeta(metaState);
      await writeBatchToIDB(batchToSave);
      notifyListeners();
      return addedCount;
    };

    try {
      // 1. Forward delta sync: fetch any logs newer than our newest cached timestamp
      if (metaState.newestTsMs !== null) {
        const forwardStartMs = metaState.newestTsMs;
        let deltaCursor: QueryDocumentSnapshot<DocumentData> | null = null;
        while (true) {
          const deltaQ = deltaCursor
            ? query(
                logsCol,
                where('timestamp', '>', Timestamp.fromMillis(forwardStartMs)),
                orderBy('timestamp', 'asc'),
                startAfter(deltaCursor),
                limit(BATCH_SIZE)
              )
            : query(
                logsCol,
                where('timestamp', '>', Timestamp.fromMillis(forwardStartMs)),
                orderBy('timestamp', 'asc'),
                limit(BATCH_SIZE)
              );

          const snap = await getDocs(deltaQ);
          if (snap.empty) break;
          await ingestSnapshot(snap.docs);
          if (snap.docs.length < BATCH_SIZE) break;
          deltaCursor = snap.docs[snap.docs.length - 1];
        }
      }
      lastForwardSyncAt = Date.now();

      // 2. Full historical backward backfill until every document in telemetry_logs is indexed
      if (!metaState.backfillComplete) {
        let backCursor: QueryDocumentSnapshot<DocumentData> | null = null;
        let isFirstBackPage = true;

        while (true) {
          let backQ;
          if (backCursor) {
            backQ = query(
              logsCol,
              orderBy('timestamp', 'desc'),
              startAfter(backCursor),
              limit(BATCH_SIZE)
            );
          } else if (isFirstBackPage && metaState.oldestTsMs !== null) {
            backQ = query(
              logsCol,
              orderBy('timestamp', 'desc'),
              startAt(Timestamp.fromMillis(metaState.oldestTsMs)),
              limit(BATCH_SIZE)
            );
          } else {
            backQ = query(
              logsCol,
              orderBy('timestamp', 'desc'),
              limit(BATCH_SIZE)
            );
          }
          isFirstBackPage = false;

          const snap = await getDocs(backQ);
          if (snap.empty) {
            metaState.backfillComplete = true;
            saveMeta(metaState);
            break;
          }

          await ingestSnapshot(snap.docs);

          if (snap.docs.length < BATCH_SIZE) {
            metaState.backfillComplete = true;
            saveMeta(metaState);
            break;
          }

          backCursor = snap.docs[snap.docs.length - 1];
        }
      }
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err instanceof Error ? err.message : String(err || '');
      if (code === 'resource-exhausted' || /quota/i.test(msg)) {
        currentStatus.quotaExceeded = true;
        currentStatus.error = 'Daily Firestore read quota reached; searching cached records so far.';
      } else {
        currentStatus.error = msg || 'Archive sync interrupted.';
      }
    } finally {
      currentStatus.isSyncing = false;
      activeSyncPromise = null;
      notifyListeners();
    }
  })();

  return activeSyncPromise;
}

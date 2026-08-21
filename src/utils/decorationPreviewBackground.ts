export type PreviewBackgroundFit = "contain" | "cover" | "natural";
export type PreviewCanvasView = "fit" | "actual";

export interface PreviewMotionPosition {
  x: number;
  y: number;
}

export interface DecorationPreviewBackgroundRecord {
  blob: Blob;
  fileName: string;
  naturalWidth: number;
  naturalHeight: number;
  logicalWidth: number;
  logicalHeight: number;
  imageFit: PreviewBackgroundFit;
  viewMode: PreviewCanvasView;
  dim: number;
  showGrid: boolean;
  positions: Record<string, PreviewMotionPosition>;
}

const DATABASE_NAME = "datamotion-preview-assets";
const DATABASE_VERSION = 1;
const STORE_NAME = "preview-settings";
const BACKGROUND_KEY = "decoration-background";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadDecorationPreviewBackground(): Promise<DecorationPreviewBackgroundRecord | undefined> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(BACKGROUND_KEY);
      request.onsuccess = () => resolve(request.result as DecorationPreviewBackgroundRecord | undefined);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

export async function saveDecorationPreviewBackground(record: DecorationPreviewBackgroundRecord): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(record, BACKGROUND_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

export async function removeDecorationPreviewBackground(): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(BACKGROUND_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

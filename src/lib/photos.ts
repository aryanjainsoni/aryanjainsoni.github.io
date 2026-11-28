// Bucket-list memory photos — kept in IndexedDB (localStorage is far too small for images).
// Every record is ALREADY ENCRYPTED with the Gym vault key before it gets here ({iv, ct}), or {plain} if the lock is off.
// Settings → Full backup copies these records too (key "idb:bucket-photos"), still encrypted.
export type Sealed = { iv: string; ct: string } | { plain: string };
export type PhotoRec = { id: string; data: Sealed; at: string; caption?: string };

const DB = 'ascent', STORE = 'bucket-photos';
function db(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE, { keyPath: 'id' }); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const d = await db();
  return new Promise((res, rej) => {
    const t = d.transaction(STORE, mode), s = t.objectStore(STORE), req = fn(s);
    t.oncomplete = () => res(req ? (req as IDBRequest<T>).result : undefined); t.onerror = () => rej(t.error);
  });
}
export const getPhoto = (id: string) => tx<PhotoRec>('readonly', (s) => s.get(id));
export const putPhoto = (rec: PhotoRec) => tx('readwrite', (s) => { s.put(rec); });
export const delPhoto = (id: string) => tx('readwrite', (s) => { s.delete(id); });
export const allPhotos = async () => (await tx<PhotoRec[]>('readonly', (s) => s.getAll())) ?? [];
export const putAllPhotos = (recs: PhotoRec[]) => tx('readwrite', (s) => { recs.forEach((r) => s.put(r)); });

// shrink a picked image to a small JPEG data-URL (≈100–200 KB)
export async function shrink(file: File, max = 1100, q = 0.8): Promise<string> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height); bmp.close?.();
  return c.toDataURL('image/jpeg', q);
}

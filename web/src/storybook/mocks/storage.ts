const data = new Map<IDBValidKey, unknown>();
export const get = async <T>(key: IDBValidKey): Promise<T | undefined> =>
  structuredClone(data.get(key)) as T | undefined;
export const set = async (key: IDBValidKey, value: unknown) => {
  data.set(key, structuredClone(value));
};
export const del = async (key: IDBValidKey) => {
  data.delete(key);
};
export const clear = async () => {
  data.clear();
};

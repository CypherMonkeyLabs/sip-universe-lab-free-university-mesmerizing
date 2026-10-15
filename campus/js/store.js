const cache = new Map();

export async function loadJSON(path) {
  if (cache.has(path)) return cache.get(path);
  const bag = globalThis.SIP_DATA;
  if (bag && Object.prototype.hasOwnProperty.call(bag, path)) {
    cache.set(path, bag[path]);
    return bag[path];
  }
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} (${res.status})`);
  const data = await res.json();
  cache.set(path, data);
  return data;
}

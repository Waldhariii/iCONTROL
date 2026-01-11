// Objectif: eliminer les warnings Node/webstorage en tests en fournissant un localStorage stable.

type Store = Record<string, string>;

function makeStorage() {
  let store: Store = Object.create(null);

  return {
    get length() {
      return Object.keys(store).length;
    },
    clear() {
      store = Object.create(null);
    },
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    key(index: number) {
      const keys = Object.keys(store);
      return keys[index] ?? null;
    },
    removeItem(key: string) {
      delete store[key];
    },
    setItem(key: string, value: string) {
      store[key] = String(value);
    }
  } as Storage;
}

const g = globalThis as any;

// Vitest (node) peut ne pas avoir window/document; on expose quand meme un storage canonique.
g.localStorage = makeStorage();
g.sessionStorage = makeStorage();

// Certains codes app passent par window.localStorage si window existe
if (typeof g.window === "object" && g.window) {
  g.window.localStorage = g.localStorage;
  g.window.sessionStorage = g.sessionStorage;
}

// Bonus: matchMedia parfois utilise par la detection de theme
if (!g.matchMedia) {
  g.matchMedia = () => ({
    matches: false,
    media: "",
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  });
}
if (typeof g.window === "object" && g.window && !g.window.matchMedia) {
  g.window.matchMedia = g.matchMedia;
}

// Tiny global theme store. Toggles data-theme on <html>, persists to localStorage,
// and notifies subscribers so every ThemeToggle instance stays in sync.
const KEY = 'theme';

function detect() {
  try {
    // Allow ?theme=dark / ?theme=light to set + persist the theme (shareable links).
    const q = new URLSearchParams(window.location.search).get('theme');
    if (q === 'light' || q === 'dark') {
      try { localStorage.setItem(KEY, q); } catch { /* ignore */ }
      return q;
    }
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

let current = detect();
const listeners = new Set();

export function applyTheme() {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', current);
  }
}

export function getTheme() {
  return current;
}

export function setTheme(next) {
  current = next === 'dark' ? 'dark' : 'light';
  applyTheme();
  try {
    localStorage.setItem(KEY, current);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function toggleTheme() {
  setTheme(current === 'dark' ? 'light' : 'dark');
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Apply immediately on import so the attribute is set before React renders.
applyTheme();

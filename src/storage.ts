// localStorage throws when the browser blocks site data, so nothing touches it directly

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    return;
  }
}

export function canUseStorage(): boolean {
  try {
    window.localStorage.setItem('brm5-probe', '1');
    window.localStorage.removeItem('brm5-probe');
    return true;
  } catch {
    return false;
  }
}

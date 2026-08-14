let appHasBooted = false;

export function hasAppBooted() {
  return appHasBooted;
}

export function markAppBooted() {
  appHasBooted = true;
}

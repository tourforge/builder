export type SetterOrUpdater<T> = (valOrUpdater: T | ((currVal: T) => T)) => void

export function callIfUpdater<T>(currVal: T, valOrUpdater: ((currVal: T) => T) | T): T {
  if (typeof valOrUpdater === "function") {
    return (valOrUpdater as any)(currVal);
  } else {
    return valOrUpdater;
  }
}

export function replaceElementAtIndex<T>(arr: T[], index: number, newValue: T): T[] {
  return [...arr.slice(0, index), newValue, ...arr.slice(index + 1)];
}

export function removeElementAtIndex<T>(arr: T[], index: number): T[] {
  return [...arr.slice(0, index), ...arr.slice(index + 1)];
}

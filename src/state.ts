export type SetterOrUpdater<T> = (valOrUpdater: T | ((currVal: T) => T)) => void

export function setterOrUpdater<T>(getVal: () => T, setVal: (val: T) => void): SetterOrUpdater<T> {
  return valOrUpdater => {
    if (typeof valOrUpdater === "function") {
      setVal((valOrUpdater as any)(getVal()));
    } else {
      setVal(valOrUpdater);
    }
  };
}

export function callIfUpdater<T>(currVal: T, valOrUpdater: ((currVal: T) => T) | T): T {
  if (typeof valOrUpdater === "function") {
    return (valOrUpdater as any)(currVal);
  } else {
    return valOrUpdater;
  }
}

export function insertElementAtIndex<T>(arr: T[], index: number, value: T): T[] {
  return [...arr.slice(0, index), value, ...arr.slice(index)];
}

export function replaceElementAtIndex<T>(arr: T[], index: number, newValue: T): T[] {
  return [...arr.slice(0, index), newValue, ...arr.slice(index + 1)];
}

export function removeElementAtIndex<T>(arr: T[], index: number): T[] {
  return [...arr.slice(0, index), ...arr.slice(index + 1)];
}

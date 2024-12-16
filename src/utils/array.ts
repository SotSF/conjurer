export const reorder: <T>(
  list: T[],
  startIndex: number,
  endIndex: number,
) => T[] = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

export const areEqual: <T>(a: T[], b: T[]) => boolean = (a, b) => {
  return JSON.stringify(a) === JSON.stringify(b);
};

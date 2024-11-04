export const reorder: <T>(
  list: T[],
  startIndex: number,
  endIndex: number
) => T[] = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

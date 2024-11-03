export const reorder: <T>(
  inputArray: T[],
  currentIndex: number,
  delta: number
) => T[] = (inputArray, currentIndex, delta) => {
  const newIndex = currentIndex + delta;
  if (newIndex < 0 || newIndex > inputArray.length - 1) return inputArray;

  const newArray = [...inputArray];
  const [removed] = newArray.splice(currentIndex, 1);
  newArray.splice(newIndex, 0, removed);

  return newArray;
};

export const stringifySolvingTime = (timeMs: number): string => {
  if (timeMs < 1) {
    return '> 1 ms';
  }

  const roundedTime = Number(timeMs.toFixed(1));
  return `${roundedTime} ms`;
};

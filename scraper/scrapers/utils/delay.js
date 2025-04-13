
export const randomDelay = (min = 500, max = 20000) =>
  new Promise(resolve =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min),
  );

export const exponentialBackoffDelay = async attempt => {
    const delayTime = Math.min(30000 * 2 ** attempt, 150000);
    await new Promise(resolve => setTimeout(resolve, delayTime));
  };
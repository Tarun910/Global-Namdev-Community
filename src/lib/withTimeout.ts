export function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  message = 'Request timed out',
): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

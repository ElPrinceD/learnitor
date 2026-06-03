// utils/idleCallback.ts

export interface IdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining(): number;
}

export interface IdleRequestOptions {
  timeout?: number;
}

export type IdleCallback = (deadline: IdleDeadline) => void;

const requestIdleCallbackFallback = (
  callback: IdleCallback,
  options?: IdleRequestOptions
): number => {
  const start = Date.now();
  const timeoutId = setTimeout(() => {
    callback({
      didTimeout: true,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
    });
  }, options?.timeout ?? 1);
  return timeoutId as unknown as number;
};

const cancelIdleCallbackFallback = (handle: number): void => {
  clearTimeout(handle as unknown as NodeJS.Timeout);
};

export const safeRequestIdleCallback =
  typeof requestIdleCallback !== "undefined"
    ? requestIdleCallback
    : requestIdleCallbackFallback;

export const safeCancelIdleCallback =
  typeof cancelIdleCallback !== "undefined"
    ? cancelIdleCallback
    : cancelIdleCallbackFallback;

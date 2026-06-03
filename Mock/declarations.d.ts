// declarations.d.ts

declare module '*.svg';
declare module '*.jpg';
declare module '*.png';

interface IdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining(): number;
}

interface IdleRequestOptions {
  timeout?: number;
}

type IdleCallback = (deadline: IdleDeadline) => void;

declare function requestIdleCallback(
  callback: IdleCallback,
  options?: IdleRequestOptions
): number;

declare function cancelIdleCallback(handle: number): void;


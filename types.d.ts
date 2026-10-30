export type Feature = 'copy' | 'select' | 'rightClick' | 'savePage' | 'print' | 'console' | 'antiDebug';
export type ViolationType = 'copy' | 'select' | 'right_click' | 'save_page' | 'print' | 'console_open' | 'console_shortcut';
export type ConsoleAction = 'noop' | 'hide' | 'redirect';
export interface ViolationEvent {
  readonly type: ViolationType;
  readonly feature: Feature;
  readonly target: Element;
  readonly timestamp: number;
  readonly originalEvent: Event | null;
  readonly defaultPrevented: boolean;
}
export type Status = Record<Feature, boolean> & { consoleAction: ConsoleAction };
export type Options = Partial<Record<Feature, boolean>> & {
  consoleAction?: ConsoleAction;
  onViolation?: ((type: ViolationType, event: ViolationEvent) => void) | null;
};
export type CreateOptions = Options & {
  target?: string | Element | Document;
  /** Replaces default editing and data-guard-allow exceptions. Pass [] for none. */
  allow?: string[];
};
export interface GuardInstance {
  enable(options?: Options): Status;
  disable(features?: Feature | Feature[]): Status;
  destroy(): void;
  status(): Status;
  on(name: 'violation', listener: (event: ViolationEvent) => void): () => boolean;
  lock(options?: Options): Status;
  unlock(features?: Feature | Feature[]): Status;
  unlockAll(): Status;
}
export interface GuardLibrary extends GuardInstance {
  create(options?: CreateOptions): GuardInstance;
}

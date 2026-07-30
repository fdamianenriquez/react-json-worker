import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useJSONWorker } from './useJSONWorker';

type Listener = (event: any) => void;

class FakeWorker {
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  private listeners: Record<string, Set<Listener>> = {};
  private pendingResponse: ((input: unknown) => unknown) | null = null;
  private lastInput: unknown = undefined;

  addEventListener(type: string, listener: Listener) {
    if (!this.listeners[type]) this.listeners[type] = new Set();
    this.listeners[type].add(listener);
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners[type]?.delete(listener);
  }

  postMessage(data: unknown) {
    this.lastInput = data;
    if (this.pendingResponse) {
      setTimeout(() => {
        const response = this.pendingResponse!(data);
        const handlers = this.listeners['message'];
        if (handlers) {
          handlers.forEach((fn) => fn({ data: response }));
        }
      }, 0);
    }
  }

  terminate() {
    this.listeners = {};
    this.onmessage = null;
    this.onerror = null;
  }

  sendResponse(data: unknown) {
    const handlers = this.listeners['message'];
    if (handlers) {
      handlers.forEach((fn) => fn({ data }));
    }
  }

  triggerError(message: string) {
    const handlers = this.listeners['error'];
    if (handlers) {
      handlers.forEach((fn) => fn({ message } as ErrorEvent));
    }
  }

  setAutoResponse(fn: ((input: unknown) => unknown) | null) {
    this.pendingResponse = fn;
  }
}

describe('useJSONWorker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('resolves with the workers result payload', async () => {
    const worker = new FakeWorker();
    const factory = () => worker as unknown as Worker;
    worker.setAutoResponse(() => ({ result: { sum: 42 } }));

    const { result } = renderHook(() => useJSONWorker(factory));

    let resolved: unknown = undefined;
    act(() => {
      const p = result.current.run({ numbers: [1, 2, 3] });
      p.then((v) => { resolved = v; });
    });

    await act(async () => {
      vi.runAllTimers();
    });

    expect(resolved).toEqual({ sum: 42 });
  });

  it('rejects when the worker responds with { error }', async () => {
    const worker = new FakeWorker();
    const factory = () => worker as unknown as Worker;
    worker.setAutoResponse(() => ({ error: 'something went wrong' }));

    const { result } = renderHook(() => useJSONWorker(factory));

    let caught: Error | null = null;
    act(() => {
      const p = result.current.run({});
      p.catch((err) => { caught = err; });
    });

    await act(async () => {
      vi.runAllTimers();
    });

    expect(caught).toBeInstanceOf(Error);
    expect(caught!.message).toBe('something went wrong');
  });

  it('rejects when the worker fires an ErrorEvent', async () => {
    const worker = new FakeWorker();
    const factory = () => worker as unknown as Worker;

    const { result } = renderHook(() => useJSONWorker(factory));

    let caught: Error | null = null;
    act(() => {
      const p = result.current.run({});
      p.catch((err) => { caught = err; });
    });

    act(() => {
      worker.triggerError('worker crashed');
    });

    await act(async () => {});

    expect(caught).toBeInstanceOf(Error);
    expect(caught!.message).toBe('worker crashed');
  });

  it('sets loading to true during the call and false after resolution', async () => {
    const worker = new FakeWorker();
    const factory = () => worker as unknown as Worker;
    worker.setAutoResponse(() => ({ result: 'ok' }));

    const { result } = renderHook(() => useJSONWorker(factory));

    expect(result.current.loading).toBe(false);

    let resolved = false;
    act(() => {
      const p = result.current.run({});
      p.then(() => { resolved = true; });
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      vi.runAllTimers();
    });

    expect(resolved).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('terminate() calls the underlying workers terminate()', async () => {
    const worker = new FakeWorker();
    const factory = () => worker as unknown as Worker;

    const { result } = renderHook(() => useJSONWorker(factory));

    act(() => {
      result.current.run({});
    });

    const terminateSpy = vi.spyOn(worker, 'terminate');

    act(() => {
      result.current.terminate();
    });

    expect(terminateSpy).toHaveBeenCalledTimes(1);
  });

  it('terminate() rejects an in-flight promise', async () => {
    const worker = new FakeWorker();
    const factory = () => worker as unknown as Worker;

    const { result } = renderHook(() => useJSONWorker(factory));

    let caught: Error | null = null;
    act(() => {
      const p = result.current.run({});
      p.catch((e) => { caught = e; });
      result.current.terminate();
    });

    await act(async () => {
      vi.runAllTimers();
    });

    expect(caught).toBeInstanceOf(Error);
    expect(caught!.message).toBe('Worker terminated');
  });
});

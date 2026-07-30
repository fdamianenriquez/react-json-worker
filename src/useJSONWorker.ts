import { useRef, useCallback, useState } from 'react';

interface WorkerResponse<TResult = unknown> {
  result?: TResult;
  error?: string;
}

export function useJSONWorker<TInput = unknown, TOutput = unknown>(
  createWorker: () => Worker
): {
  run: (input: TInput) => Promise<TOutput>;
  loading: boolean;
  error: Error | null;
  terminate: () => void;
} {
  const workerRef = useRef<Worker | null>(null);
  const createWorkerRef = useRef(createWorker);
  createWorkerRef.current = createWorker;

  const rejectRef = useRef<((reason: Error) => void) | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = createWorkerRef.current();
    }
    return workerRef.current;
  }, []);

  const run = useCallback((input: TInput): Promise<TOutput> => {
    return new Promise((resolve, reject) => {
      const worker = getWorker();
      rejectRef.current = reject;
      setLoading(true);
      setError(null);

      const handleMessage = (event: MessageEvent<WorkerResponse<TOutput>>) => {
        const { result, error: errMsg } = event.data;
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        rejectRef.current = null;
        setLoading(false);
        if (errMsg) {
          const err = new Error(errMsg);
          setError(err);
          reject(err);
        } else {
          resolve(result as TOutput);
        }
      };

      const handleError = (event: ErrorEvent) => {
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        rejectRef.current = null;
        setLoading(false);
        const err = new Error(event.message);
        setError(err);
        reject(err);
      };

      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', handleError);

      worker.postMessage(input);
    });
  }, [getWorker]);

  const terminate = useCallback(() => {
    const reject = rejectRef.current;
    rejectRef.current = null;
    if (reject) {
      setTimeout(() => reject(new Error('Worker terminated')), 0);
    }
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setLoading(false);
    setError(null);
  }, []);

  return { run, loading, error, terminate };
}

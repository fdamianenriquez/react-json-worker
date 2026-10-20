import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useJSONWorker } from '../src/useJSONWorker';
import {
  aggregateRecords,
  AggregationResult,
} from './generateMockData';

const DATA_URL = '/data.json';

function App() {
  const [result, setResult] = useState<AggregationResult | null>(null);
  const [mainThreadTime, setMainThreadTime] = useState<number | null>(null);
  const [workerTime, setWorkerTime] = useState<number | null>(null);
  const [mainError, setMainError] = useState<string | null>(null);
  const [counter, setCounter] = useState(0);
  const [busy, setBusy] = useState(false);
  const [fileSize, setFileSize] = useState<string>('');
  const rafRef = useRef<number>(0);

  const { run, loading, error: workerError, terminate } = useJSONWorker<
    { url: string },
    AggregationResult
  >(
    useCallback(
      () =>
        new Worker(
          new URL('./processRecords.worker.ts', import.meta.url),
          { type: 'module' }
        ),
      []
    )
  );

  useEffect(() => {
    return () => terminate();
  }, [terminate]);

  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      setCounter((c) => (c + 1) % 1000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    fetch(DATA_URL, { method: 'HEAD' }).then((res) => {
      const bytes = parseInt(res.headers.get('Content-Length') || '0', 10);
      if (bytes > 0) {
        const mb = (bytes / (1024 * 1024)).toFixed(1);
        setFileSize(mb);
      }
    }).catch(() => {});
  }, []);

  const runMainThread = async () => {
    setBusy(true);
    setMainError(null);
    try {
      const start = performance.now();
      const res = await fetch(DATA_URL);
      const data = await res.json();
      const agg = aggregateRecords(data);
      const elapsed = performance.now() - start;
      setResult(agg);
      setMainThreadTime(elapsed);
      setWorkerTime(null);
    } catch (err) {
      setMainError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const runWorker = async () => {
    setMainError(null);
    try {
      const start = performance.now();
      const agg = await run({ url: DATA_URL });
      const elapsed = performance.now() - start;
      setResult(agg);
      setWorkerTime(elapsed);
      setMainThreadTime(null);
    } catch {
      // The hook exposes the failure through `error`.
    }
  };

  const isProcessing = busy || loading;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>react-json-worker</h1>

      <p>
        Loads <code>data.json</code> —{' '}
        <strong>{fileSize ? `${fileSize} MB` : '...'}</strong>
        {' '}of mock report records — fetches, parses, and aggregates the data.
      </p>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={runMainThread} disabled={isProcessing}>
          Run on Main Thread
        </button>
        <button onClick={runWorker} disabled={isProcessing}>
          Run on Web Worker
        </button>
      </div>

      <div
        style={{
          marginBottom: '1rem',
          fontSize: '1.2rem',
          fontWeight: 'bold',
        }}
      >
        Animation counter:{' '}
        <span style={{ color: isProcessing ? 'red' : 'green' }}>{counter}</span>
        {isProcessing && (
          <span style={{ marginLeft: '0.5rem', color: 'red' }}>
            (processing — watch for stutter)
          </span>
        )}
      </div>

      {mainThreadTime !== null && (
        <p>
          <strong>Main thread</strong> took{' '}
          <code>{mainThreadTime.toFixed(2)} ms</code>
        </p>
      )}
      {workerTime !== null && (
        <p>
          <strong>Web Worker</strong> took{' '}
          <code>{workerTime.toFixed(2)} ms</code>
        </p>
      )}

      {mainError && (
        <p style={{ color: 'red' }}>
          Error: {mainError}
        </p>
      )}
      {workerError && (
        <p style={{ color: 'red' }}>
          Worker Error: {workerError.message}
        </p>
      )}

      {result && (
        <table
          border={1}
          cellPadding={6}
          style={{ borderCollapse: 'collapse', marginTop: '1rem' }}
        >
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Records</td>
              <td>{result.totalRecords.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Avg Credit Score</td>
              <td>{result.avgCreditScore}</td>
            </tr>
            <tr>
              <td>Total Claims</td>
              <td>{result.totalClaims.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Avg Vehicle Value</td>
              <td>${result.avgVehicleValue.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Total Risk Flags</td>
              <td>{result.totalRiskFlags.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;

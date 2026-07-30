import { aggregateRecords } from './generateMockData';

self.onmessage = async (event: MessageEvent<{ url: string }>) => {
  try {
    const res = await fetch(event.data.url);
    const data = await res.json();
    const result = aggregateRecords(data);
    self.postMessage({ result });
  } catch (err) {
    self.postMessage({ error: (err as Error).message });
  }
};

export interface ReportRecord {
  id: number;
  creditScore: number;
  claimsHistory: number;
  vehicleValue: number;
  riskFlags: number;
}

export interface AggregationResult {
  totalRecords: number;
  avgCreditScore: number;
  totalClaims: number;
  avgVehicleValue: number;
  totalRiskFlags: number;
}

export function generateMockData(count: number): ReportRecord[] {
  const records: ReportRecord[] = new Array(count);
  for (let i = 0; i < count; i++) {
    records[i] = {
      id: i,
      creditScore: Math.floor(Math.random() * 851),
      claimsHistory: Math.floor(Math.random() * 20),
      vehicleValue: Math.floor(Math.random() * 100000) + 5000,
      riskFlags: Math.floor(Math.random() * 10),
    };
  }
  return records;
}

export function aggregateRecords(records: ReportRecord[]): AggregationResult {
  let totalCreditScore = 0;
  let totalClaims = 0;
  let totalVehicleValue = 0;
  let totalRiskFlags = 0;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    totalCreditScore += r.creditScore;
    totalClaims += r.claimsHistory;
    totalVehicleValue += r.vehicleValue;
    totalRiskFlags += r.riskFlags;
  }

  return {
    totalRecords: records.length,
    avgCreditScore: Math.round(totalCreditScore / records.length),
    totalClaims,
    avgVehicleValue: Math.round(totalVehicleValue / records.length),
    totalRiskFlags,
  };
}

export const DEFAULT_BATCH_SIZE = 100_000;

export function generateAndAggregateInBatches(
  count: number,
  batchSize: number = DEFAULT_BATCH_SIZE
): AggregationResult {
  let totalCreditScore = 0;
  let totalClaims = 0;
  let totalVehicleValue = 0;
  let totalRiskFlags = 0;

  for (let offset = 0; offset < count; offset += batchSize) {
    const end = Math.min(offset + batchSize, count);
    const batch: ReportRecord[] = new Array(end - offset);
    for (let i = offset; i < end; i++) {
      batch[i - offset] = {
        id: i,
        creditScore: Math.floor(Math.random() * 851),
        claimsHistory: Math.floor(Math.random() * 20),
        vehicleValue: Math.floor(Math.random() * 100000) + 5000,
        riskFlags: Math.floor(Math.random() * 10),
      };
    }

    for (let j = 0; j < batch.length; j++) {
      const r = batch[j];
      totalCreditScore += r.creditScore;
      totalClaims += r.claimsHistory;
      totalVehicleValue += r.vehicleValue;
      totalRiskFlags += r.riskFlags;
    }
  }

  return {
    totalRecords: count,
    avgCreditScore: Math.round(totalCreditScore / count),
    totalClaims,
    avgVehicleValue: Math.round(totalVehicleValue / count),
    totalRiskFlags,
  };
}

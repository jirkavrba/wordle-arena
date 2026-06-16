import type { OutputImageConfig } from '../OutputImageConfig.ts';

export interface BenchmarkImageConfig extends OutputImageConfig {
  resultBoxWidthPx: number;
}

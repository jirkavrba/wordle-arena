import type { OutputImageConfig } from '../OutputImageConfig.ts';

export interface OverviewImageConfig extends OutputImageConfig {
  resultGridCols: number;

  greyColor: string;
  yellowColor: string;
  greenColor: string;

  resultBoxWidthPx: number;

  wordleBoxSizePx: number;
  wordleBoxMarginPx: number;
}

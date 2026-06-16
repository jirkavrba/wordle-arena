import { createCanvas } from '@napi-rs/canvas';
import type { BenchmarkImageConfig } from './BenchmarkImageConfig.ts';
import { OutputImage } from '../OutputImage.ts';
import type { BotResultsAggregation } from '../../../benchmark.ts';

interface BotBenchmarkResults {
  botName: string;
  successRate: number;
  averageGuesses: number;
  averageSolvingTimeMs: number;
}

export class BenchmarkImage extends OutputImage<BenchmarkImageConfig> {
  private _resultBoxHeightPx: number;

  public constructor(config: Partial<BenchmarkImageConfig> = {}) {
    super({
      bgColor: config.bgColor ?? '#151515',
      borderColor: config.borderColor ?? '#3a3a3c',
      textColor: config.textColor ?? '#ffffff',
      paddingPx: config.paddingPx ?? 8,

      resultBoxWidthPx: config.resultBoxWidthPx ?? 512,
    });

    this._resultBoxHeightPx = this.config.paddingPx * 3.5; // Top text size
  }

  public async generateBenchmarkImage(
    botResultsMap: Record<string, BotResultsAggregation>,
  ) {
    const { bgColor, paddingPx, borderColor, resultBoxWidthPx } = this.config;

    const botResults = Object.keys(botResultsMap)
      .map<BotBenchmarkResults>((key) => {
        const aggregation = botResultsMap[key];
        const totalChallenges =
          aggregation.solvedChallenges + aggregation.failedChallenges;
        return {
          botName: key,
          successRate: aggregation.solvedChallenges / totalChallenges,
          averageGuesses: aggregation.averageGuesses,
          averageSolvingTimeMs: aggregation.averageSolvingTimeMs,
        };
      })
      .sort((a, b) => {
        const successOrder = b.successRate - a.successRate;
        if (successOrder !== 0) return successOrder;

        const guessOrder = a.averageGuesses - b.averageGuesses;
        if (guessOrder !== 0) return guessOrder;

        const timeOrder = a.averageSolvingTimeMs - b.averageSolvingTimeMs;
        return timeOrder;
      });

    const canvasWidth = paddingPx * 4 + paddingPx + resultBoxWidthPx;
    const canvasHeight =
      paddingPx +
      (this._resultBoxHeightPx + paddingPx) * (botResults.length + 1); // plus table header

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // results
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const cols = 4;
    const colSpace = (canvasWidth - paddingPx * 2) / cols;

    for (let i = -1; i < botResults.length; i++) {
      const result = botResults[i];

      const y = paddingPx + (this._resultBoxHeightPx + paddingPx) * (i + 1);

      for (let c = 0; c < 4; c++) {
        const x = paddingPx + colSpace * c;

        let text: string;
        if (result === undefined) {
          text = ['Bot Name ', 'Accuracy ', 'Avg. Guesses ', 'Avg. Time '][c];
        } else {
          text = [
            result.botName,
            `${(result.successRate * 100).toFixed(2)}`.padEnd(6) + ' %',
            `${result.averageGuesses.toFixed(2)}`.padEnd(8),
            `${result.averageSolvingTimeMs.toFixed(2)} `.padEnd(5) + ' ms',
          ][c];
        }

        this._responsiveTextInBox(
          ctx,
          text,
          x,
          y + this._resultBoxHeightPx * 0.5,
          colSpace - paddingPx,
          this._resultBoxHeightPx,
        );
      }
    }

    // header line
    ctx.fillStyle = borderColor;
    ctx.fillRect(
      paddingPx,
      paddingPx + this._resultBoxHeightPx + paddingPx / 2,
      canvasWidth - paddingPx * 2,
      2,
    );

    const pngData = await canvas.encode('png');
    this._setGeneratedImage({
      file: pngData,
      fileName: 'benchmark.png',
    });
  }
}

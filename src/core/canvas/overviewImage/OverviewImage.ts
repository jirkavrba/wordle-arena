import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas';
import type { BotResult } from '../../bot/BotResult.ts';
import { type LetterStatus } from '../../nytimes/Guess.ts';
import { Wordle } from '../../nytimes/Wordle.ts';
import type { OverviewImageConfig } from './OverviewImageConfig.ts';
import { OutputImage } from '../OutputImage.ts';

export class OverviewImage extends OutputImage<OverviewImageConfig> {
  private _resultBoxHeightPx: number;

  public constructor(config: Partial<OverviewImageConfig> = {}) {
    super({
      bgColor: config.bgColor ?? '#151515',
      borderColor: config.borderColor ?? '#3a3a3c',
      textColor: config.textColor ?? '#ffffff',
      paddingPx: config.paddingPx ?? 8,

      resultGridCols: config.resultGridCols ?? 3,
      resultBoxWidthPx: config.resultBoxWidthPx ?? 128,
      greyColor: config.greyColor ?? '#3a3a3c',
      yellowColor: config.yellowColor ?? '#b59f3b',
      greenColor: config.greenColor ?? '#538d4e',
      wordleBoxSizePx: config.wordleBoxSizePx ?? 8,
      wordleBoxMarginPx: config.wordleBoxMarginPx ?? 2,
    });

    this._resultBoxHeightPx =
      this.config.paddingPx * 6.5 + // Top text size
      Wordle.AttemptCount *
        (this.config.wordleBoxSizePx + this.config.wordleBoxMarginPx); // wordle height
  }

  private _getLetterStatusColor(letterStatus: LetterStatus): string {
    const LETTER_STATUS_STYLE_MAP: Record<LetterStatus, string> = {
      exact: this.config.greenColor,
      occurring: this.config.yellowColor,
      missing: this.config.greyColor,
    };
    return LETTER_STATUS_STYLE_MAP[letterStatus];
  }

  private _drawBotResult(
    ctx: SKRSContext2D,
    x: number,
    y: number,
    result: BotResult,
  ) {
    const {
      borderColor,
      paddingPx,
      resultBoxWidthPx,
      wordleBoxSizePx,
      wordleBoxMarginPx,
    } = this.config;

    let yOffset = paddingPx;

    ctx.translate(x, y);

    ctx.lineWidth = 1;
    ctx.strokeStyle = borderColor;
    ctx.roundRect(
      0,
      0,
      resultBoxWidthPx,
      this._resultBoxHeightPx,
      resultBoxWidthPx * 0.1,
    );
    ctx.stroke();

    // name and author
    ctx.textAlign = 'center';
    ctx.textBaseline = 'hanging';
    this._responsiveTextInBox(
      ctx,
      result.meta.name,
      resultBoxWidthPx / 2,
      yOffset,
      resultBoxWidthPx - paddingPx * 2,
      paddingPx * 1.75,
    );
    yOffset += paddingPx * 3.75;

    ctx.textBaseline = 'bottom';
    this._responsiveTextInBox(
      ctx,
      `by ${result.meta.author}`,
      resultBoxWidthPx / 2,
      yOffset,
      resultBoxWidthPx - paddingPx * 2,
      paddingPx * 1.25,
    );
    yOffset += paddingPx * 1;

    // wordle result
    const wordleBoxXOffset =
      resultBoxWidthPx / 2 -
      (Wordle.WordLength / 2) * (wordleBoxSizePx + wordleBoxMarginPx);

    for (let i = 0; i < Wordle.AttemptCount; i++) {
      const guess = result.guesses[i];
      // if there are less guesses than Wordle.AttemptCount
      if (guess === undefined) {
        for (let j = 0; j < Wordle.WordLength; j++) {
          const x =
            wordleBoxXOffset + j * (wordleBoxSizePx + wordleBoxMarginPx);

          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(
            x + 1,
            yOffset + 1,
            wordleBoxSizePx - 2,
            wordleBoxSizePx - 2,
          );
        }
      } else {
        for (let j = 0; j < guess.length; j++) {
          const guessLetter = guess[j];

          const x =
            wordleBoxXOffset + j * (wordleBoxSizePx + wordleBoxMarginPx);

          ctx.fillStyle = this._getLetterStatusColor(guessLetter.status);
          ctx.fillRect(x, yOffset, wordleBoxSizePx, wordleBoxSizePx);
        }
      }

      yOffset += wordleBoxSizePx + wordleBoxMarginPx;
    }

    ctx.translate(-x, -y);
  }

  public async generateOverview(botResults: BotResult[]) {
    const { resultGridCols, bgColor, paddingPx, resultBoxWidthPx } =
      this.config;

    const botResultRows: BotResult[][] = [[]];
    let currentRow = 0;
    botResults.forEach((result) => {
      const row = botResultRows[currentRow];
      if (row.length < resultGridCols) {
        row.push(result);
      } else {
        botResultRows.push([result]);
        currentRow++;
      }
    });

    const canvasWidthPx =
      paddingPx * 4 + (paddingPx + resultBoxWidthPx * resultGridCols);
    const canvasHeightPx =
      paddingPx + (this._resultBoxHeightPx + paddingPx) * botResultRows.length;

    const canvas = createCanvas(canvasWidthPx, canvasHeightPx);
    const ctx = canvas.getContext('2d');

    // background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidthPx, canvasHeightPx);

    // draw results
    const resultsYOffset = paddingPx;
    for (let r = 0; r < botResultRows.length; r++) {
      const row = botResultRows[r];

      const centerXOffset =
        canvasWidthPx / 2 - ((resultBoxWidthPx + paddingPx) * row.length) / 2;

      for (let i = 0; i < row.length; i++) {
        const result = row[i];

        const x = centerXOffset + (resultBoxWidthPx + paddingPx) * i;
        const y = resultsYOffset + (this._resultBoxHeightPx + paddingPx) * r;

        this._drawBotResult(ctx, x, y, result);
      }
    }

    const pngData = await canvas.encode('png');
    this._setGeneratedImage({
      file: pngData,
      fileName: 'overview.png',
    });
  }
}

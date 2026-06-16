import { GlobalFonts, type SKRSContext2D } from '@napi-rs/canvas';
import path from 'node:path';
import * as fs from 'fs';
import type { BufferFile } from '../utils/BufferFile.ts';
import type { OutputImageConfig } from './OutputImageConfig.ts';

GlobalFonts.registerFromPath(
  path.join(process.cwd(), 'src', 'data', 'fonts', 'OpenSans-Regular.ttf'),
  'Open Sans',
);

export abstract class OutputImage<T extends OutputImageConfig> {
  private _config: T;
  private _generatedImage: BufferFile | null = null;

  public constructor(config: T) {
    this._config = {
      ...config,
      bgColor: config.bgColor ?? '#151515',
      borderColor: config.borderColor ?? '#3a3a3c',
      textColor: config.textColor ?? '#ffffff',
      paddingPx: config.paddingPx ?? 8,
    };
  }

  protected _setGeneratedImage(generatedImage: BufferFile): void {
    this._generatedImage = generatedImage;
  }

  protected _responsiveTextInBox(
    ctx: SKRSContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    maxHeight: number,
    initialFontSize: number = 100,
  ): void {
    ctx.font = `${initialFontSize}px 'Open Sans'`;
    const textWidth = ctx.measureText(text).width || 1;
    let optimalFontSize = (maxWidth / textWidth) * initialFontSize;
    if (optimalFontSize > maxHeight) {
      optimalFontSize = maxHeight;
    }
    ctx.font = `${optimalFontSize}px 'Open Sans'`;
    ctx.fillStyle = this._config.textColor;
    ctx.fillText(text, x, y);
  }

  public saveGeneratedImage(targetDir: string = './out/'): void {
    const generatedImage = this.generatedImage;
    const filePath = path.join(
      process.cwd(),
      targetDir,
      generatedImage.fileName,
    );

    try {
      const dir = path.dirname(filePath);

      fs.mkdirSync(dir, { recursive: true });

      fs.writeFileSync(filePath, generatedImage.file);
    } catch (error) {
      console.error('Failed to save buffer to file:', error);
      throw error;
    }
  }

  public get config(): T {
    return this._config;
  }

  public get generatedImage(): BufferFile {
    if (this._generatedImage === null) {
      throw new Error('Image not yet generated!');
    }
    return this._generatedImage;
  }
}

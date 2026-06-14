import { ASolverBot, type BotMeta } from '../allowedContext.ts';

export class RandomSolverBot extends ASolverBot {
  private _wordsLeft: string[] = [];

  protected _about(): BotMeta {
    return {
      name: 'Rand-bot',
      author: 'Radek',
    };
  }

  protected async _init(): Promise<void> {
    // loads the valid word list
    this._wordsLeft = [...this._getValidWords().values()];
  }

  protected async _pickWord(): Promise<string> {
    // picks and removes a random word from it
    const index = Math.floor(Math.random() * this._wordsLeft.length);
    this._wordsLeft.splice(index, 1);
    const word = this._wordsLeft[index];
    return word;
  }
}

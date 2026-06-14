import {
  ASolverBot,
  type Guess,
  type BotMeta,
  LETTER_STATUS,
  type GuessLetter,
  type FiveArray,
} from '../allowedContext.ts';

export class PatternBot extends ASolverBot {
  private _wordsLeft: Set<string> = new Set();

  private _pickRandomFromWordsLeft(): string {
    const words = [...this._wordsLeft.values()];
    const index = Math.floor(Math.random() * words.length);
    const word = words[index];
    this._wordsLeft.delete(word);
    return word;
  }

  private _getMissingLetters(previousGuesses: Guess[]): string[] {
    const previousGuessLetters = previousGuesses.reduce(
      (guessLetters: GuessLetter[], guess) => [...guessLetters, ...guess],
      [],
    );

    // extract just the letters
    let missingLetters = previousGuessLetters.map(
      (guessLetter) => guessLetter.letter,
    );

    // convert to a Set to remove duplicates
    missingLetters = [...new Set(missingLetters).values()];

    // filter out exact and occurring letters
    missingLetters = missingLetters.filter((letter) =>
      previousGuessLetters.every((guessLetter) => {
        // check against each previous guess letter
        if (guessLetter.letter !== letter) return true;
        // every previous letter must be missing (sometimes a letter can be occurring and missing if it is more than once)
        return guessLetter.status === LETTER_STATUS.MISSING;
      }),
    );

    return missingLetters;
  }

  private _getExactLetters(previousGuesses: Guess[]): FiveArray<string | null> {
    const exactLetters: FiveArray<string | null> = [
      null,
      null,
      null,
      null,
      null,
    ];

    for (const guess of previousGuesses) {
      for (let i = 0; i < guess.length; i++) {
        const guessLetter = guess[i];

        if (guessLetter.status !== LETTER_STATUS.EXACT) continue;

        exactLetters[i] = guessLetter.letter;
      }
    }

    return exactLetters;
  }

  // this returns the the yellow letters at their tried positions
  private _getOccurringLettersBlacklist(
    previousGuesses: Guess[],
  ): FiveArray<string[]> {
    const occurringLettersBlacklist: FiveArray<string[]> = [[], [], [], [], []];

    // add the blacklisted yellow letters at each index
    for (const guess of previousGuesses) {
      for (let i = 0; i < guess.length; i++) {
        const guessLetter = guess[i];

        if (guessLetter.status !== LETTER_STATUS.OCCURRING) continue;

        occurringLettersBlacklist[i].push(guessLetter.letter);
      }
    }

    return occurringLettersBlacklist;
  }

  private _getOccurringLetters(previousGuesses: Guess[]): string[] {
    const previousGuessLetters = previousGuesses.reduce(
      (guessLetters: GuessLetter[], guess) => [...guessLetters, ...guess],
      [],
    );

    // extract just the letters
    let occurringLetters = previousGuessLetters
      .filter((guessLetter) => guessLetter.status === LETTER_STATUS.OCCURRING)
      .map((guessLetter) => guessLetter.letter);

    // convert to a Set to remove duplicates
    occurringLetters = [...new Set(occurringLetters).values()];

    return occurringLetters;
  }

  protected _about(): BotMeta {
    return {
      name: 'Pattern Bot',
      author: 'Radek',
    };
  }

  protected async _init(): Promise<void> {
    this._wordsLeft = this._getValidWords();
  }

  protected async _pickWord(
    guessIndex: number,
    previousGuesses: Guess[],
  ): Promise<string> {
    if (guessIndex === 0) {
      // a good one seed strategy word
      // source: https://www.sfi.ie/research-news/news/wordle-data-analytics/
      const firstWord = 'tales';
      this._wordsLeft.delete(firstWord);
      return firstWord;
    }

    // filter out grey letter words
    const missingLetters = this._getMissingLetters(previousGuesses);

    [...this._wordsLeft.values()].forEach((word) => {
      for (const missingLetter of missingLetters) {
        if (!word.includes(missingLetter)) continue;

        this._wordsLeft.delete(word);
        return;
      }
    });

    // filter out words that don't respect the green
    const exactLetters = this._getExactLetters(previousGuesses);

    [...this._wordsLeft.values()].forEach((word) => {
      for (let i = 0; i < exactLetters.length; i++) {
        const exactLetter = exactLetters[i];

        if (exactLetter === null || word[i] === exactLetter) continue;

        // remove words with wrong exact letters
        this._wordsLeft.delete(word);
        return;
      }
    });

    // filter out words that go against yellows
    const occurringLetters = this._getOccurringLetters(previousGuesses);
    const occurringLettersBlacklist =
      this._getOccurringLettersBlacklist(previousGuesses);

    [...this._wordsLeft.values()].forEach((word) => {
      for (const occurringLetter of occurringLetters) {
        if (word.includes(occurringLetter)) continue;

        // remove words that don't have yellow letters
        this._wordsLeft.delete(word);
        return;
      }

      for (let i = 0; i < occurringLettersBlacklist.length; i++) {
        const blacklist = occurringLettersBlacklist[i];

        if (!blacklist.includes(word[i])) continue;

        // remove words that have yellow letters at already tired positions
        this._wordsLeft.delete(word);
        return;
      }
    });

    return this._pickRandomFromWordsLeft();
  }
}

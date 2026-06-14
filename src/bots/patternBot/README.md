# Pattern Bot

Author: Radek

## About

This bot starts by picking the word 'tales'. Which is considered a "good" first word by this article: https://www.sfi.ie/research-news/news/wordle-data-analytics/.

And then it just filters out the words from the words list based on the letter statuses:
- Grey letters are not used
- Yellow letters must be used and must not be in the same place
- Green letters must be exactly where they were before

If more than one word is remaining, random word is picked. 

Issues:
- This bot doesn't know how many yellow letters he should use (currently checks if at least one is used)
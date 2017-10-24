p5.bitmapFont 
=============

A [p5.js](http://p5js.org/) library that enables rendering bitmap fonts.


API
---

Usage:

```javascript

let bitmapFont;

function setup() {
  createCanvas(500, 500);
  bitmapTextFont(bitmapFont);
}

function draw() {
  background(0, 0, 0);
  bitmapText("Hello, there!", 40, 40);
}

function preload() {
  bitmapFont = loadBitmapFont('data/font@2.png', {
    glyphWidth: 8 * 2,
    glyphHeight: 8 * 2,
    glyphBorder: 0,
    rows: 12,
    cols: 8
  });
}

```

/*
  Andor Saga
  Oct 2017

  Render text using a bitmap with P5.js

  Oct 24 - Created
  Dec 27 - Adding variable width functionality
*/

let currFont = null;

let BitmapFont = function() {

    this.glyphs = [];
    this.glyphMetaData = [];
    this.usingGrid = true;
    this.ready = false;

    /*
     */
    this.splitImageInGrid = function(img, cfg) {
        img.loadPixels();
        this.usingGrid = true;

        cfg.kerning = cfg.kerning || 0;
        Object.assign(this, cfg);

        let charCode = 0;

        for (let y = 0; y < cfg.rows; ++y) {
            for (let x = 0; x < cfg.cols; ++x) {

                let xPos = x * (this.glyphWidth + this.glyphBorder);
                let yPos = y * (this.glyphHeight + this.glyphBorder);

                this.glyphs[charCode] = img.get(xPos, yPos, this.glyphWidth, this.glyphHeight);

                charCode++;
            }
        }
        this.ready = true;
    };

    /*
     */
    this.splitImageWithMetaData = function(img, cfg) {
        console.log('splitImageWithMetaData');

        img.loadPixels();
        this.usingGrid = false;
        // Object.assign(this, cfg);

        let chars = cfg.font.chars.char;

        for (let i of chars) {
            let c = i['-id'],
                x = i['-x'],
                y = i['-y'];

            // this.glyphMetaData[c] = i;

            this.glyphs[c] = img.get(x, y, 16, 16);
            // console.log(x, y, this.glyphs[c]);
        }
        this.ready = true;
    };


    /*
      {Number} code
    */
    this.getGlyph = function(code) {
        return this.glyphs[code];
    };
};


/*
  We can either init with the path to the image and a config object
  OR
  We can pass in the image and a metadata file

  {String}         data       - path to image or p5Image
  {Object|String}  p2         - metadata
  {Function}       callback   - Called once font is ready
*/
p5.prototype.loadBitmapFont = function(data, p2, callback) {
    console.log('loadBitmapFont');
    
    this._incrementPreload();
    let that = this;

    let newFont = new BitmapFont();

    function done() {
        callback && callback();
        that._decrementPreload();
    }

    // loadBitmapFont('font.png', 'font.json');
    if (typeof p2 === 'string') {

        console.log(`loadBitmapFont('font.png', 'font.json')`);

        fetch(p2)
            .then(res => res.json())
            .then(json => p5.prototype.loadImage(data, function(img) {
                console.log(`loadImage`);

                newFont.splitImageWithMetaData(img, json);
                newFont.testImg = img;

                done();
            }));
    }

    // loadBitmapFont('font.png', {...});
    else if (typeof data === 'string') {
        // console.log(`loadBitmapFont(${data})`);
        p5.prototype.loadImage(data, function(img) {
            newFont.splitImageInGrid(img, p2);
            done();
        });
    }

    // let pImg = new p5.Image();
    // ...
    // loadBitmapFont(pImg);
    else {
        newFont.splitImageInGrid(data, p2);
        done();
    }

    return newFont;
};


/*
 */
p5.prototype.bitmapTextFont = function(font) {
    if (typeof font !== 'undefined') {
        currFont = font;
    } else {
      console.log('null..');
    }
};


/*
  Copying the Processing API, but how should this
  accomplish the user intent...
*/
p5.prototype.bitmapTextSize = function(size) {};


/*
  Intentially similar to text() in Processing.

  {String} str - string to render
  {Number} x   - render from left to right
  {Number} y   - baseline
*/
p5.prototype.bitmapText = function(str, x, y) {

    if (currFont === null || !currFont.ready) {
        return;
    }

    // If user tries to pass in zero,
    // nothing renders, so let's just convert to a string.
    if (typeof str === 'number') {
        str = '' + str;
    }

    if (currFont.usingGrid === true) {
        for (let i = 0, len = str.length; i < len; ++i) {
            let code = str[i].charCodeAt(0) - 32;
            let glyph = currFont.getGlyph(code);
            image(glyph, x + (i * (currFont.glyphWidth + currFont.kerning)), y);
        }
    } else {
        for (let i = 0, len = str.length; i < len; ++i) {
            let code = str[i].charCodeAt(0) - 32;
            let glyph = currFont.getGlyph(code);
            if (glyph) {
                image(glyph, x + (i * 8), y);
            }
        }
    }

};
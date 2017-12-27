/*
  Andor Saga
  Oct 2017

  Render text using a bitmap with P5.js

  Oct 24 - Created
  Dec 27 - Added variable width font functionality
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
        img.loadPixels();
        this.usingGrid = false;

        let chars = cfg.chars.char;

        for (let c of chars) {
            let meta = this.glyphMetaData;
            let scale = cfg.info.scale;

            meta[c.id] = c;
            meta[c.id].yoffset = parseInt(c.yoffset * scale, 10);
            meta[c.id].xadvance = parseInt(c.xadvance * scale, 10);
            meta[c.id].width = parseInt(c.width, 10);
            meta[c.id].height = parseInt(c.height, 10);

            let origImg = img.get(c.x, c.y, c.width, c.height);

            if (scale === 1) {
                this.glyphs[c.id] = origImg;
            } else {
                let outImg = this.glyphs[c.id] = createImage(c.width * scale, c.height * scale);

                origImg.loadPixels();
                outImg.loadPixels();

                let x, y, u, v;

                // Copied from my texture demo 
                // https://www.openprocessing.org/sketch/437855
                for (let i = 0; i < outImg.pixels.length; ++i) {

                    x = (i % outImg.width) / outImg.width;
                    y = floor(i / outImg.width) / outImg.height;

                    u = ceil(x * origImg.width);
                    v = ceil(y * origImg.height);

                    let textureIdx = (4 * v * origImg.width) + (4 * u);

                    outImg.pixels[4 * i + 0] = origImg.pixels[textureIdx + 0];
                    outImg.pixels[4 * i + 1] = origImg.pixels[textureIdx + 1];
                    outImg.pixels[4 * i + 2] = origImg.pixels[textureIdx + 2];
                    outImg.pixels[4 * i + 3] = origImg.pixels[textureIdx + 3];
                }
                this.glyphs[c.id].updatePixels();
            }
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
    let that = this;
    let newFont = new BitmapFont();

    this._incrementPreload();

    function done() {
        that._decrementPreload();
        callback && callback();
    }

    // loadBitmapFont('font.png', 'font.json');
    if (typeof p2 === 'string') {
        fetch(p2)
            .then(res => res.json())
            .then(json => p5.prototype.loadImage(data, function(img) {
                newFont.splitImageWithMetaData(img, json);
                done();
            }));
    }

    // loadBitmapFont('font.png', {...});
    else if (typeof data === 'string') {
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
    currFont = font;
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
            // TODO: comment on magic number
            let code = str[i].charCodeAt(0) - 32;
            let glyph = currFont.getGlyph(code);
            image(glyph, x + (i * (currFont.glyphWidth + currFont.kerning)), y);
        }
    } else {
        let xadvance = 0;

        for (let i = 0, len = str.length; i < len; ++i) {
            let code = str[i].charCodeAt(0);
            let glyph = currFont.getGlyph(code);

            // TODO: fix me
            if (glyph) {
                let yoffset = currFont.glyphMetaData[code].yoffset;
                image(glyph, x + xadvance, y + yoffset);
                xadvance += currFont.glyphMetaData[code].xadvance + 1;
            }
        }
    }
};
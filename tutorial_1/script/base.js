/* ---------------------------------------------------------------------------------*/

/**
 * Abstract canvas class.
 * 
 * @param {number} width  width of canvas in pixels
 * @param {number} height height of canvas in pixels
 */
function Canvas(width, height) {
    // create canvas and grab 2d context
    this.canvas = document.createElement("canvas");

    //alert(this.canvas);

    this.canvas.id = "invaders_canvas";
    this.canvas.width = this.width = width;
    this.canvas.height = this.height = height;

    this.ctx = this.canvas.getContext("2d");


    // append canvas to body of document
    //document.body.appendChild(this.canvas);

    var div = document.getElementById('game_div');
    div.appendChild(this.canvas);
};

/**
 * Clears the canvas.
 */
Canvas.prototype.clear = function () {
    this.ctx.clearRect(0, 0, this.width, this.height);
};

/**
 * Draw a sprite instance to the canvas.
 * 
 * @param  {Sprite} sp the sprite to draw
 * @param  {number} x  x-coordinate to draw sprite
 * @param  {number} y  y-coordinate to draw sprite
 */
Canvas.prototype.drawSprite = function (sp, x, y) {
    this.ctx.drawImage(sp.img, sp.x, sp.y, sp.w, sp.h, x, y, sp.w, sp.h);
};

/**
 * Draws he score on canvas
 *
 * @param  {score} 
 */
Canvas.prototype.drawText = function (text, x, y) {

    this.ctx.save();

    // Text options
    this.ctx.fillStyle = "rgb(250, 250, 250)";
    this.ctx.font = "15px Helvetica";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "center";

    // P1 Score
    /// this.ctx.fillText("GAME OVER - PRESS ENTER", this.canvas.width / 2, this.canvas.height / 2);

    this.ctx.fillText(text, x, y);

    this.ctx.restore();

};
/* ---------------------------------------------------------------------------------*/


/**
 * Sprite generic object.
 *
 * Uses sheet image for compressed space. /// TODO: Look this up
 * 
 * @param {Image}  img sheet image
 * @param {number} x   start x on image
 * @param {number} y   start y on image
 * @param {number} w   width of asset
 * @param {number} h   height of asset
 */
function Sprite(img, x, y, w, h) {
    this.img = img;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    this.animated = false;
};

/* ---------------------------------------------------------------------------------*/


/**
 * AnimationSprite object.
 * @extends Sprite class.
 *
 * Contains logic to update the x coordinate of sprite between frame updates.
 * Used to perform an animation using a sequence.
 * 
 * @param {Image}  img sheet image
 * @param {number} x   start x on image
 * @param {number} y   start y on image
 * @param {number} w   width of asset
 * @param {number} h   height of asset

 * @param {number} frameCnt how many times to update x coordinate of sprite.
 * @param {number} frameInc by what value to increment x coordinate of sprite.
 */
function AnimationSprite(img, x, y, w, h, frameCnt, frameInc) {
    Sprite.call(this, img, x, y, w, h);

    this.animated = true;
    this.frameCnt = frameCnt;
    this.frameInc = frameInc;
    this.complete = false;
}
AnimationSprite.prototype = Object.create(Sprite.prototype);

AnimationSprite.prototype.updateFrame = function () {
    this.x += this.frameInc;
    this.frameCnt -= 1;

    this.complete = this.frameCnt <= 0
};
/**
 * Bullet class 
 * 
 * @param {number} x     start x position
 * @param {number} y     start y position
 * @param {number} vely  velocity in y direction
 * @param {number} w     width of the bullet in pixels
 * @param {number} h     height of the bullet in pixels
 * @param {string} color hex-color of bullet
 */
function Bullet(x, y, vely, w, h, color, enemy = false) {
    this.x = x;
    this.y = y;
    this.vely = vely;
    this.width = w;
    this.height = h;
    this.color = color;
    this.enemy = enemy;
};

/**
 * Update bullet position
 */
Bullet.prototype.update = function () {
    this.y += this.vely;
};


/**
 * Sub-type class canvas AliensCanvas, extends base class Canvas.
 *
 * Implements Canvas.
 * 
 * @param {number} width  width of canvas in pixels
 * @param {number} height height of canvas in pixels
 */
function AliensCanvas(width, height) {
    Canvas.call(this, width, height);
}
AliensCanvas.prototype = Object.create(Canvas.prototype);

/**
 * Draw a bullet instance to the canvas.
 * 
 * Extension method for the base class Canvas.
 *
 * @param  {Bullet} bullet the bullet to draw
 */
AliensCanvas.prototype.drawBullet = function (bullet) {
    // set the current fillstyle and draw bullet
    this.ctx.fillStyle = bullet.color;
    this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
};
AliensCanvas.prototype.drawBackground = function (backgroundImage, backgroundMovementYAxis) {
    // Pan background
    this.ctx.drawImage(backgroundImage, 0, 0, backgroundImage.width, backgroundImage.height);

    // Draw another image at the top edge of the first image
    this.ctx.drawImage(backgroundImage, 0, backgroundMovementYAxis, backgroundImage.width, backgroundImage.height);

};
AliensCanvas.prototype.drawImage = function (img, x, y) {
    this.ctx.drawImage(img, x, y, img.width, img.height);
};
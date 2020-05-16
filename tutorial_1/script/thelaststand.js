window.addEventListener('load', function () {

    // Define variables
    var canvasX = 500;
    var canvasY = 700;

    // Create game canvas
    var display = new AliensCanvas(canvasX, canvasY);

    // Initialise input handler
    var inputKey = new InputKeyHandler();

    var level = 1;
    var lvFrame = 60; // fps
    var score = 0;
    var lives = 3;

    var gameOver = false;
    var hitDetected = false;

    var newgameToggled = false;
    var showScoreToggled = false;
    var sound = true;
    var soundToggled = false;

    /**
     * Asset pre-loader object. Loads all images
     */
    var assetLoader = (function() {
        // Images array
        this.imgs        = {
            'bg'            : 'resource/bglong.png',
            'life'          : 'resource/life.png',
            'explosion'     : 'resource/explosion2.png',
            'sprites'       : 'resource/FINAL3.png', /// DG: TODO
            'tanks'         : 'resource/spaceships_full3.png',
        };

        var assetsLoaded = 0;                                // how many assets have been loaded
        var numImgs      = Object.keys(this.imgs).length;    // total number of image assets
        this.totalAssest = numImgs;                          // total number of assets

        /**
         * Ensure all assets are loaded before starting the game.
         * @param {number} dic  - Dictionary name ('imgs', 'sounds', 'fonts')
         * @param {number} name - Asset name in the dictionary
         */
        function assetLoaded(dic, name) {
            // Don't count assets that have already loaded.
            if (this[dic][name].status !== 'loading') {
                return;
            }

            this[dic][name].status = 'loaded';
            assetsLoaded++;

            // Finished callback.
            if (assetsLoaded === this.totalAssest && typeof this.finished === 'function') {
                this.finished();
            }
        }

        /**
         * Create assets, set callback for asset loading, set asset source.
         */
        this.downloadAll = function() {
            var _this = this;
            var src;

            // Load images
            for (var img in this.imgs) {
                if (this.imgs.hasOwnProperty(img)) {
                    src = this.imgs[img];

                    // Create a closure for event binding.
                    (function(_this, img) {
                        _this.imgs[img] = new Image();
                        _this.imgs[img].status = 'loading';
                        _this.imgs[img].name = img;
                        _this.imgs[img].onload = function() { assetLoaded.call(_this, 'imgs', img) };
                        _this.imgs[img].src = src;
                    })(_this, img);
                }
            }
        }

        return {
            imgs: this.imgs,
            totalAssest: this.totalAssest,
            downloadAll: this.downloadAll
        };
    })();

    assetLoader.finished = function () {
        startGame();
    }
    

    /**
     * Create the game object.
     */
    var game = (function () {

		var backgroundImage = null;
		var lifeIcon = null;
		var imgExpl = null;
		var alSprite = null;
		var taSprite = null;
		var soundFx = null;
		var bonusKills = 0;

		var bonusLevelUp1 = 20;
		var bonusLevelUp2 = 120;

		/**
		 * Instantiates all entities with their sprite image objetcs.
		 */
		this.loadSprites = function () {

			// Set the background image
			backgroundImage = assetLoader.imgs.bg;
			lifeIcon = assetLoader.imgs.life;
			imgExpl = assetLoader.imgs.explosion;

			// Create alien sprites in their two forms.
			alSprite = [];
			for (var i = 0, len = 10; i < len; i++) {
				alSprite.push([
					new Sprite(assetLoader.imgs.sprites, i * 40, 0, 40, 40),
					new Sprite(assetLoader.imgs.sprites, i * 40, 40, 40, 40)
				]);
			}

			// Create the fighter jet sprite based on user's region.
			if (typeof geolocation !== 'undefined') {
				console.log(geolocation);
			}
			
			// Load tank fighter sprite
			taSprite = new Sprite(assetLoader.imgs.tanks, 117, 114, 44, 50);
		};

  
        

        /**
         * Initate game objects, creates the objects (in numbers) 
            and puts them in arrays etc but does not visualise them.
         */
        this.init = function (alienRows, alienSpacing) {

            // Set start settings
            frames = 0;
            spFrame = 0;
            // Init alien direction to the right
            alienDirection = 1; 
            showScoreToggled = false;
            // State how many aliens per row and spacing in pixels.
            var alienRows = 6;
            var alienSpacing = 60;
            var spacing = alienSpacing;

            // Create the tank object
            // width and height are required for the intersection calculation.
            tank = {
                sprite: taSprite,
                x: (display.width - taSprite.w) / 2,
                y: display.height - (spacing + taSprite.h),

                w: taSprite.w,
                h: taSprite.h 
            };

            // Initatie explosions array.
            explosions = [];

            // Initatie bullet array.
            bullets = [];

            // Create and populate alien array.
            aliens = [];

            // Create 1 row with type 2 of alien, 2 rows with type 1, etc.
            var rows = [1, 0, 0, 2, 1]; 
            for (var i = 0, len = rows.length; i < len; i++) {
                for (var j = 0; j < alienRows; j++) {

                    var a = rows[i];
                    // Create right offseted alien and push to alien array.
                    // Push in array an object with the sprite object and unique coordinates generated by loop.
                    aliens.push({
                        sprite: alSprite[a],
                        x: 50 + j * spacing + [0, 4, 0][a],
                        y: 50 + i * spacing,
                        w: alSprite[a][0].w,
                        h: alSprite[a][0].h
                    });
                }
            }


            levelUp = false; 
        }
        
        /**
         * Draws the lifes and score on the canvas.
         */
        this.drawScore = function () {
            // Draw lives.
            for (var i = 0, len = lives; i < len; i++) {
                var inc = 5 + 20 * i;
                display.drawImage(lifeIcon, inc, canvasY - 25);
            }
        }

        /**
         * Draws the alien ships, bullets and explosions
         */
        this.drawSprites = function () {
            // Draw all aliens.
            for (var i = 0, len = aliens.length; i < len; i++) {
                var a = aliens[i];
                display.drawSprite(a.sprite[spFrame], a.x, a.y);
            }

            // Draw all explosions.
            for (var i = 0, len = explosions.length; i < len; i++) {
                var e = explosions[i];
                display.drawSprite(e.sprite, e.x, e.y);
            }

            // Save contetx and draw bullet then restore state just after.. 
            display.ctx.save();
            for (var i = 0, len = bullets.length; i < len; i++) {
                display.drawBullet(bullets[i]);
            }
            display.ctx.restore(); // since drawBullet sets fillStyle, we want to change back settings.

        }

        /**
         * Draws the fighter jet / tank to the canvas.
         */
        this.drawTank = function () {
             display.drawSprite(tank.sprite, tank.x, tank.y);
        }

        /**
         * Handles the movement of the tank by the given input commands. 
        */
        this.moveTank = function () {
            // Move Left ( < )
            if (inputKey.isDown(37)) { 
                tank.x -= 8;
            }
            // Move Right ( > )
            if (inputKey.isDown(39)) {
                tank.x += 8;
            }
      
            // New Game (ENTER)
            if (inputKey.isDown(13)) { 
                // Ensure one time call for toggle using callback method.
                if (!newgameToggled && gameOver) {
                    newgameToggled = true;
                    setTimeout("toggleNewGame()", 500);
                }
            }
            // Keep the tank sprite inside of the canvas.
            tank.x = Math.max(Math.min(tank.x, display.width - (30 + taSprite.w)), 30);
        }

        /**
         * Handles the bullets firing by key press function. 
         * Handles the bullet trajectory update movement.
         * Handles bullet hit action on aliens.
         */
        this.bulletPhysics = function () {

            // On space bar pressed event, create new bullet sprite into the bullets array.
            if (inputKey.isPressed(32)) { // Space
                bullets.push(new Bullet(tank.x + 10, tank.y, -8, 2, 12, "#ccff33", false)); 

                if (bonusKills > bonusLevelUp1) {
                    bullets.push(new Bullet(tank.x + 20, tank.y, -8, 2, 12, "#ccff33", false)); 
                }

                if (bonusKills > bonusLevelUp2) {
                    bullets.push(new Bullet(tank.x + 30, tank.y, -8, 2, 12, "#ccff33", false)); 
                }

              // todo: play sound
            }

            // Update all bullets position inside the canvas.
            for (var i = 0, len = bullets.length; i < len; i++) {
                var bullet = bullets[i];
                bullet.update();

                // Clear bullets which went outside of the canvas.
                if (bullet.y + bullet.height < 0 || bullet.y > display.height) {
                    bullets.splice(i, 1);
                    i--;
                    len--;
                    continue;
                }

                // Check if bullet hit any aliens and remove (splice) from array.
                for (var j = 0, len2 = aliens.length; j < len2; j++) {
                    var alien = aliens[j];

                    if (!bullet.enemy && AABBIntersect(bullet.x, bullet.y, bullet.width, bullet.height, alien.x, alien.y, alien.w, alien.h)) {

                        // Remove the hit alien from array.
                        aliens.splice(j, 1);
                        j--;
                        len2--;

                        // Remove the bullet in collision from array.
                        bullets.splice(i, 1);
                        i--;
                        len--;

                        // Increase score.
                        score += 100;

                        // Add bonus to the score if at no kill bonus 1.
                        if (bonusKills > bonusLevelUp1) {
                            score += bonusLevelUp1;
                        }
                        // Add bonus to the score if at no kill bonus 2.
                        if (bonusKills > bonusLevelUp2) {
                            score += bonusLevelUp2;
                        }

                        // Increase (no die) bonus.
                        bonusKills += 1;

                        // Create explosion at alien's coordinates.
                        // Create object from here since due to manipulation it will keep the same variables when assigned for next explosion.
                        // AnimationSprite: x,y of sprite, x,y size frame, n,n 15 fram count and increment x.
                        var exSprite = new AnimationSprite(imgExpl, 0, 0, 88, 88, 60, 88); 

                        ///var exp = exSprite;
                        explosions.push({
                            sprite: exSprite,
                            x: alien.x,
                            y: alien.y,
                            w: exSprite.w,
                            h: exSprite.y
                        });

						// todo: play sound
                    }
                }

                // Check if enemy bullets hit tank.
                if (bullet.enemy && AABBIntersect(bullet.x, bullet.y, bullet.width, bullet.height, tank.x, tank.y, tank.w, tank.h) && !hitDetected) { // orHitTimeout
                    destroyTank();
                    lives -= 1;
                    hitDetected = true;
                    bonusKills = 0; // bonus gets reset
                    setTimeout("resetHit()", 500); // callback
                    if (lives <= 0) {
                        gameOver = true;
                    }
                }
            }
        }

        /*
         * Handles the explosion animation updates.
        */
        this.exolosionPhysics = function () {
            // Update all the explosions frames.
            for (var i = 0; i < explosions.length; i++) {

                explosions[i].sprite.updateFrame();

                // Remove if animation is done
                if (explosions[i].sprite.complete) {
                    explosions.splice(i, 1);
                    i--;
                }
            }
        }

        /**
         * Handles alien sequential movement.
         */
        this.alienPhysics = function () {
            // generate alien shooting
            alienRandomAttack();

            // update the aliens at the current movement frequence
            if (frames % lvFrame === 0) {
                spFrame = (spFrame + 1) % 2; // switch animation by odd / even

                // Add +30 to add an extra movement to the right in sequence.
                var displayWidth = display.width + 30; 

                // Get the whole canvas width
                var _max = 0, _min = displayWidth;

                // Iterate through aliens and update postition
                for (var i = 0, len = aliens.length; i < len; i++) {
                    var a = aliens[i];
                    a.x += 30 * alienDirection;

                    // Find min/max values of all aliens for direction
                    // change test
                    _max = Math.max(_max, a.x + a.w);
                    _min = Math.min(_min, a.x);
                }

                // check if aliens should move down and change direction
                if (_max > displayWidth - 30 || _min < 30) {
                    // mirror direction and update position
                    alienDirection *= -1;
                    for (var i = 0, len = aliens.length; i < len; i++) {
                        aliens[i].x += 30 * alienDirection;
                        aliens[i].y += 30;
                    }
                }
            }
        }


        /**
         * Handles alien sequential movement.
         */
        this.gameplayPhysics = function () {

            // Recreate next level
            if (aliens.length == 0 && levelUp == false) {
                levelUp = true;
                level++;
                lives++;

                // Make it faster in movement.
                lvFrame -= 10; 

                // Lowest possible is 6.
                if (lvFrame <= 0) {
                    lvFrame = 6;
                }

                setTimeout("init()", 2000);

            }

            // Check if aliens have reaced bottom of the canvas to end game.
            for (var i = 0, len = aliens.length; i < len; i++) {
                // If one of the aliens has reached the tank's position
                if (aliens[i].y >= 590) { /// 770
                    destroyTank();
                    gameOver = true;
                    lives = 0;
                } 
            }
        }

        /**
         * Creates and handles the bullet trajectory shot by aliens.
         */
        this.alienRandomAttack = function () { 

            // Makes the alien shoot in an random fashion, when math is < 0.0.3
            if (Math.random() < 0.03 && aliens.length > 0) {

                // Get a random alien from the array.
                var alienShooter = aliens[Math.round(Math.random() * (aliens.length - 1))];

                // Iterate through aliens and check collision to make
                // sure only shoot from front line to ensure there is no alien in front of it. 
                for (var i = 0, len = aliens.length; i < len; i++) {
                    var alien = aliens[i];

                    // If there is collision with another alien in line, set that other alien the shooter. (move 1 row forward).
                    if (AABBIntersect(alienShooter.x, alienShooter.y, alienShooter.w, 100, alien.x, alien.y, alien.w, alien.h)) {
                        alienShooter = alien;
                    }
                }

                // Create and append new bullet from alien
                bullets.push(new Bullet(alienShooter.x + alienShooter.w * 0.5, alienShooter.y + alienShooter.h, 4, 3, 12, "#ff0000", true));
            }
        }

        /**
         * When fighter jet / tank is hit, it creates the explosion animation at its current position.
         */
        this.destroyTank = function () {
            // Create explosion at tank's coordinates.
            // Create object from here since due to manipulation it will keep the same variables when assigned for next explosion.
            // AnimationSprite: x,y of sprite, x,y size frame, n,n 15 fram count and increment x.
            var exSpriteTank = new AnimationSprite(imgExpl, 0, 0, 88, 88, 60, 88);
            explosions.push({
                sprite: exSpriteTank,
                x: tank.x,
                y: tank.y,
                w: exSpriteTank.w,
                h: exSpriteTank.y
            });
        }

        /**
         * Moves the tank in the middle of the canvas to restart the round after a hit.
         */
        this.resetHit = function () { 
            hitDetected = false;
            tank.x = (display.width - taSprite.w) / 2;
        }

        /**
         * Resets the game parameters in order to create a new game from start.
         */
        this.toggleNewGame = function () { 
            gameOver = false;
            lives = 3;
            score = 0;
            lvFrame = 60;
            level = 1;
            setTimeout("init()", 500);
            newgameToggled = false;
        }

        this.toggleUpdateScore = function () {
            // Execute the show and update user score in webpage.
            top.globalScore = score;
            top.updateScore();
            top.showScoreLoggedOut(score);
        }

        return {
            loadSounds: this.loadSounds,
            loadSprites: this.loadSprites,
            init: this.init,
            drawScore: this.drawScore,
            drawSprites: this.drawSprites,
            drawTank: this.drawTank,
            moveTank: this.moveTank,
            bulletPhysics: this.bulletPhysics,
            alienPhysics: this.alienPhysics,
            exolosionPhysics: this.exolosionPhysics,
            gameplayPhysics: this.gameplayPhysics
        };
    })();

    /**
     * Manages the game rendering states inside the canvas.
    
     * - Renders the alien objects inside of the canvas.
     * - Renders the tank object inside of the canvas.
     */
    function render() {
        // Clear the entire canvas.
        display.clear();

        // Draw the score on canvas
        display.drawText("SCORE: " + score, 55, 25); // top left
        display.drawText("LEVEL: " + level, canvasX - 55, canvasY - 5); // bottom right
        
		//display.drawText("" + locationName, canvasX - 55, 25); // top right

        game.drawScore();

        // When game over, logic stops in this method.
        if (gameOver) {
            // Draw the score on canvas
            display.drawText("GAME OVER - PRESS ENTER", canvasX / 2, canvasY / 2);
            // Executes the showScore outside of the game frame.
            if (!showScoreToggled) {
                setTimeout("toggleUpdateScore()", 100);
                showScoreToggled = true;
            }
            return;
        }

        // Draw alien ships, bullets and explosions.
        game.drawSprites();

        // Draw the tank sprite
        if (!hitDetected) {
            game.drawTank();
        }
    }
    
    /**
     * Update the game logic
     */
    function update() {
        // Update the tank movements.
        game.moveTank();
        if (gameOver) {
            return;
        }
        // Keep a frame counter make animations based on 
        // odd/even frame. Such as the aliens movement.
        frames++;

        // Run the game physics loops.
        game.bulletPhysics();
        game.alienPhysics();
        game.exolosionPhysics();
        game.gameplayPhysics();
    };

    /**
     * Game loop.
     */
    function loop() {
        requestAnimFrame(loop);
        update();
        render();
    }

    /**
     * Request Animation Polyfill.
     */
    var requestAnimFrame = (function () {
        return window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function (callback, element) {
                    window.setTimeout(callback, 1000 / 60);
                };
    })();

    /**
     * Start the game.
     */
    function startGame() {
        ///game.loadSounds();
        game.loadSprites();
        game.init();
        loop();
    }

    // First method to run.
    assetLoader.downloadAll();
});
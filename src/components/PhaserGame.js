// src/components/PhaserGame.js
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

const sizes = {
    width: 1200,
    height: 800,
};

const PhaserGame = () => {
    const gameRef = useRef(null);
    let map, player, cursors, groundLayer, coinLayer, scoreText, titleText, instructionsText;
    let score = 0;
    const coinTiles = new Set();
    let bg1, bg2; // Variables for the background images
    let bgm;

    useEffect(() => {
        const preloadAssets = (scene) => {
            scene.load.tilemapTiledJSON('map', 'assets/map.json');
            scene.load.spritesheet('tiles', 'assets/tiles.png', { frameWidth: 70, frameHeight: 70 });
            scene.load.image('coin', 'assets/coinGold.png');
            scene.load.image('background', 'assets/forest_bg.jpg'); // Load your background image
            scene.load.atlas('luffy_idle', 'assets/luffy_idle.png', 'assets/luffy_idle.json');
            scene.load.atlas('luffy_jump', 'assets/luffy_jump.png', 'assets/luffy_jump.json');
            scene.load.atlas('luffy_run', 'assets/luffy_run.png', 'assets/luffy_run.json');
            scene.load.audio('bgm', 'assets/binks-sake-org.mp3');
        };

        const createAnimations = (scene) => {
            scene.anims.create({
                key: 'walk',
                frames: scene.anims.generateFrameNames('luffy_run', { prefix: 'sprite_', start: 1, end: 8 }),
                frameRate: 10,
                repeat: -1,
            });
            scene.anims.create({
                key: 'idle',
                frames: scene.anims.generateFrameNames('luffy_idle', { prefix: 'sprite_', start: 1, end: 1 }),
                frameRate: 4,
                repeat: -1,
            });
            scene.anims.create({
                key: 'jump',
                frames: scene.anims.generateFrameNames('luffy_jump', { prefix: 'sprite_', start: 3, end: 3 }),
                frameRate: 1,
                repeat: -1,
            });
        };

        const collectCoin = (player, tile) => {
            if (coinTiles.has(tile)) {
                const tileRemoved = coinLayer.removeTileAt(tile.x, tile.y);
                if (tileRemoved) {
                    score++;
                    scoreText.setText(`Score: ${score}`);
                    coinTiles.delete(tile);
                }
            }
            return false;
        };

        const phaserConfig = {
            type: Phaser.AUTO,
            width: sizes.width,
            height: sizes.height,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 500 },
                    debug: false,
                },
            },
            scene: {
                key: 'main',
                preload: function () {
                    preloadAssets(this);
                },
                create: function () {
                    bgm = this.sound.add("bgm");
                    // Add two background images for the infinite effect
                    bg1 = this.add.image(0, 0, 'background').setOrigin(0, 0);
                    bg2 = this.add.image(bg1.width, 0, 'background').setOrigin(0, 0); // Position the second background next to the first

                    map = this.make.tilemap({ key: 'map' });
                    const groundTiles = map.addTilesetImage('tiles');
                    groundLayer = map.createLayer('World', groundTiles, 0, sizes.height - 620);

                    if (groundLayer) {
                        groundLayer.setCollisionByExclusion([-1]);
                        this.physics.world.bounds.width = groundLayer.width;
                        this.physics.world.bounds.height = groundLayer.height;
                    } else {
                        console.error('Failed to create ground layer');
                    }

                    const coinTileset = map.addTilesetImage('coin');
                    coinLayer = map.createLayer('Coins', coinTileset, 0, sizes.height - 620);

                    coinLayer.forEachTile(tile => {
                        if (tile.index !== -1) {
                            coinTiles.add(tile);
                        }
                    });

                    player = this.physics.add.sprite(100, sizes.height - 250, 'luffy_idle');
                    player.setScale(1.8);
                    player.setCollideWorldBounds(true);
                    this.physics.add.collider(groundLayer, player);
                    this.physics.add.overlap(player, coinLayer, collectCoin, null, this);

                    cursors = this.input.keyboard.createCursorKeys();
                    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
                    this.cameras.main.startFollow(player);
                    this.cameras.main.setBackgroundColor('#ccccff');

                    // Title text
                    titleText = this.add.text(sizes.width / 2, 20, 'Collect the Coins!', {
                        fontSize: '40px',
                        fill: '#ffcc00',
                        align: 'center',
                        fontFamily: 'Arial'
                    }).setOrigin(0.5, 0);

                    // Instructions text
                    instructionsText = this.add.text(sizes.width / 2, 60, 'Use arrow keys to move and jump', {
                        fontSize: '20px',
                        fill: '#ffffff',
                        align: 'center',
                        fontFamily: 'Arial'
                    }).setOrigin(0.5, 0);

                    // Score text
                    scoreText = this.add.text(sizes.width - 20, 100, 'Score: 0', {
                        fontSize: '20px',
                        fill: '#ffffff',
                        align: 'right',
                        fontFamily: 'Arial'
                    }).setOrigin(1, 0);
                    scoreText.setScrollFactor(0);

                    
                    createAnimations(this);

                    bgm = this.sound.add('bgm');
                    bgm.play({ loop: true });
                },
                update: function () {
                    // Update background positions based on player's position
                    bg1.x = this.cameras.main.scrollX; // Follow the camera's x position
                    bg2.x = bg1.x + bg1.width; // Position bg2 right after bg1

                    // Check if the second background is out of bounds, reposition if necessary
                    if (bg1.x < -bg1.width) {
                        bg1.x = bg2.x + bg2.width;
                    }
                    if (bg2.x < -bg2.width) {
                        bg2.x = bg1.x + bg1.width;
                    }

                    if (cursors.left.isDown) {
                        player.body.setVelocityX(-200);
                        player.anims.play('walk', true);
                        player.flipX = true;
                    } else if (cursors.right.isDown) {
                        player.body.setVelocityX(200);
                        player.anims.play('walk', true);
                        player.flipX = false;
                    } else {
                        player.body.setVelocityX(0);
                        player.anims.play('idle', true);
                        if (player.body.velocity.y > 200 || player.body.velocity.y < -200) {
                            player.anims.play('jump', true);
                        }
                    }
                    if (cursors.space.isDown || cursors.up.isDown) {
                        player.body.setVelocityY(-400);
                        player.anims.play('jump', true);
                    }
                },
            },
            parent: 'gameCanvasContainer',
            render: {
                pixelArt: true,
                antialias: false,
            },
        };

        gameRef.current = new Phaser.Game(phaserConfig);

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
            }
        };
    }, []);

    return (
        <div id="gameCanvasContainer" style={{ width: sizes.width, height: sizes.height }}>
        </div>
    );
};

export default PhaserGame;

// src/components/PhaserGame.js
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

const sizes = {
    width: 1200,
    height: 800,
};

const PhaserGame = () => {
    const gameRef = useRef(null);
    let map, player, cursors, groundLayer, coinLayer, text;
    let score = 0;
    const coinTiles = new Set(); // Define coinTiles as a Set to store coin tile references
    
    useEffect(() => {
        const preloadAssets = (scene) => {
            scene.load.tilemapTiledJSON('map', 'assets/map.json');
            scene.load.spritesheet('tiles', 'assets/tiles.png', { frameWidth: 70, frameHeight: 70 });
            scene.load.image('coin', 'assets/coinGold.png');
            scene.load.atlas('luffy_idle', 'assets/luffy_idle.png', 'assets/luffy_idle.json');
            scene.load.atlas('luffy_jump', 'assets/luffy_jump.png', 'assets/luffy_jump.json');
            scene.load.atlas('luffy_run', 'assets/luffy_run.png', 'assets/luffy_run.json');
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
                frameRate: 1, // 1 frame per second for jump animation
                repeat: -1,
            });
        };

        const collectCoin = (player, tile) => {
            // Only increment the score if the coin tile is in the Set
            if (coinTiles.has(tile)) {
                const tileRemoved = coinLayer.removeTileAt(tile.x, tile.y); // Attempt to remove the tile

                if (tileRemoved) {
                    score++; // Increment the score
                    text.setText(score.toString()); // Update the score display
                    coinTiles.delete(tile); // Remove the tile from the Set after collecting
                }
            }

            return false; // Return false to prevent further processing
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

                    // Store coin tile references in the Set
                    coinLayer.forEachTile(tile => {
                        if (tile.index !== -1) { // Check if it's a valid coin tile
                            coinTiles.add(tile); // Add the tile reference to the Set
                        }
                    });

                    player = this.physics.add.sprite(100, sizes.height - 250, 'luffy_idle');
                    player.setScale(1.8);
                    // player.setBounce(0.2);
                    player.setCollideWorldBounds(true);
                    this.physics.add.collider(groundLayer, player);
                    this.physics.add.overlap(player, coinLayer, collectCoin, null, this);

                    cursors = this.input.keyboard.createCursorKeys();
                    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
                    this.cameras.main.startFollow(player);
                    this.cameras.main.setBackgroundColor('#ccccff');

                    text = this.add.text(20, 570, '0', {
                        fontSize: '20px',
                        fill: '#ffffff'
                    });
                    text.setScrollFactor(0);

                    createAnimations(this);
                },
                update: function () {
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
                        if (player.body.velocity.y > 200) {
                            player.anims.play('jump', true);
                        } else if (player.body.velocity.y < -200) {
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

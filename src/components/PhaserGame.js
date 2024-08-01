import React, { useEffect, useRef, useMemo } from 'react';
import Phaser from 'phaser';

const sizes = {
    width: 1200,
    height: 800,
};

const playerSpeed = 400;
const playerJumpValocity = 500;

const PhaserGame = () => {
    const gameRef = useRef(null);
    const mapRef = useRef(null);
    const playerRef = useRef(null);
    const cursorsRef = useRef(null);
    const groundLayerRef = useRef(null);
    const coinLayerRef = useRef(null);
    const scoreTextRef = useRef(null);
    const titleTextRef = useRef(null);
    const instructionsTextRef = useRef(null);
    const bg1Ref = useRef(null);
    const bg2Ref = useRef(null);
    const bgmRef = useRef(null);
    const score = useRef(0);

    const coinTiles = useMemo(() => new Set(), []);  // Ensure coinTiles is only created once

    useEffect(() => {
        const preloadAssets = (scene) => {
            scene.load.tilemapTiledJSON('map', 'assets/map.json');
            scene.load.spritesheet('tiles', 'assets/tiles.png', { frameWidth: 70, frameHeight: 70 });
            scene.load.image('coin', 'assets/coinGold.png');
            scene.load.image('background', 'assets/forest_bg.jpg'); // Load your background image
            scene.load.atlas('luffy_idle', 'assets/luffy_idle.png', 'assets/luffy_idle.json');
            scene.load.atlas('luffy_jump', 'assets/luffy_jump.png', 'assets/luffy_jump.json');
            scene.load.atlas('luffy_run', 'assets/luffy_run.png', 'assets/luffy_run.json');
            scene.load.audio('bgm', 'assets/binks_sake_2.mp3');
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
                const tileRemoved = coinLayerRef.current.removeTileAt(tile.x, tile.y);
                if (tileRemoved) {
                    score.current++;
                    scoreTextRef.current.setText(`Score: ${score.current}`);
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
                    bgmRef.current = this.sound.add("bgm");
                    bg1Ref.current = this.add.image(0, 0, 'background').setOrigin(0, 0);
                    bg2Ref.current = this.add.image(bg1Ref.current.width, 0, 'background').setOrigin(0, 0);

                    mapRef.current = this.make.tilemap({ key: 'map' });
                    const groundTiles = mapRef.current.addTilesetImage('tiles');
                    groundLayerRef.current = mapRef.current.createLayer('World', groundTiles, 0, sizes.height - 620);

                    if (groundLayerRef.current) {
                        groundLayerRef.current.setCollisionByExclusion([-1]);
                        this.physics.world.bounds.width = groundLayerRef.current.width;
                        this.physics.world.bounds.height = groundLayerRef.current.height;
                    } else {
                        console.error('Failed to create ground layer');
                    }
                    this.physics.world.setBounds(0, 0, Infinity, sizes.height);
                    const coinTileset = mapRef.current.addTilesetImage('coin');
                    coinLayerRef.current = mapRef.current.createLayer('Coins', coinTileset, 0, sizes.height - 620);

                    coinLayerRef.current.forEachTile(tile => {
                        if (tile.index !== -1) {
                            coinTiles.add(tile);
                        }
                    });
                    playerRef.current = this.physics.add.sprite(100, sizes.height - 250, 'luffy_idle');
                    playerRef.current.setScale(1.8);
                    playerRef.current.setCollideWorldBounds(true);
                    this.physics.add.collider(groundLayerRef.current, playerRef.current);
                    this.physics.add.overlap(playerRef.current, coinLayerRef.current, collectCoin, null, this);

                    cursorsRef.current = this.input.keyboard.createCursorKeys();
                    const keys = this.input.keyboard.addKeys('W,A,D');
                    cursorsRef.current.w = keys.W;
                    cursorsRef.current.a = keys.A;
                    cursorsRef.current.d = keys.D;
                    this.cameras.main.setBounds(0, 0, Infinity, mapRef.current.heightInPixels);
                    this.cameras.main.startFollow(playerRef.current);
                    this.cameras.main.setBackgroundColor('#ccccff');

                    titleTextRef.current = this.add.text(sizes.width / 2, 20, 'Collect the Coins!', {
                        fontSize: '40px',
                        fill: '#ffcc00',
                        align: 'center',
                        fontFamily: 'Arial'
                    }).setOrigin(0.5, 0);

                    instructionsTextRef.current = this.add.text(sizes.width / 2, 60, 'Use arrow keys to move and jump', {
                        fontSize: '20px',
                        fill: '#ffffff',
                        align: 'center',
                        fontFamily: 'Arial'
                    }).setOrigin(0.5, 0);

                    scoreTextRef.current = this.add.text(sizes.width - 20, 100, 'Score: 0', {
                        fontSize: '20px',
                        fill: '#ffffff',
                        align: 'right',
                        fontFamily: 'Arial'
                    }).setOrigin(1, 0);
                    scoreTextRef.current.setScrollFactor(0);

                    createAnimations(this);

                    bgmRef.current = this.sound.add('bgm');
                    bgmRef.current.play({ loop: true });
                },
                update: function () {
                    bg1Ref.current.x = this.cameras.main.scrollX;
                    bg2Ref.current.x = bg1Ref.current.x + bg1Ref.current.width;

                    // Move the player left and right
                    if (cursorsRef.current.left.isDown || cursorsRef.current.a.isDown) {
                        playerRef.current.body.setVelocityX(-playerSpeed);
                        playerRef.current.anims.play('walk', true);
                        playerRef.current.flipX = true;
                    } else if (cursorsRef.current.right.isDown || cursorsRef.current.d.isDown) {
                        playerRef.current.body.setVelocityX(playerSpeed);
                        playerRef.current.anims.play('walk', true);
                        playerRef.current.flipX = false;
                    } else {
                        playerRef.current.body.setVelocityX(0);
                        playerRef.current.anims.play('idle', true);
                    }

                    // Handle jumping logic
                    if (cursorsRef.current.space.isDown || cursorsRef.current.up.isDown || cursorsRef.current.w.isDown) {
                        // Check if the player is on the ground before allowing a jump
                        if (playerRef.current.body.onFloor()) {
                            playerRef.current.body.setVelocityY(-playerJumpValocity);
                            playerRef.current.anims.play('jump', true);
                        }
                    }

                    // Change the animation based on vertical velocity for jump state
                    if (playerRef.current.body.velocity.y < -150) {
                        playerRef.current.anims.play('jump', true);
                    } else if (playerRef.current.body.velocity.y > 150 && !playerRef.current.body.onFloor()) {
                        playerRef.current.anims.play('jump', true);
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
    }, [coinTiles]);

    return (
        <div id="gameCanvasContainer" style={{ width: sizes.width, height: sizes.height }}>
        </div>
    );
};

export default PhaserGame;

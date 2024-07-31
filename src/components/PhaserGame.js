// src/components/PhaserGame.js
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

const sizes = {
    width: 1200,
    height: 1200,
};

const bucketSize = {
    width: 200,
    height: 150
}

class GameScene extends Phaser.Scene {
    player;
    cursor;

    constructor() {
        super('scene-game');
    }

    preload() {
        this.load.image('bg', '/assets/bg.png');
        this.load.image('basket', '/assets/basket.png');
    }

    create() {
        this.add.image(0, 0, 'bg').setOrigin(0, 0).setDisplaySize(sizes.width, sizes.height);
        this.player = this.physics.add.image(sizes.width / 2, sizes.height - 100, 'basket').setOrigin(0.5, 0.5).setDisplaySize(bucketSize.width, bucketSize.height);
        this.player.setCollideWorldBounds(true);
        this.cursor = this.input.keyboard.createCursorKeys();
    }

    update() {
        this.player.setVelocityX(0);
        if (this.cursor.left.isDown) {
            this.player.setVelocityX(-400);
        } else if (this.cursor.right.isDown) {
            this.player.setVelocityX(400);
        }
    }
}

const PhaserGame = () => {
    const gameRef = useRef(null);

    useEffect(() => {
        const config = {
            type: Phaser.AUTO,
            width: sizes.width,
            height: sizes.height,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 500 },
                    debug: true,
                },
            },
            scene: GameScene,
            parent: 'gameCanvasContainer',
            render: {
                pixelArt: true,
                antialias: false,
            },
        };

        gameRef.current = new Phaser.Game(config);

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

import { Scene } from 'phaser';
import Character from '../classes/Character';
import DialogueBox from '../classes/DialogueBox';
import DialogueManager from '../classes/DialogueManager';

export class Game extends Scene {
    constructor() {
        super('Game');
        this.controls = null;
        this.player = null;
        this.cursors = null;
        this.dialogueBox = null;
        this.spaceKey = null;
        this.activePhilosopher = null;
        this.dialogueManager = null;
        this.philosophers = [];
        this.labelsVisible = true;
    }

    create() {
        const map = this.createTilemap();
        const tileset = this.addTileset(map);
        const layers = this.createLayers(map, tileset);

        this.createPhilosophers(map, layers);
        this.player = this.krishna.sprite;

        const camera = this.setupCamera(map);
        this.setupControls(camera);
        this.setupDialogueSystem();
    }

    createPhilosophers(map, layers) {
        const philosopherConfigs = [
            {
                id: "krishna",
                name: "Krishna",
                defaultDirection: "front",
                roamRadius: 800,
                defaultMessage: "I am Krishna. Let me guide you through dharma, karma and truth."
            },
            {
                id: "vivekananda",
                name: "Vivekananda",
                defaultDirection: "right",
                roamRadius: 800,
                defaultMessage: "Arise, awake and stop not until the goal is reached."
            }
        ];

        this.philosophers = [];

        philosopherConfigs.forEach(config => {
            const spawnPoint = map.findObject("Objects", (obj) =>
                obj.name === config.name || obj.name.toLowerCase() === config.id);

            if (!spawnPoint) {
                console.error(`🚨 Spawn point not found for "${config.name}". Please check your Tiled map's "Objects" layer.`);
                return;
            }

            this[config.id] = new Character(this, {
                id: config.id,
                name: config.name,
                spawnPoint: spawnPoint,
                atlas: config.id,
                defaultDirection: config.defaultDirection,
                worldLayer: layers.worldLayer,
                defaultMessage: config.defaultMessage,
                roamRadius: config.roamRadius,
                moveSpeed: config.moveSpeed || 40,
                pauseChance: config.pauseChance || 0.2,
                directionChangeChance: config.directionChangeChance || 0.3,
                handleCollisions: true
            });

            this.createPhilosopherAnimations(config.id);
            this.philosophers.push(this[config.id]);
        });

        this.togglePhilosopherLabels(true);
        this.physics.add.collider(this.krishna.sprite, this.vivekananda.sprite);
    }

    createPhilosopherAnimations(id) {
        const directions = ["left", "right", "front", "back"];
        directions.forEach(direction => {
            const key = `${id}-${direction}-walk`;
            if (!this.anims.exists(key)) {
                this.anims.create({
                    key,
                    frames: this.anims.generateFrameNames(id, {
                        prefix: `${id}-${direction}-walk-`,
                        start: 0,
                        end: 8,
                        zeroPad: 4
                    }),
                    frameRate: 10,
                    repeat: -1
                });
            }
        });
    }

    createTilemap() {
        return this.make.tilemap({ key: "map" });
    }

    addTileset(map) {
        const tuxmonTileset = map.addTilesetImage("tuxmon-sample-32px-extruded", "tuxmon-tiles");
        const greeceTileset = map.addTilesetImage("ancient_greece_tileset", "greece-tiles");
        const plantTileset = map.addTilesetImage("plant", "plant-tiles");

        return [tuxmonTileset, greeceTileset, plantTileset];
    }

    createLayers(map, tilesets) {
        const belowLayer = map.createLayer("Below Player", tilesets, 0, 0);
        const worldLayer = map.createLayer("World", tilesets, 0, 0);
        const aboveLayer = map.createLayer("Above Player", tilesets, 0, 0);
        worldLayer.setCollisionByProperty({ collides: true });
        aboveLayer.setDepth(10);
        return { belowLayer, worldLayer, aboveLayer };
    }

    setupCamera(map) {
        const camera = this.cameras.main;
        camera.startFollow(this.player);
        camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        return camera;
    }

    setupControls(camera) {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.controls = new Phaser.Cameras.Controls.FixedKeyControl({
            camera: camera,
            left: this.cursors.left,
            right: this.cursors.right,
            up: this.cursors.up,
            down: this.cursors.down,
            speed: 0.5,
        });
    }

    setupDialogueSystem() {
        const screenPadding = 20;
        const maxDialogueHeight = 200;

        this.dialogueBox = new DialogueBox(this);
        this.dialogueText = this.add
            .text(
                60,
                this.game.config.height - maxDialogueHeight - screenPadding + screenPadding,
                '',
                {
                    font: "18px monospace",
                    fill: "#ffffff",
                    padding: { x: 20, y: 10 },
                    wordWrap: { width: 680 },
                    lineSpacing: 6,
                    maxLines: 5
                }
            )
            .setScrollFactor(0)
            .setDepth(30)
            .setVisible(false);

        this.spaceKey = this.input.keyboard.addKey('SPACE');
        this.dialogueManager = new DialogueManager(this);
        this.dialogueManager.initialize(this.dialogueBox);
    }

    checkPhilosopherInteraction() {
        let nearbyPhilosopher = null;

        for (const philosopher of this.philosophers) {
            if (philosopher.isPlayerNearby(this.player)) {
                nearbyPhilosopher = philosopher;
                break;
            }
        }

        if (nearbyPhilosopher) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                if (!this.dialogueBox.isVisible()) {
                    this.dialogueManager.startDialogue(nearbyPhilosopher);
                } else if (!this.dialogueManager.isTyping) {
                    this.dialogueManager.continueDialogue();
                }
            }

            if (this.dialogueBox.isVisible()) {
                nearbyPhilosopher.facePlayer(this.player);
            }
        } else if (this.dialogueBox.isVisible()) {
            this.dialogueManager.closeDialogue();
        }
    }

    update(time, delta) {
        const isInDialogue = this.dialogueBox.isVisible();

        this.checkPhilosopherInteraction();

        this.philosophers.forEach(philosopher => {
            philosopher.update(this.player, isInDialogue);
        });

        if (this.controls) {
            this.controls.update(delta);
        }
    }

    togglePhilosopherLabels(visible) {
        this.philosophers.forEach(philosopher => {
            if (philosopher.nameLabel) {
                philosopher.nameLabel.setVisible(visible);
            }
        });
    }
}

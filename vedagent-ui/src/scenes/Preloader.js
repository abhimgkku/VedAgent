import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    preload ()
    {
        this.load.setPath('assets');

        // General assets
        this.load.image('background', 'front_intro.png');
        this.load.image('logo', 'logo.png');

        // Tilesets
        this.load.image("tuxmon-tiles", "tilesets/tuxmon-sample-32px-extruded.png");
        this.load.image("greece-tiles", "tilesets/ancient_greece_tileset.png");
        this.load.image("plant-tiles", "tilesets/plant.png");

        // Tilemap
        this.load.tilemapTiledJSON("map", "tilemaps/vedagent-town.json");

        // Character assets
        this.load.atlas("krishna", "characters/krishna/atlas.png", "characters/krishna/atlas.json");
        this.load.atlas("vivekananda", "characters/vivekananda/atlas.png", "characters/vivekananda/atlas.json"); 
    }

    create ()
    {
        this.scene.start('MainMenu');
    }
}

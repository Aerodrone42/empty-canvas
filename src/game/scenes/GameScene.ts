import Phaser from "phaser";

import { MusicDirector } from "../audio/Music";
import {
  CRIT_CHANCE,
  CRIT_MULT,
  FLESH_HEAVY_BONUS,
  FLESH_PER_HIT,
  PARRY,
  boxHitsBody,
  strikeBox,
  type Strike,
} from "../combat";
import { DamageNumbers, type DamageKind } from "../effects/DamageNumbers";


import { Profiler } from "../debug/Profiler";
import { AmbientCritters } from "../effects/AmbientCritters";
import { placeTorches, type FloorTorch } from "../effects/FloorTorch";
import { AbsorbPrompt } from "../effects/AbsorbPrompt";
import { BloodFX } from "../effects/Blood";
import { BloodAltar } from "../effects/BloodAltar";
import { GuardFX } from "../effects/GuardFX";
import { CrucifiedProp } from "../effects/CrucifiedProp";
import { DreadMount } from "../effects/DreadMount";
import { CorridorVein } from "../effects/CorridorVein";
import { scatterFleshBlobs, type FleshBlob } from "../effects/FleshBlob";
import { WeepingStatue } from "../effects/WeepingStatue";
import { GateColumn } from "../effects/GateColumn";
import { Parallax } from "../effects/Parallax";
import { TortureRack } from "../effects/TortureRack";
import { Bourreau, EcorchePendu, Enemy, PenitentGreffe, SuppliantRampant } from "../entities/Enemy";

import { GraspingHands } from "../entities/GraspingHands";
import { Pickup } from "../entities/Pickup";
import { Player } from "../entities/Player";
import { ROOM_LABELS, ROOM_ORDER } from "../rooms";
import { ROOM_CONFIG, gateXOf, type RoomConfig, type SpawnDef } from "../roomConfig";
import type { BackdropKey } from "@/game/assets";
import { ABSORB_COST, useGameStore } from "@/store/gameStore";

const ROOM_HEIGHT = 900;
/** supplicie ecorche : decor anime au centre de la cathedrale */
// Emplacement marque par la croix rouge : juste a droite de la zone de depart.
const CRUCIFIED_X = 430;
/** suppliciee (femme) : juste a droite du supplicie */
const CRUCIFIED_WOMAN_X = 690;

const FLOOR_Y = 880;
/** soin par seconde en se reposant dans une flaque de sang */
const POOL_REGEN_PER_SEC = 6;
/** distance en dessous de laquelle une creature empeche de se soigner */
const SAFE_RADIUS = 300;
/** seconde moitie de la cathedrale : la monture d'effroi fond sur le heros */
const MOUNT_TRIGGER_X = 1500;
/** machine d'ecartellement du corridor */
const TORTURE_RACK_X = 1320;
/** degats subis en tombant dans une fosse */
const PIT_DAMAGE = 14;









export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private hands: GraspingHands[] = [];
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private blood!: BloodFX;
  private guardFx!: GuardFX;
  private absorbPrompt?: AbsorbPrompt;
  /** chiffres de degats flottants */
  private damageNumbers!: DamageNumbers;
  private parallax!: Parallax;
  private pickups: Pickup[] = [];
  /** panneau de diagnostic des performances (F3) */
  private profiler!: Profiler;
  /** salle courante : determine le decor et la palette */
  private backdropKey: BackdropKey = "cathedrale";
  /** colonne de sortie et son verrou physique */
  private gateColumn?: GateColumn;
  /** supplicie ecorche du fond de la cathedrale */
  private crucified?: CrucifiedProp;
  /** suppliciee (femme) a droite du supplicie */
  private crucifiedWoman?: CrucifiedProp;

  /** monture funebre qui traverse le ciel de la cathedrale */
  private mount?: DreadMount;
  /** veine geante animee du corridor */
  private vein?: CorridorVein;
  private statues: WeepingStatue[] = [];
  /** amas de chair decoratifs colles au mur du corridor */
  private blobs: FleshBlob[] = [];
  /** machine d'ecartellement du corridor */
  private wheel?: TortureRack;
  /** rats et chauves-souris : vie de fond purement decorative */
  private critters?: AmbientCritters;
  /** torcheres sur pied : decor pur, aucune interaction */
  private torches: FloorTorch[] = [];
  private gateWall?: Phaser.GameObjects.Rectangle;
  /** mur de chair qui se referme derriere le heros dans une arene */
  private arenaWall?: Phaser.GameObjects.Rectangle;
  private arenaLocked = false;
  /** autel de sang : point de sauvegarde de la salle */
  private altar?: BloodAltar;
  /** position de depart du heros (autel scelle apres une mort) */
  private spawnX = 180;
  /** desabonnement du store (reapparition) */
  private unsubRespawn?: () => void;

  /** configuration de la salle courante */
  private room: RoomConfig = ROOM_CONFIG.cathedrale;
  /** vagues restantes (arene) */
  private pendingWaves: SpawnDef[][] = [];
  private waveIncoming = false;
  /** compteur de creatures restantes affiche en haut de l'ecran */
  private counterText?: Phaser.GameObjects.Text;

  /** bande-son adaptative (ambiance / combat) */
  private music?: MusicDirector;
  private roomCleared = false;


  private exiting = false;
  /** le heros touche le plateau (mis a jour par le collider) */


  constructor() {
    super("game");
  }

  init(data?: { backdrop?: BackdropKey; spawnX?: number }) {
    this.backdropKey = data?.backdrop ?? "cathedrale";
    this.room = ROOM_CONFIG[this.backdropKey];
    this.spawnX = data?.spawnX ?? this.room.spawnX;
    // memorise la salle atteinte : point de reprise du menu Continuer
    useGameStore.getState().setStage(this.backdropKey);
  }



  create() {
    this.enemies = [];
    this.pickups = [];
    this.statues = [];
    this.vein = undefined;
    for (const blob of this.blobs) blob.destroy();
    this.blobs = [];
    this.wheel?.destroy();
    this.wheel = undefined;
    this.critters?.destroy();
    this.critters = undefined;
    this.mount?.destroy();
    this.mount = undefined;
    this.altar?.destroy();
    this.altar = undefined;
    this.absorbPrompt?.destroy();
    this.absorbPrompt = undefined;
    for (const t of this.torches) t.destroy();
    this.torches = [];

    this.exiting = false;
    this.roomCleared = false;
    this.arenaLocked = false;
    this.arenaWall = undefined;
    this.waveIncoming = false;
    this.pendingWaves = (this.room.waves ?? []).map((w) => [...w]);
    this.physics.world.setBounds(0, 0, this.room.width, ROOM_HEIGHT);
    this.cameras.main.setBounds(0, 0, this.room.width, ROOM_HEIGHT);
    this.cameras.main.setBackgroundColor(0x14090b);
    this.cameras.main.fadeIn(500, 0, 0, 0);


    this.profiler = new Profiler(this);
    // une piste par salle : choeur, suspense, ou theme principal
    this.music = new MusicDirector(this, {
      intro: this.room.music === "choir",
      suspense: this.room.music === "suspense",
    });


    this.blood = new BloodFX(this, FLOOR_Y);
    this.guardFx = new GuardFX(this);
    this.damageNumbers = new DamageNumbers(this);
    this.absorbPrompt = new AbsorbPrompt(this);

    this.buildBackdrop();
    this.buildGeometry();
    this.buildGate();

    this.player = new Player(this, this.spawnX, FLOOR_Y);
    this.physics.add.collider(this.player, this.platforms);

    this.populateRoom();

    // repere de progression : creatures restantes / vagues a venir
    this.counterText?.destroy();
    this.counterText = this.add
      .text(this.cameras.main.width - 24, 24, "", {
        fontFamily: "Georgia, serif",
        fontSize: "16px",
        color: "#a98b8b",
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(58)
      .setAlpha(0.85);

    this.showRoomTitle();

    // suivi horizontal uniquement : au saut, l'image ne doit pas bouger
    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.2, 0, 0, 0);
    // zone morte etroite : la camera repart des que le heros s'ecarte un peu
    // du centre, sinon on marche longtemps sans que l'image bouge
    cam.setDeadzone(180, ROOM_HEIGHT);

    cam.setScroll(cam.scrollX, ROOM_HEIGHT - cam.height);


    // mort puis reapparition : la salle est relancee depuis l'autel scelle
    this.unsubRespawn = useGameStore.subscribe((state, prev) => {
      if (state.respawnToken === prev.respawnToken) return;
      const target = state.checkpoint?.stage === this.backdropKey ? state.checkpoint.x : 180;
      this.scene.restart({ backdrop: this.backdropKey, spawnX: target });
    });

    this.events.on("player-strike", this.resolvePlayerStrike, this);
    this.events.on("enemy-strike", this.resolveEnemyStrike, this);
    this.events.on("fx-blood", this.onBlood, this);
    this.events.on("fx-gore", this.onGore, this);
    this.events.on("fx-sparks", this.onSparks, this);
    this.events.on("fx-damage", this.onDamageNumber, this);
    this.events.on("fx-heal", this.onHeal, this);
    this.events.on("enemy-died", this.onEnemyDied, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off("player-strike", this.resolvePlayerStrike, this);
      this.events.off("enemy-strike", this.resolveEnemyStrike, this);
      this.events.off("fx-blood", this.onBlood, this);
      this.events.off("fx-gore", this.onGore, this);
      this.events.off("fx-sparks", this.onSparks, this);
      this.events.off("fx-damage", this.onDamageNumber, this);
      this.damageNumbers?.destroy();
      this.events.off("fx-heal", this.onHeal, this);
      this.events.off("enemy-died", this.onEnemyDied, this);
      this.unsubRespawn?.();
      this.unsubRespawn = undefined;
    });
  }


  /** Instancie une creature depuis sa description de configuration. */
  private makeEnemy(def: SpawnDef): Enemy {
    const enemy =
      def.kind === "penitent"
        ? new PenitentGreffe(this, def.x, FLOOR_Y)
        : def.kind === "bourreau"
          ? new Bourreau(this, def.x, FLOOR_Y)
          : new SuppliantRampant(this, def.x, FLOOR_Y);
    if (def.elite) enemy.makeElite();
    return enemy;
  }

  /**
   * Peuplement pilote par `roomConfig` : creatures d'entree, pendus, mains
   * agrippantes, puis premiere vague pour les salles en arene.
   */
  private populateRoom() {
    for (const def of this.room.spawns) this.spawn(this.makeEnemy(def));
    for (const x of this.room.hangers) {
      this.spawnPendu(new EcorchePendu(this, x, FLOOR_Y, 60));
    }
    this.hands = this.room.hands.map(
      ([from, to]) => new GraspingHands(this, from, to, FLOOR_Y),
    );

    // arene : la premiere vague n'arrive qu'au franchissement du verrou
  }

  /** Arene : le passage se referme derriere le heros et la premiere vague tombe. */
  private lockArena() {
    if (this.arenaLocked || this.room.arenaLockX === undefined) return;
    this.arenaLocked = true;

    const wall = this.add.rectangle(
      this.room.arenaLockX - 30,
      FLOOR_Y - 230,
      36,
      470,
      0x53161f,
      0.85,
    );
    wall.setDepth(4);
    this.physics.add.existing(wall, true);
    this.platforms.add(wall);
    this.arenaWall = wall;

    this.cameras.main.shake(260, 0.008);
    this.announce("Le passage se referme");
    this.nextWave();
  }

  /** Vague suivante d'une arene : apparition differee avec secousse. */
  private nextWave() {
    const wave = this.pendingWaves.shift();
    if (!wave) return;
    this.waveIncoming = true;
    this.time.delayedCall(700, () => {
      if (!this.scene.isActive()) return;
      for (const def of wave) this.spawn(this.makeEnemy(def));
      this.waveIncoming = false;
      this.cameras.main.shake(180, 0.005);
    });
  }

  /** Bandeau de texte centre en haut de l'ecran. */
  private announce(text: string, delay = 0) {
    const cam = this.cameras.main;
    const label = this.add
      .text(cam.width / 2, 120, text, {
        fontFamily: "Georgia, serif",
        fontSize: "26px",
        color: "#c2727a",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(60)
      .setAlpha(0);
    this.tweens.add({
      targets: label,
      alpha: 1,
      duration: 500,
      delay,
      yoyo: true,
      hold: 1400,
      onComplete: () => label.destroy(),
    });
  }

  /** Cartouche de titre a l'entree de la salle. */
  private showRoomTitle() {
    const cam = this.cameras.main;
    const label = this.add
      .text(cam.width / 2, cam.height / 2 - 60, ROOM_LABELS[this.backdropKey], {
        fontFamily: "Georgia, serif",
        fontSize: "34px",
        color: "#e0c9c1",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(60)
      .setAlpha(0);
    const rule = this.add
      .rectangle(cam.width / 2, cam.height / 2 - 24, 220, 2, 0x8f2230, 0.9)
      .setScrollFactor(0)
      .setDepth(60)
      .setAlpha(0);
    this.tweens.add({
      targets: [label, rule],
      alpha: 1,
      duration: 700,
      yoyo: true,
      hold: 1600,
      onComplete: () => {
        label.destroy();
        rule.destroy();
      },
    });
  }

  /** Compteur discret de creatures restantes, en haut a droite. */
  private updateCounter(alive: number) {
    if (!this.counterText) return;
    if (this.roomCleared) {
      this.counterText.setText("Passage ouvert");
      return;
    }
    const waves = this.pendingWaves.length;
    this.counterText.setText(
      waves > 0
        ? `Creatures : ${alive}   ·   Vagues restantes : ${waves}`
        : `Creatures : ${alive}`,
    );
  }

  /**
   * Chute dans une fosse : le heros perd de la vie et est replace sur le
   * bord le plus proche, plutot que de rester coince au fond du monde.
   */
  private checkPitFall() {
    if (!this.player || this.room.pits.length === 0) return;
    if (this.player.y <= FLOOR_Y + 40) return;

    const pit = this.room.pits.find(
      (p) => this.player.x > p.from - 20 && this.player.x < p.to + 20,
    );
    if (!pit) return;

    const edge = this.player.x < (pit.from + pit.to) / 2 ? pit.from - 60 : pit.to + 60;
    const body = this.player.body as Phaser.Physics.Arcade.Body | null;
    this.player.setPosition(Phaser.Math.Clamp(edge, 60, this.room.width - 60), FLOOR_Y - 40);
    body?.setVelocity(0, 0);
    this.cameras.main.shake(200, 0.01);
    this.player.receiveDamage(PIT_DAMAGE, this.time.now);
  }




  private spawn(enemy: Enemy) {
    this.physics.add.collider(enemy, this.platforms);
    this.enemies.push(enemy);
  }


  /** un pendu ne se decroche que si aucune autre creature n'est active pres du heros */
  private spawnPendu(enemy: EcorchePendu) {
    enemy.dropGate = () => {
      const px = this.player?.x ?? 0;
      return !this.enemies.some(
        (e) =>
          e !== enemy &&
          e.active &&
          !e.isDead &&
          Math.abs(e.x - px) < 620,
      );
    };
    this.spawn(enemy);
  }


  private onBlood(x: number, y: number, dir: number, intensity: number) {
    this.blood.splatter(x, y, dir, intensity);
  }

  private onGore(x: number, y: number, intensity: number) {
    this.blood.gore(x, y, intensity);
  }

  private onDamageNumber(
    x: number,
    y: number,
    amount: number,
    kind: DamageKind = "normal",
  ) {
    const boosted = useGameStore.getState().effects.damageMult > 1;
    this.damageNumbers?.show(x, y, amount, kind, boosted);
  }

  private onSparks(x: number, y: number) {
    this.blood.sparks(x, y);
  }

  /** Soin : le sang remonte le long du corps, sans anneau. */
  private onHeal(x: number, y: number) {
    this.blood.siphon(x, this.player ? this.player.y : y, 120);
  }


  /** Butin : orbes de chair, et parfois une fiole de sang. */
  private onEnemyDied(x: number, y: number, fleshReward: number, elite?: boolean) {
    const orbs = Phaser.Math.Between(2, 4);
    const per = Math.max(1, Math.round(fleshReward / orbs));
    for (let i = 0; i < orbs; i++) {
      this.pickups.push(
        new Pickup(
          this,
          x + Phaser.Math.Between(-40, 40),
          y + Phaser.Math.Between(-20, 20),
          "flesh",
          per,
        ),
      );
    }

    if (elite || Math.random() < 0.3) {
      this.pickups.push(new Pickup(this, x, y - 10, "blood", 12));
    }
  }


  /** Decor en trois calques de parallaxe, selon la salle courante. */
  private buildBackdrop() {
    const roomWidth = this.room.width;
    this.parallax = new Parallax(this, this.backdropKey, FLOOR_Y, ROOM_HEIGHT, roomWidth);

    // vie de fond : dosage rats / chauves-souris selon le volume de la salle
    const mix =
      this.backdropKey === "corridor"
        ? { rats: 5, bats: 2, ratBias: 0.75 }
        : this.backdropKey === "cathedrale"
          ? { rats: 2, bats: 4, ratBias: 0.3 }
          : { rats: 3, bats: 3, ratBias: 0.5 };
    this.critters = new AmbientCritters(this, FLOOR_Y, roomWidth, mix);

    // torcheres sur pied : flamme, lueur fluctuante et fumee legere
    this.torches = placeTorches(this, FLOOR_Y, roomWidth, this.backdropKey);


    // supplicie ecorche : uniquement dans la cathedrale
    if (this.backdropKey === "cathedrale") {
      this.crucified = new CrucifiedProp(this, CRUCIFIED_X, FLOOR_Y);
      this.crucifiedWoman = new CrucifiedProp(
        this,
        CRUCIFIED_WOMAN_X,
        FLOOR_Y,
        "crucifiee-idle",
      );

      // mini-boss aerien : il surgit dans la seconde moitie de la salle
      this.mount = new DreadMount(this, {
        floorY: FLOOR_Y,
        roomWidth,
        triggerX: MOUNT_TRIGGER_X,
        getPlayer: () => this.player,
        onStrike: (amount) => this.resolveEnemyStrike(amount),
        onGore: (x, y) => this.blood.sparks(x, y),
      });
    } else if (this.backdropKey === "corridor") {
      // grosse veine qui bat le long du couloir, derriere les statues
      this.vein = new CorridorVein(this, FLOOR_Y, roomWidth);

      // statues de pleureuses qui saignent des yeux quand le heros approche
      // amas de chair disperses sur la ligne sol/mur, reveils aleatoires
      this.blobs = scatterFleshBlobs(this, FLOOR_Y, roomWidth, {
        count: Phaser.Math.Between(4, 6),
        minX: 380,
        maxX: roomWidth - 320,
        lift: 70,
      });

      this.statues = [
        // Grandes, posees sur la plinthe du mur et toujours derriere le heros.
        new WeepingStatue(this, 700, FLOOR_Y, 0.72, 110),
        new WeepingStatue(this, 2050, FLOOR_Y, 0.72, 110),
      ];

      // machine d'ecartellement : deux bourreaux achevent un supplicie,
      // puis se retournent contre le heros
      this.wheel = new TortureRack(this, TORTURE_RACK_X, FLOOR_Y, (spots) => {
        for (const spot of spots) {
          this.spawn(new Bourreau(this, spot.x, spot.y));
        }
        this.cameras.main.shake(180, 0.006);
      });
    } else if (this.backdropKey === "throne") {
      // salle du trone : statues de garde de part et d'autre de l'arene,
      // amas de chair au pied des murs
      this.statues = [
        new WeepingStatue(this, 1080, FLOOR_Y, 0.8, 90),
        new WeepingStatue(this, 1920, FLOOR_Y, 0.8, 90),
      ];
      this.blobs = scatterFleshBlobs(this, FLOOR_Y, roomWidth, {
        count: Phaser.Math.Between(3, 5),
        minX: 1050,
        maxX: roomWidth - 260,
        lift: 60,
      });
      this.crucified = new CrucifiedProp(this, 300, FLOOR_Y);
    } else {
      // exterieur : parvis long, supplicies exposes et chairs eparses
      this.crucified = new CrucifiedProp(this, 640, FLOOR_Y);
      this.crucifiedWoman = new CrucifiedProp(
        this,
        2900,
        FLOOR_Y,
        "crucifiee-idle",
      );
      this.statues = [
        new WeepingStatue(this, 1450, FLOOR_Y, 0.7, 80),
        new WeepingStatue(this, 2600, FLOOR_Y, 0.7, 80),
      ];
      this.blobs = scatterFleshBlobs(this, FLOOR_Y, roomWidth, {
        count: Phaser.Math.Between(4, 6),
        minX: 800,
        maxX: roomWidth - 300,
        lift: 50,
      });
    }

    // autel de sang : sauvegarde juste avant l'affrontement majeur de la salle
    const altarX = this.room.altarX;
    if (altarX !== undefined) {
      const saved = useGameStore.getState().checkpoint;
      this.altar = new BloodAltar(
        this,
        altarX,
        FLOOR_Y,
        saved?.stage === this.backdropKey,
      );
    }
  }

  /**
   * Colonne de fin de salle : elle sort du cadre par le haut, ses visceres
   * respirent, et un seuil obstrue le passage tant qu'il reste des monstres.
   */
  private buildGate() {
    const gateX = gateXOf(this.room);
    this.gateColumn = new GateColumn(this, gateX, FLOOR_Y);

    // verrou physique invisible : le heros bute sur la colonne
    const wall = this.add.rectangle(gateX + 40, FLOOR_Y - 220, 40, 460);
    wall.setVisible(false);
    this.physics.add.existing(wall, true);
    this.platforms.add(wall);
    this.gateWall = wall;

  }


  /** Dernier monstre tue : le passage s'ouvre. */
  private openGate() {
    if (this.roomCleared) return;
    this.roomCleared = true;
    this.gateColumn?.open();

    if (this.gateWall) {
      this.platforms.remove(this.gateWall, true, true);
      this.gateWall = undefined;
    }
    if (this.arenaWall) {
      this.platforms.remove(this.arenaWall, true, true);
      this.arenaWall = undefined;
    }

    this.announce("Le passage s'ouvre");
  }


  /** Fondu au noir puis passage a la salle suivante. */
  private exitRoom() {
    if (this.exiting) return;
    this.exiting = true;
    const cam = this.cameras.main;
    cam.fadeOut(650, 0, 0, 0);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      const i = ROOM_ORDER.indexOf(this.backdropKey);
      const next = ROOM_ORDER[(i + 1) % ROOM_ORDER.length];
      this.scene.restart({ backdrop: next });
    });
  }


  private buildGeometry() {
    this.platforms = this.physics.add.staticGroup();

    // Le sol visible est peint par les calques de decor : ici on ne garde
    // que des corps de collision invisibles, decoupes par les fosses.
    const groundH = ROOM_HEIGHT - FLOOR_Y;
    const width = this.room.width;
    const pits = [...this.room.pits].sort((a, b) => a.from - b.from);

    let cursor = 0;
    const segments: [number, number][] = [];
    for (const pit of pits) {
      if (pit.from > cursor) segments.push([cursor, pit.from]);
      cursor = pit.to;
    }
    if (cursor < width) segments.push([cursor, width]);

    for (const [from, to] of segments) {
      const ground = this.add.rectangle(
        (from + to) / 2,
        FLOOR_Y + groundH / 2,
        to - from,
        groundH,
      );
      ground.setVisible(false);
      this.platforms.add(ground);
    }

    // plateaux suspendus : ils donnent enfin une utilite au saut et au plongeon
    for (const def of this.room.platforms) {
      const plat = this.add.rectangle(def.x, def.y, def.width, 24, 0x2a1418, 0.92);
      plat.setStrokeStyle(2, 0x4a2028, 0.9);
      plat.setDepth(3);
      this.physics.add.existing(plat, true);
      this.platforms.add(plat);
    }

    this.platforms.refresh();
  }



  /**
   * Se tenir au sol dans une flaque de sang fraiche, hors combat, rend
   * lentement de la vitalite ; la flaque se vide au fur et a mesure.
   */
  private regenerateFromBlood(safe: boolean, delta: number) {
    if (!safe) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body | null;
    if (!body || !(body.blocked.down || body.touching.down)) return;

    const store = useGameStore.getState();
    if (store.health >= store.maxHealth) return;

    const pool = this.blood.poolAt(this.player.x);
    if (!pool) return;

    const healed = this.blood.drainPool(pool, (POOL_REGEN_PER_SEC * delta) / 1000);
    if (healed <= 0) return;
    store.heal(healed);

    // le sang de la flaque remonte le long du corps pendant tout le drainage
    this.blood.siphon(this.player.x, this.player.y, 120);
  }

  /** Badge de touche au-dessus du heros quand l'absorption est possible. */
  private updateAbsorbPrompt(safe: boolean, delta: number) {
    if (!this.absorbPrompt) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body | null;
    const store = useGameStore.getState();
    const onGround = !!body && (body.blocked.down || body.touching.down);
    const visible =
      safe &&
      onGround &&
      !this.player.isAbsorbing &&
      store.health < store.maxHealth &&
      store.flesh >= ABSORB_COST &&
      !!this.blood.poolAt(this.player.x);
    this.absorbPrompt.tick(visible, this.player.x, this.player.y - 150, delta);
  }


  private resolvePlayerStrike(strike: Strike, damageScale = 1) {
    const store = useGameStore.getState();
    const effects = store.effects;
    const base = strike.damage * effects.damageMult * damageScale;
    const box = strikeBox(
      strike,
      this.player.x,
      this.player.y,
      this.player.facingDirection,
      effects.bonusReach,
    );

    let hits = 0;
    for (const enemy of this.enemies) {
      if (!enemy.active || enemy.isDead) continue;
      const hb = enemy.hurtbox;
      if (!boxHitsBody(box, hb.cx, hb.cy, hb.halfW, hb.halfH)) continue;

      hits += 1;
      // zone faible (tete / haut du torse) ou tirage a 5 % : critique
      const weakSpot = box.top <= enemy.weakPointY && box.bottom >= enemy.weakPointY;
      const crit = Math.random() < CRIT_CHANCE || (weakSpot && Math.random() < CRIT_CHANCE);
      enemy.takeHit(crit ? base * CRIT_MULT : base, {
        knockback: strike.knockback,
        breakGuard: strike.breakGuard,
        fromX: this.player.x,
        crit,
      });
    }

    // la monture d'effroi n'encaisse que lorsqu'elle descend au contact
    if (this.mount && this.mount.isVulnerable) {
      const hb = this.mount.hurtbox;
      if (boxHitsBody(box, hb.cx, hb.cy, hb.halfW, hb.halfH)) {
        const crit = Math.random() < CRIT_CHANCE;
        if (this.mount.takeHit(crit ? base * CRIT_MULT : base, this.player.x, crit)) {
          hits += 1;
        }
      }
    }

    // chaque coup porté recharge la jauge de Chair qui alimente le Rugissement
    if (hits > 0 && strike.id !== "special") {
      const bonus = strike.breakGuard || strike.id === "combo3" ? FLESH_HEAVY_BONUS : 0;
      store.gainFlesh((FLESH_PER_HIT + bonus) * hits);
    }

    this.cameras.main.shake(70, 0.004);
  }



  private resolveEnemyStrike(amount: number, source?: Enemy) {
    const result = this.player.tryParry(this.time.now);
    const dir = this.player.facingDirection;

    if (result === "perfect") {
      // parade au bon moment : coup annule, ennemi etourdi, etincelles
      const store = useGameStore.getState();
      store.registerParry();
      store.gainFlesh(PARRY.fleshReward);
      source?.stun(PARRY.stun);
      this.player.onGuardBlocked(true);
      this.player.rumble(0.75, 220);
      this.cameras.main.shake(140, 0.009);
      this.cameras.main.flash(90, 255, 244, 200);
      this.guardFx.perfectFlash(this.player.x, this.player.y, dir);
      return;
    }

    if (result === "guard") {
      // garde tenue hors fenetre : coup bloque, aucun eclat
      this.player.onGuardBlocked(false);
      this.player.rumble(0.2, 80);
      this.cameras.main.shake(60, 0.003);
      this.guardFx.blockThud(this.player.x, this.player.y, dir);
      return;
    }

    this.player.receiveDamage(amount, this.time.now);
  }

  update(time: number, delta: number) {
    const t0 = performance.now();
    const prof = this.profiler;

    prof.measure("parallax", () => this.parallax.update());

    const phase = useGameStore.getState().phase;
    if (phase !== "playing") {
      this.physics.world.isPaused = true;
      prof.frame(time, delta, performance.now() - t0);
      return;
    }
    this.physics.world.isPaused = false;

    prof.measure("player", () => this.player.tick(time));
    prof.measure("mains", () => {
      for (const hand of this.hands) {
        if (hand.update(this.player.x, this.player.y, FLOOR_Y, time)) {
          this.player.snare(3000);
        }
      }
    });
    prof.measure("sang", () => this.blood.tick(time));
    for (const statue of this.statues) statue.update(this.player.x);
    for (const blob of this.blobs) blob.tick(time);
    this.wheel?.tick(this.player.x, time);
    this.critters?.tick(time, delta);
    this.mount?.update(time, delta);
    this.altar?.tick(this.player.x, time, delta);
    for (const t of this.torches) t.tick(time);


    this.enemies = this.enemies.filter((e) => e.active);

    // arene : le verrou se referme quand le heros franchit le seuil
    if (this.room.arenaLockX !== undefined && this.player.x > this.room.arenaLockX) {
      this.lockArena();
    }

    // fosses : la chute coute de la vie et renvoie le heros au bord
    this.checkPitFall();

    const alive = this.enemies.filter((e) => !e.isDead).length;
    // salle nettoyee : la monture doit etre abattue en plus des monstres au sol
    const mountCleared = !this.mount || this.mount.isDefeated;
    if (!this.roomCleared && mountCleared && alive === 0 && !this.waveIncoming) {
      if (this.pendingWaves.length > 0 && this.arenaLocked) {
        this.nextWave();
      } else if (this.room.arenaLockX === undefined || this.arenaLocked) {
        this.openGate();
      }
    }
    this.updateCounter(alive);

    if (this.roomCleared && !this.exiting && this.player.x > gateXOf(this.room) + 110) {
      this.exitRoom();
    }


    // aucune creature vivante a proximite : le soin par absorption est permis
    prof.measure("absorption", () => {
      const threatened = this.enemies.some(
        (e) =>
          !e.isDead &&
          Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y) < SAFE_RADIUS,
      );
      this.player.setSafeToAbsorb(!threatened);
      // filet de securite : pas d'absorption en cours => pas de barre a l'ecran
      if (!this.player.isAbsorbing && useGameStore.getState().absorbing) {
        useGameStore.getState().setAbsorb(false, 0);
      }
      this.regenerateFromBlood(!threatened, delta);
      this.updateAbsorbPrompt(!threatened, delta);
      // bande-son adaptative : theme epique tant qu'une creature menace
      this.music?.setCombat(threatened);
    });


    prof.measure("ennemis", () => {
      for (const enemy of this.enemies) {
        enemy.think(this.player.x, this.player.y, time);
      }
    });

    prof.measure("ramassages", () => {
      this.pickups = this.pickups.filter((p) => p.active);
      for (const pickup of this.pickups) {
        pickup.tick(this.player.x, this.player.y, time);
      }
    });

    prof.frame(time, delta, performance.now() - t0);
  }
}


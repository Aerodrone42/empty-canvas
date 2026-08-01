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
import { BloodFX } from "../effects/Blood";
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
import type { BackdropKey } from "@/game/assets";
import { useGameStore } from "@/store/gameStore";

const ROOM_WIDTH = 2400;
const ROOM_HEIGHT = 900;
/** supplicie ecorche : decor anime au centre de la cathedrale */
// Emplacement marque par la croix rouge : juste a droite de la zone de depart.
const CRUCIFIED_X = 430;
const FLOOR_Y = 880;
/** soin par seconde en se reposant dans une flaque de sang */
const POOL_REGEN_PER_SEC = 6;
/** distance en dessous de laquelle une creature empeche de se soigner */
const SAFE_RADIUS = 300;
/** position de la colonne de fin de salle */
const GATE_X = 2150;
/** au dela de ce point, le heros bascule dans la salle suivante */
const GATE_EXIT_X = GATE_X + 110;
/** seconde moitie de la cathedrale : la monture d'effroi fond sur le heros */
const MOUNT_TRIGGER_X = 1500;
/** machine d'ecartellement du corridor */
const TORTURE_RACK_X = 1320;



/** enchainement des salles : la colonne mene a la suivante */
const ROOM_ORDER: BackdropKey[] = ["cathedrale", "corridor", "throne", "exterieur"];


export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private hands: GraspingHands[] = [];
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private blood!: BloodFX;
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

  
  /** bande-son adaptative (ambiance / combat) */
  private music?: MusicDirector;
  private roomCleared = false;


  private exiting = false;
  /** le heros touche le plateau (mis a jour par le collider) */


  constructor() {
    super("game");
  }

  init(data?: { backdrop?: BackdropKey }) {
    this.backdropKey = data?.backdrop ?? "cathedrale";
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
    for (const t of this.torches) t.destroy();
    this.torches = [];

    this.exiting = false;
    this.roomCleared = false;
    this.physics.world.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    this.cameras.main.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
    this.cameras.main.setBackgroundColor(0x14090b);
    this.cameras.main.fadeIn(500, 0, 0, 0);


    this.profiler = new Profiler(this);
    // premiere salle : choeur gothique ; salles suivantes : theme habituel
    this.music = new MusicDirector(this, {
      intro: this.backdropKey === ROOM_ORDER[0],
    });

    this.blood = new BloodFX(this, FLOOR_Y);
    this.damageNumbers = new DamageNumbers(this);

    this.buildBackdrop();
    this.buildGeometry();
    this.buildGate();

    this.player = new Player(this, 180, FLOOR_Y);
    this.physics.add.collider(this.player, this.platforms);

    this.populateRoom();



    // suivi horizontal uniquement : au saut, l'image ne doit pas bouger
    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.2, 0, 0, 0);
    // zone morte etroite : la camera repart des que le heros s'ecarte un peu
    // du centre, sinon on marche longtemps sans que l'image bouge
    cam.setDeadzone(180, ROOM_HEIGHT);

    cam.setScroll(cam.scrollX, ROOM_HEIGHT - cam.height);

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
    });
  }


  /**
   * Peuplement propre a chaque salle : la cathedrale sert d'introduction,
   * le corridor est un couloir d'embuscade beaucoup plus dense (creatures
   * rapprochees, pendus multiples, pieges au sol), les salles suivantes
   * montent encore d'un cran.
   */
  private populateRoom() {
    if (this.backdropKey === "corridor") {
      this.spawn(new SuppliantRampant(this, 620, FLOOR_Y));
      this.spawn(new SuppliantRampant(this, 900, FLOOR_Y));
      this.spawn(new PenitentGreffe(this, 1150, FLOOR_Y));
      this.spawn(new SuppliantRampant(this, 1450, FLOOR_Y));
      this.spawn(new PenitentGreffe(this, 1720, FLOOR_Y));
      this.spawn(new PenitentGreffe(this, 2050, FLOOR_Y));
      this.spawnPendu(new EcorchePendu(this, 1000, FLOOR_Y, 60));
      this.spawnPendu(new EcorchePendu(this, 1600, FLOOR_Y, 60));
      this.spawnPendu(new EcorchePendu(this, 2200, FLOOR_Y, 60));

      this.hands = [
        new GraspingHands(this, 420, 900, FLOOR_Y),
        new GraspingHands(this, 950, 1500, FLOOR_Y),
        new GraspingHands(this, 1550, 2000, FLOOR_Y),
        new GraspingHands(this, 2050, 2400, FLOOR_Y),
      ];
      return;
    }

    this.spawn(new SuppliantRampant(this, 760, FLOOR_Y));
    this.spawn(new PenitentGreffe(this, 1180, FLOOR_Y));
    this.spawn(new SuppliantRampant(this, 1600, FLOOR_Y));
    this.spawn(new PenitentGreffe(this, 2060, FLOOR_Y));
    this.spawnPendu(new EcorchePendu(this, 1400, FLOOR_Y, 60));
    this.spawnPendu(new EcorchePendu(this, 1900, FLOOR_Y, 60));

    this.hands = [
      new GraspingHands(this, 520, 1150, FLOOR_Y),
      new GraspingHands(this, 1200, 1800, FLOOR_Y),
      new GraspingHands(this, 1850, 2400, FLOOR_Y),
    ];
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
    this.damageNumbers?.show(x, y, amount, kind);
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
    this.parallax = new Parallax(this, this.backdropKey, FLOOR_Y, ROOM_HEIGHT, ROOM_WIDTH);

    // vie de fond : dosage rats / chauves-souris selon le volume de la salle
    const mix =
      this.backdropKey === "corridor"
        ? { rats: 5, bats: 2, ratBias: 0.75 }
        : this.backdropKey === "cathedrale"
          ? { rats: 2, bats: 4, ratBias: 0.3 }
          : { rats: 3, bats: 3, ratBias: 0.5 };
    this.critters = new AmbientCritters(this, FLOOR_Y, ROOM_WIDTH, mix);

    // torcheres sur pied : flamme, lueur fluctuante et fumee legere
    this.torches = placeTorches(this, FLOOR_Y, ROOM_WIDTH, this.backdropKey);

    // supplicie ecorche : uniquement dans la cathedrale
    if (this.backdropKey === "cathedrale") {
      this.crucified = new CrucifiedProp(this, CRUCIFIED_X, FLOOR_Y);
      // mini-boss aerien : il surgit dans la seconde moitie de la salle
      this.mount = new DreadMount(this, {
        floorY: FLOOR_Y,
        roomWidth: ROOM_WIDTH,
        triggerX: MOUNT_TRIGGER_X,
        getPlayer: () => this.player,
        onStrike: (amount) => this.resolveEnemyStrike(amount),
        onGore: (x, y) => this.blood.sparks(x, y),
      });
    } else if (this.backdropKey === "corridor") {
      // grosse veine qui bat le long du couloir, derriere les statues
      this.vein = new CorridorVein(this, FLOOR_Y, ROOM_WIDTH);

      // statues de pleureuses qui saignent des yeux quand le heros approche
      // amas de chair disperses sur la ligne sol/mur, reveils aleatoires
      this.blobs = scatterFleshBlobs(this, FLOOR_Y, ROOM_WIDTH, {
        count: Phaser.Math.Between(4, 6),
        minX: 380,
        maxX: ROOM_WIDTH - 320,
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
    }

  }

  /**
   * Colonne de fin de salle : elle sort du cadre par le haut, ses visceres
   * respirent, et un seuil obstrue le passage tant qu'il reste des monstres.
   */
  private buildGate() {
    this.gateColumn = new GateColumn(this, GATE_X, FLOOR_Y);

    // verrou physique invisible : le heros bute sur la colonne
    const wall = this.add.rectangle(GATE_X + 40, FLOOR_Y - 220, 40, 460);
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


    const cam = this.cameras.main;
    const label = this.add
      .text(cam.width / 2, 120, "Le passage s'ouvre", {
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
      yoyo: true,
      hold: 1400,
      onComplete: () => label.destroy(),
    });
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
    // qu'un corps de collision invisible sur toute la largeur de la salle.
    const groundH = ROOM_HEIGHT - FLOOR_Y;
    const ground = this.add.rectangle(
      ROOM_WIDTH / 2,
      FLOOR_Y + groundH / 2,
      ROOM_WIDTH,
      groundH,
    );
    ground.setVisible(false);
    this.platforms.add(ground);

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
    if (this.player.tryParry(this.time.now)) {
      const store = useGameStore.getState();
      store.registerParry();
      store.gainFlesh(PARRY.fleshReward);
      source?.stun(PARRY.stun);
      this.player.rumble(0.4, 120);
      this.cameras.main.flash(90, 240, 220, 160);
      this.blood.sparks(this.player.x + this.player.facingDirection * 30, this.player.y - 70);
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
    for (const t of this.torches) t.tick(time);


    this.enemies = this.enemies.filter((e) => e.active);

    // salle nettoyee : la monture doit etre abattue en plus des monstres au sol
    const mountCleared = !this.mount || this.mount.isDefeated;
    if (!this.roomCleared && mountCleared && this.enemies.every((e) => e.isDead)) {
      this.openGate();
    }
    if (this.roomCleared && !this.exiting && this.player.x > GATE_EXIT_X) {
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
      this.regenerateFromBlood(!threatened, delta);
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


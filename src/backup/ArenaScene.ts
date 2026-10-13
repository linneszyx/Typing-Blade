import Phaser from 'phaser'

export type ArenaState = {
  playerHp: number
  enemyHp: number
  playerMaxHp: number
  enemyMaxHp: number
  phase: 'ready' | 'playing' | 'victory' | 'defeat'
}

export class ArenaScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.Graphics
  private fighters!: Phaser.GameObjects.Graphics
  private fx!: Phaser.GameObjects.Graphics
  private label!: Phaser.GameObjects.Text
  private state: ArenaState = {
    playerHp: 100, enemyHp: 100, playerMaxHp: 100, enemyMaxHp: 100, phase: 'ready'
  }
  private tick = 0
  private flash = 0
  private playerLunge = 0
  private enemyLunge = 0
  private specialFlash = 0
  private playerAttack = 0
  private enemyAttack = 0

  constructor() {
    super('ArenaScene')
  }

  create() {
    this.bg = this.add.graphics()
    this.fighters = this.add.graphics()
    this.fx = this.add.graphics()
    this.label = this.add.text(0, 0, '', {
      fontFamily: 'Rajdhani, sans-serif', fontSize: '18px', color: '#dce7ff',
      fontStyle: 'bold', letterSpacing: 3
    }).setOrigin(0.5)
    this.scale.on('resize', () => this.drawArena())
    this.game.events.on('arena:update', (state: ArenaState) => {
      this.state = { ...this.state, ...state }
      this.drawArena()
    })
    this.game.events.on('arena:action', (action: { kind: 'player' | 'enemy' | 'special'; combo?: number }) => {
      if (action.kind === 'enemy') {
        this.enemyAttack = 1
        this.enemyLunge = 1
        this.flash = 1
        this.cameras.main.shake(120, 0.009)
      } else {
        this.playerAttack = 1
        this.playerLunge = 1
        this.flash = 1
        this.cameras.main.shake(action.kind === 'special' ? 190 : 95, action.kind === 'special' ? 0.016 : 0.006)
        if (action.kind === 'special') this.specialFlash = 1
      }
      // Brief hit-stop makes confirmed hits feel weighty without pausing React's game timer.
      this.time.timeScale = action.kind === 'special' ? 0.22 : 0.45
      window.setTimeout(() => { if (this.scene.isActive()) this.time.timeScale = 1 }, action.kind === 'special' ? 110 : 55)
      this.drawArena()
    })
    this.drawArena()
  }

  update(_time: number, delta: number) {
    this.tick += delta
    this.playerLunge = Math.max(0, this.playerLunge - delta / 220)
    this.enemyLunge = Math.max(0, this.enemyLunge - delta / 220)
    this.flash = Math.max(0, this.flash - delta / 180)
    this.specialFlash = Math.max(0, this.specialFlash - delta / 520)
    this.playerAttack = Math.max(0, this.playerAttack - delta / (this.specialFlash > 0 ? 850 : 360))
    this.enemyAttack = Math.max(0, this.enemyAttack - delta / 420)
    this.drawArena()
  }

  private drawArena() {
    if (!this.bg || !this.fighters || !this.fx || !this.label) return
    const w = this.scale.width
    const h = this.scale.height
    const floor = h * 0.79
    const pulse = Math.sin(this.tick / 420) * 0.5 + 0.5
    this.bg.clear()
    this.bg.fillGradientStyle(0x12142c, 0x12142c, 0x080912, 0x080912, 1)
    this.bg.fillRect(0, 0, w, h)
    // Moon / distant skyline
    this.bg.fillStyle(0x8c5dff, 0.12)
    this.bg.fillCircle(w * 0.5, h * 0.24, Math.min(w, h) * 0.18)
    this.bg.lineStyle(1, 0x8c5dff, 0.2)
    this.bg.strokeCircle(w * 0.5, h * 0.24, Math.min(w, h) * (0.18 + pulse * 0.012))
    for (let i = 0; i < 16; i++) {
      const bx = i * w / 15
      const bh = h * (0.13 + ((i * 37) % 19) / 100)
      this.bg.fillStyle(i % 2 ? 0x191b39 : 0x11152b, 0.95)
      this.bg.fillRect(bx - 12, floor - bh, 28, bh)
      for (let j = 0; j < 4; j++) {
        this.bg.fillStyle(i % 3 === 0 ? 0xff4ca6 : 0x50e8ff, 0.18 + pulse * 0.12)
        this.bg.fillRect(bx - 5 + (j % 2) * 10, floor - bh + 12 + j * 15, 3, 5)
      }
    }
    this.bg.fillStyle(0x070812, 1)
    this.bg.fillRect(0, floor, w, h - floor)
    this.bg.lineStyle(2, 0x49e9ff, 0.48)
    this.bg.lineBetween(0, floor, w, floor)
    this.bg.lineStyle(1, 0x7a51e8, 0.22)
    for (let i = -6; i <= 6; i++) {
      this.bg.lineBetween(w / 2, floor, w / 2 + i * w * 0.19, h)
    }
    for (let i = 1; i <= 5; i++) {
      const yy = floor + (h - floor) * i * i / 25
      this.bg.lineBetween(0, yy, w, yy)
    }

    this.fighters.clear()
    const scale = Math.min(w / 800, h / 400, 1.2)
    const px = w * 0.25 - this.playerLunge * 42 * scale
    const ex = w * 0.75 + this.enemyLunge * 42 * scale
    const baseY = floor - 6
    this.drawFighter(this.fighters, px, baseY, scale, false, this.state.playerHp <= 0, this.playerAttack, this.specialFlash > 0.1)
    this.drawFighter(this.fighters, ex, baseY, scale, true, this.state.enemyHp <= 0, this.enemyAttack, false)

    this.fx.clear()
    if (this.playerLunge > 0.02) {
      this.fx.lineStyle(this.specialFlash > 0.1 ? 13 : 5, this.specialFlash > 0.1 ? 0xd9b4ff : 0x63f6ff, this.playerLunge)
      this.fx.lineBetween(px + 35 * scale, baseY - 110 * scale, ex - 48 * scale, baseY - 80 * scale)
      this.fx.lineStyle(2, 0xffffff, this.playerLunge * 0.9)
      this.fx.lineBetween(px + 42 * scale, baseY - 124 * scale, ex - 35 * scale, baseY - 60 * scale)
      this.fx.fillStyle(this.specialFlash > 0.1 ? 0xb77aff : 0x63f6ff, this.playerLunge * 0.45)
      this.fx.fillCircle(ex - 45 * scale, baseY - 80 * scale, (this.specialFlash > 0.1 ? 48 : 25) * scale * this.playerLunge)
      for (let i = 0; i < 5; i++) {
        const spread = (i - 2) * 13 * scale
        this.fx.fillStyle(i % 2 ? 0xffffff : 0x63f6ff, this.playerLunge * 0.85)
        this.fx.fillCircle(ex - 48 * scale + spread, baseY - 82 * scale + Math.sin(this.tick / 35 + i) * 16 * scale, (2 + (i % 2)) * scale)
      }
    }
    if (this.enemyLunge > 0.02) {
      this.fx.lineStyle(5, 0xff4f8b, this.enemyLunge)
      this.fx.lineBetween(ex - 35 * scale, baseY - 110 * scale, px + 48 * scale, baseY - 80 * scale)
      this.fx.fillStyle(0xff4f8b, this.enemyLunge * 0.4)
      this.fx.fillCircle(px + 45 * scale, baseY - 80 * scale, 24 * scale * this.enemyLunge)
    }
    if (this.specialFlash > 0.02) {
      this.fx.fillStyle(0x9d65ff, this.specialFlash * 0.10)
      this.fx.fillRect(0, 0, w, h)
      this.fx.lineStyle(2, 0xe5caff, this.specialFlash * 0.75)
      this.fx.strokeCircle(ex - 45 * scale, baseY - 80 * scale, (55 + (1 - this.specialFlash) * 80) * scale)
    }
    if (this.flash > 0) {
      this.fx.fillStyle(0xffffff, this.flash * 0.16)
      this.fx.fillRect(0, 0, w, h)
    }
    this.label.setPosition(w / 2, h * 0.16)
      .setText(this.state.phase === 'victory' ? 'DUEL COMPLETE // VICTORY' :
        this.state.phase === 'defeat' ? 'DUEL COMPLETE // DEFEAT' :
        this.state.phase === 'ready' ? 'READY YOUR KEYBOARD' : this.specialFlash > 0.1 ? 'ULTIMATE ART // VOID BREAKER' : 'FIGHT // TYPE TO STRIKE')
      .setColor(this.state.phase === 'victory' ? '#7bffcf' : this.state.phase === 'defeat' ? '#ff739e' : '#e9e9ff')
  }

  private drawFighter(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    s: number,
    enemy: boolean,
    down: boolean,
    attack: number,
    ultimate: boolean,
  ) {
    const c = enemy ? 0xff4f8b : 0x4deaff
    const dark = enemy ? 0x5e1b49 : 0x163b69
    const hair = enemy ? 0x25142e : 0x102038
    const dir = enemy ? -1 : 1
    const swing = Phaser.Math.Easing.Cubic.Out(Phaser.Math.Clamp(attack, 0, 1))
    const bob = Math.sin(this.tick / 190 + (enemy ? 1.4 : 0)) * 3 * s
    const breathe = Math.sin(this.tick / 330 + (enemy ? 0.8 : 0)) * 1.6 * s
    const lean = swing * dir * (ultimate ? 15 : 9) * s
    const yy = y + bob
    const torsoY = yy - 112 * s + breathe
    const headY = yy - 135 * s + breathe
    const weaponColor = ultimate ? 0xd9b4ff : 0xe9faff

    // Ground aura and shadow pulse with the idle/attack cycle.
    g.fillStyle(c, 0.10 + Math.sin(this.tick / 160) * 0.035 + swing * 0.12)
    g.fillEllipse(x, y + 4 * s, (105 + swing * 22) * s, 19 * s)
    if (down) {
      g.fillStyle(dark, 1)
      g.fillRoundedRect(x - 44 * s, y - 34 * s, 88 * s, 27 * s, 10 * s)
      g.fillStyle(c, 0.8)
      g.fillCircle(x + dir * 28 * s, y - 25 * s, 4 * s)
      g.lineStyle(2 * s, c, 0.3)
      g.lineBetween(x - 36 * s, y - 3 * s, x + 36 * s, y - 3 * s)
      return
    }

    // Back hair / long anime silhouette; the tips flutter while standing.
    const hairFlutter = Math.sin(this.tick / 85 + (enemy ? 1.2 : 0)) * 5 * s
    g.fillStyle(dark, 1)
    g.fillTriangle(x - 23 * s, headY - 29 * s, x + 28 * s, headY - 25 * s, x + dir * (50 + hairFlutter) * s, headY + 32 * s)
    g.fillTriangle(x - 19 * s, headY - 20 * s, x + 12 * s, headY - 26 * s, x - (37 - hairFlutter) * s, headY + 22 * s)

    // Legs bend slightly into the attack lunge.
    g.fillStyle(0x171b31, 1)
    g.fillRoundedRect(x - 22 * s - swing * dir * 5 * s, yy - 66 * s, 18 * s, 60 * s, 6 * s)
    g.fillRoundedRect(x + 5 * s + swing * dir * 7 * s, yy - 66 * s, 18 * s, 60 * s, 6 * s)
    g.fillStyle(c, 0.9)
    g.fillRoundedRect(x - 27 * s - swing * dir * 5 * s, yy - 12 * s, 29 * s, 10 * s, 4 * s)
    g.fillRoundedRect(x + 1 * s + swing * dir * 7 * s, yy - 12 * s, 29 * s, 10 * s, 4 * s)

    // Jacket and sash lean forward during an attack.
    g.fillStyle(dark, 1)
    g.fillRoundedRect(x - 31 * s + lean, torsoY, 62 * s, 56 * s, 12 * s)
    g.fillStyle(c, 1)
    g.fillTriangle(x - 20 * s + lean, torsoY + 5 * s, x + 19 * s + lean, torsoY + 5 * s, x + dir * 4 * s + lean, yy - 61 * s)
    g.lineStyle(3 * s, c, 0.9)
    g.lineBetween(x - 26 * s + lean, torsoY + 15 * s, x - 33 * s + lean, yy - 70 * s)

    // Rear arm counter-swings to make the pose read as an actual slash.
    g.lineStyle(12 * s, dark, 1)
    g.lineBetween(x - dir * 22 * s + lean, torsoY + 9 * s, x - dir * (43 + swing * 8) * s + lean, yy - (76 - swing * 7) * s)
    g.fillStyle(c, 0.9)
    g.fillCircle(x - dir * (43 + swing * 8) * s + lean, yy - (76 - swing * 7) * s, 5 * s)

    // Face, sharp fringe, glowing eyes.
    g.fillStyle(0xffd8c8, 1)
    g.fillEllipse(x + lean, headY, 43 * s, 48 * s)
    g.fillStyle(hair, 1)
    g.fillTriangle(x - 22 * s + lean, headY - 10 * s, x + 24 * s + lean, headY - 14 * s, x + dir * 8 * s + lean, headY + 8 * s)
    g.fillTriangle(x - 10 * s + lean, headY - 18 * s, x + 18 * s + lean, headY - 13 * s, x - 3 * s + lean, headY + 1 * s)
    g.fillStyle(c, 1)
    g.fillEllipse(x + dir * 9 * s + lean, headY + 1 * s, 9 * s, 4 * s)

    // Scarf whips behind the fighter during a strike.
    g.fillStyle(enemy ? 0xffb1d1 : 0xb0fcff, 1)
    g.fillTriangle(x - 12 * s + lean, yy - 115 * s, x + 17 * s + lean, yy - 115 * s, x - dir * (47 + swing * 24 + hairFlutter) * s, yy - (97 - swing * 13) * s)

    // Weapon arm changes pose: raised guard while idle, forward slash while attacking,
    // and a two-handed overhead blade for the ultimate.
    const shoulderX = x + dir * 22 * s + lean
    const shoulderY = torsoY + 7 * s
    const handX = x + dir * (ultimate ? 36 : 45 + swing * 8) * s + lean
    const handY = ultimate ? yy - 150 * s - swing * 8 * s : yy - (127 - swing * 21) * s
    g.lineStyle(12 * s, dark, 1)
    g.lineBetween(shoulderX, shoulderY, handX, handY)
    g.fillStyle(c, 1)
    g.fillCircle(handX, handY, 7 * s)

    const bladeStartX = handX + dir * (ultimate ? 7 : 5) * s
    const bladeStartY = handY - (ultimate ? 1 : 2) * s
    const bladeEndX = ultimate ? x + dir * 12 * s + lean : x + dir * (79 - swing * 8) * s + lean
    const bladeEndY = ultimate ? yy - 195 * s : yy - (166 - swing * 35) * s
    g.lineStyle((ultimate ? 8 : 5) * s, weaponColor, 1)
    g.lineBetween(bladeStartX, bladeStartY, bladeEndX, bladeEndY)
    g.lineStyle(2 * s, c, 1)
    g.lineBetween(bladeStartX - dir * 5 * s, bladeStartY + 5 * s, bladeEndX - dir * 5 * s, bladeEndY + 5 * s)

    if (swing > 0.03) {
      const arcX = x + dir * 45 * s + lean
      const arcY = yy - (110 + swing * 16) * s
      g.lineStyle((ultimate ? 7 : 3) * s, ultimate ? 0xd9b4ff : c, swing * 0.85)
      g.beginPath()
      g.arc(arcX, arcY, (ultimate ? 67 : 48) * s, enemy ? 0.2 : 2.6, enemy ? 2.8 : 5.8, false)
      g.strokePath()
    }
  }

}

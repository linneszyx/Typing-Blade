import Phaser from 'phaser'

export type ArenaState = {
  playerHp: number
  enemyHp: number
  playerMaxHp: number
  enemyMaxHp: number
  playerHit?: number
  enemyHit?: number
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
      if (state.playerHit) this.playerLunge = 1
      if (state.enemyHit) this.enemyLunge = 1
      this.drawArena()
    })
    this.drawArena()
  }

  update(_time: number, delta: number) {
    this.tick += delta
    this.playerLunge = Math.max(0, this.playerLunge - delta / 220)
    this.enemyLunge = Math.max(0, this.enemyLunge - delta / 220)
    this.flash = Math.max(0, this.flash - delta / 180)
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
    this.drawFighter(this.fighters, px, baseY, scale, false, this.state.playerHp <= 0)
    this.drawFighter(this.fighters, ex, baseY, scale, true, this.state.enemyHp <= 0)

    this.fx.clear()
    if (this.playerLunge > 0.02) {
      this.fx.lineStyle(5, 0x63f6ff, this.playerLunge)
      this.fx.lineBetween(px + 35 * scale, baseY - 110 * scale, ex - 48 * scale, baseY - 80 * scale)
      this.fx.fillStyle(0x63f6ff, this.playerLunge * 0.45)
      this.fx.fillCircle(ex - 45 * scale, baseY - 80 * scale, 25 * scale * this.playerLunge)
    }
    if (this.enemyLunge > 0.02) {
      this.fx.lineStyle(5, 0xff4f8b, this.enemyLunge)
      this.fx.lineBetween(ex - 35 * scale, baseY - 110 * scale, px + 48 * scale, baseY - 80 * scale)
      this.fx.fillStyle(0xff4f8b, this.enemyLunge * 0.4)
      this.fx.fillCircle(px + 45 * scale, baseY - 80 * scale, 24 * scale * this.enemyLunge)
    }
    if (this.flash > 0) {
      this.fx.fillStyle(0xffffff, this.flash * 0.16)
      this.fx.fillRect(0, 0, w, h)
    }
    this.label.setPosition(w / 2, h * 0.16)
      .setText(this.state.phase === 'victory' ? 'DUEL COMPLETE // VICTORY' :
        this.state.phase === 'defeat' ? 'DUEL COMPLETE // DEFEAT' :
        this.state.phase === 'ready' ? 'READY YOUR KEYBOARD' : 'FIGHT // TYPE TO STRIKE')
      .setColor(this.state.phase === 'victory' ? '#7bffcf' : this.state.phase === 'defeat' ? '#ff739e' : '#e9e9ff')
  }

  private drawFighter(g: Phaser.GameObjects.Graphics, x: number, y: number, s: number, enemy: boolean, down: boolean) {
    const c = enemy ? 0xff4f8b : 0x4deaff
    const dark = enemy ? 0x5e1b49 : 0x163b69
    const dir = enemy ? -1 : 1
    const bob = Math.sin(this.tick / 240 + (enemy ? 1.4 : 0)) * 3 * s
    const yy = y + bob
    g.fillStyle(c, 0.14)
    g.fillEllipse(x, y + 4 * s, 105 * s, 19 * s)
    if (down) {
      g.fillStyle(dark, 1)
      g.fillRoundedRect(x - 44 * s, y - 38 * s, 88 * s, 32 * s, 10 * s)
      g.fillStyle(c, 0.8)
      g.fillCircle(x + dir * 28 * s, y - 27 * s, 4 * s)
      return
    }
    // Long anime hair silhouette
    g.fillStyle(dark, 1)
    g.fillTriangle(x - 23 * s, yy - 164 * s, x + 28 * s, yy - 160 * s, x + dir * 50 * s, yy - 103 * s)
    g.fillTriangle(x - 19 * s, yy - 155 * s, x + 12 * s, yy - 161 * s, x - 37 * s, yy - 113 * s)
    // legs and boots
    g.fillStyle(0x171b31, 1)
    g.fillRoundedRect(x - 22 * s, yy - 66 * s, 18 * s, 60 * s, 6 * s)
    g.fillRoundedRect(x + 5 * s, yy - 66 * s, 18 * s, 60 * s, 6 * s)
    g.fillStyle(c, 0.9)
    g.fillRoundedRect(x - 27 * s, yy - 12 * s, 29 * s, 10 * s, 4 * s)
    g.fillRoundedRect(x + 1 * s, yy - 12 * s, 29 * s, 10 * s, 4 * s)
    // torso / jacket
    g.fillStyle(dark, 1)
    g.fillRoundedRect(x - 31 * s, yy - 112 * s, 62 * s, 56 * s, 12 * s)
    g.fillStyle(c, 1)
    g.fillTriangle(x - 20 * s, yy - 107 * s, x + 19 * s, yy - 107 * s, x + dir * 4 * s, yy - 61 * s)
    g.lineStyle(3 * s, c, 0.9)
    g.lineBetween(x - 26 * s, yy - 97 * s, x - 33 * s, yy - 70 * s)
    // arms
    g.lineStyle(12 * s, dark, 1)
    g.lineBetween(x - dir * 22 * s, yy - 103 * s, x - dir * 43 * s, yy - 76 * s)
    g.lineBetween(x + dir * 22 * s, yy - 103 * s, x + dir * 45 * s, yy - 127 * s)
    g.fillStyle(c, 1)
    g.fillCircle(x + dir * 45 * s, yy - 127 * s, 7 * s)
    // face
    g.fillStyle(0xffd8c8, 1)
    g.fillEllipse(x, yy - 135 * s, 43 * s, 48 * s)
    // bangs
    g.fillStyle(enemy ? 0x25142e : 0x102038, 1)
    g.fillTriangle(x - 22 * s, yy - 145 * s, x + 24 * s, yy - 149 * s, x + dir * 8 * s, yy - 127 * s)
    g.fillTriangle(x - 10 * s, yy - 153 * s, x + 18 * s, yy - 148 * s, x - 3 * s, yy - 134 * s)
    // eyes
    g.fillStyle(c, 1)
    g.fillEllipse(x + dir * 9 * s, yy - 134 * s, 9 * s, 4 * s)
    // scarf
    g.fillStyle(enemy ? 0xffb1d1 : 0xb0fcff, 1)
    g.fillTriangle(x - 12 * s, yy - 115 * s, x + 17 * s, yy - 115 * s, x - dir * 47 * s, yy - 97 * s)
    // weapon
    g.lineStyle(5 * s, 0xe9faff, 1)
    g.lineBetween(x + dir * 47 * s, yy - 126 * s, x + dir * 79 * s, yy - 166 * s)
    g.lineStyle(2 * s, c, 1)
    g.lineBetween(x + dir * 42 * s, yy - 120 * s, x + dir * 84 * s, yy - 171 * s)
  }
}

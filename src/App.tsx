import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Phaser from 'phaser'
import { ArenaScene, type ArenaState } from './game/ArenaScene'

type Phase = 'ready' | 'playing' | 'victory' | 'defeat'
const WORDS = ['SHADOW', 'KATANA', 'FLASH', 'VORTEX', 'PHANTOM', 'STRIKE', 'ZENITH', 'CRIMSON', 'THUNDER', 'ECLIPSE', 'DRAGON', 'NOVA', 'BLADE', 'RISING', 'NIGHTFALL', 'OVERDRIVE']
const PHRASES = ['strike without hesitation', 'focus your inner power', 'the blade remembers', 'be faster than lightning', 'one final decisive strike']
const MAX_HP = 100

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const startTime = useRef<number>(Date.now())
  const lastEnemyHit = useRef<number>(0)
  const [phase, setPhase] = useState<Phase>('ready')
  const [playerHp, setPlayerHp] = useState(MAX_HP)
  const [enemyHp, setEnemyHp] = useState(MAX_HP)
  const [target, setTarget] = useState(WORDS[0])
  const [typed, setTyped] = useState('')
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [hits, setHits] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [damageDealt, setDamageDealt] = useState(0)
  const [damageTaken, setDamageTaken] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [message, setMessage] = useState('Press BEGIN DUEL to enter the arena.')
  const [flash, setFlash] = useState<'player' | 'enemy' | ''>('')
  const [soundOn, setSoundOn] = useState(false)
  const audioRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (!mountRef.current || gameRef.current) return
    const game = new Phaser.Game({
      type: Phaser.CANVAS,
      parent: mountRef.current,
      width: 1000,
      height: 480,
      backgroundColor: '#090912',
      transparent: false,
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true, pixelArt: false },
      scene: [ArenaScene],
    })
    gameRef.current = game
    return () => {
      game.destroy(true)
      gameRef.current = null
    }
  }, [])

  const arenaState = useMemo<ArenaState>(() => ({
    playerHp, enemyHp, playerMaxHp: MAX_HP, enemyMaxHp: MAX_HP, phase
  }), [playerHp, enemyHp, phase])

  useEffect(() => {
    gameRef.current?.events.emit('arena:update', arenaState)
  }, [arenaState])

  const playTone = useCallback((frequency: number, duration = 0.09, type: OscillatorType = 'sawtooth') => {
    if (!soundOn) return
    try {
      const ctx = audioRef.current ?? new AudioContext()
      audioRef.current = ctx
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = frequency
      gain.gain.setValueAtTime(0.07, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch { /* Audio is optional; gameplay does not depend on it. */ }
  }, [soundOn])

  const endGame = useCallback((result: 'victory' | 'defeat') => {
    setPhase(result)
    setMessage(result === 'victory' ? 'A perfect finish. The arena is yours.' : 'The rival broke your guard. Run it back.')
    setTyped('')
    playTone(result === 'victory' ? 740 : 120, 0.3, 'triangle')
  }, [playTone])

  const beginDuel = useCallback(() => {
    setPlayerHp(MAX_HP)
    setEnemyHp(MAX_HP)
    setTarget(WORDS[Math.floor(Math.random() * WORDS.length)])
    setTyped('')
    setCombo(0)
    setBestCombo(0)
    setHits(0)
    setMistakes(0)
    setDamageDealt(0)
    setDamageTaken(0)
    setTimeLeft(60)
    setPhase('playing')
    setMessage('Type the highlighted word, then strike.')
    startTime.current = Date.now()
    lastEnemyHit.current = Date.now()
    window.setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.current) / 1000)
      const remaining = Math.max(0, 60 - elapsed)
      setTimeLeft(remaining)
      if (remaining <= 0) {
        endGame(enemyHp <= playerHp ? 'victory' : 'defeat')
      }
      // Rival telegraphs an attack every 7 seconds. Landing words keeps pressure on the player.
      if (Date.now() - lastEnemyHit.current >= 7000) {
        lastEnemyHit.current = Date.now()
        setPlayerHp((hp) => {
          const next = Math.max(0, hp - 12)
          setDamageTaken((d) => d + (hp - next))
          setFlash('player')
          playTone(150, 0.12)
          if (next <= 0) window.setTimeout(() => endGame('defeat'), 0)
          return next
        })
        setMessage('COUNTER! Your rival landed a hit — keep typing!')
      }
    }, 200)
    return () => window.clearInterval(timer)
  }, [phase, enemyHp, playerHp, endGame, playTone])

  const submitWord = (value: string) => {
    if (phase !== 'playing') return
    const nextTyped = value.toUpperCase()
    setTyped(nextTyped)
    if (!target.startsWith(nextTyped)) {
      setTyped('')
      setMistakes((n) => n + 1)
      setCombo(0)
      setMessage('Missed input — reset your rhythm.')
      playTone(95, 0.04, 'square')
      return
    }
    if (nextTyped === target) {
      const damage = Math.min(18, 7 + Math.floor(combo / 2) * 2)
      setEnemyHp((hp) => {
        const next = Math.max(0, hp - damage)
        if (next <= 0) window.setTimeout(() => endGame('victory'), 0)
        return next
      })
      setDamageDealt((d) => d + damage)
      setHits((n) => n + 1)
      setCombo((n) => {
        const next = n + 1
        setBestCombo((best) => Math.max(best, next))
        return next
      })
      setFlash('enemy')
      gameRef.current?.events.emit('arena:update', { playerHit: 1 })
      playTone(360 + combo * 22, 0.1, 'triangle')
      setMessage(combo >= 3 ? `COMBO x${combo + 1} // Critical strike!` : 'Direct hit! Keep the pressure on.')
      setTarget(WORDS[Math.floor(Math.random() * WORDS.length)])
      setTyped('')
      lastEnemyHit.current = Math.max(lastEnemyHit.current, Date.now() - 1800)
      window.setTimeout(() => setFlash(''), 160)
    }
  }

  const submitPhrase = () => {
    if (phase !== 'playing') return
    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)]
    setTarget(phrase.toUpperCase())
    setTyped('')
    setMessage('SPECIAL MOVE // Type the full phrase to unleash a heavy attack.')
    inputRef.current?.focus()
  }

  const accuracy = hits + mistakes === 0 ? 100 : Math.round((hits / (hits + mistakes)) * 100)
  const elapsedMinutes = Math.max((60 - timeLeft) / 60, 1 / 60)
  const wpm = Math.round((hits * 1.0) / elapsedMinutes)
  const hpPercent = (hp: number) => `${Math.max(0, Math.min(100, hp))}%`

  return (
    <main className="app-shell">
      <div className="scanlines" />
      <header className="topbar">
        <a className="brand" href="#" aria-label="Type Blade home">
          <span className="brand-mark">刀</span>
          <span>TYPE<span className="brand-accent">BLADE</span><small>NEON DUEL PROTOCOL</small></span>
        </a>
        <div className="top-meta">
          <span className="live-dot" /> <span>ARENA ONLINE</span>
          <button className={`sound-toggle ${soundOn ? 'is-on' : ''}`} onClick={() => setSoundOn(!soundOn)} aria-pressed={soundOn}>
            {soundOn ? 'SOUND ON' : 'SOUND OFF'}
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span /> RANKED SIMULATION / SEASON 01</p>
          <h1>YOUR WORDS.<br /><em>YOUR WEAPON.</em></h1>
          <p className="hero-description">A duel of reflexes, rhythm, and resolve. Type clean. Strike hard. Become the blade.</p>
          <div className="hero-tags"><span>01 / DUEL</span><span>60 SEC ROUND</span><span>NO MERCY</span></div>
        </div>
        <div className="hero-stamp" aria-hidden="true">
          <span className="stamp-ring">TYPE BLADE</span>
          <span className="stamp-kanji">斬</span>
          <span className="stamp-sub">THE ART OF SPEED</span>
        </div>
      </section>

      <section className="arena-card">
        <div className="arena-topline">
          <div><span className="section-index">01</span><span className="section-name">THE DUEL ARENA</span></div>
          <div className="round-clock"><span className="clock-dot" /> ROUND TIME <strong>00:{String(timeLeft).padStart(2, '0')}</strong></div>
        </div>
        <div className="fighters-hud">
          <div className="fighter-info player-info">
            <div className="fighter-icon player-icon">影</div>
            <div className="fighter-details"><strong>AKIRA</strong><span>THE KEYBLADE</span></div>
            <div className="level">LV.01</div>
          </div>
          <div className="versus">VS</div>
          <div className="fighter-info enemy-info">
            <div className="level">BOSS 01</div>
            <div className="fighter-details"><strong>KURO</strong><span>THE VOID RONIN</span></div>
            <div className="fighter-icon enemy-icon">黒</div>
          </div>
        </div>
        <div className="health-lines">
          <div className="health-group"><div className="health-label"><span>HP</span><b>{playerHp}<i> / {MAX_HP}</i></b></div><div className="health-track"><div className="health-fill player-fill" style={{ width: hpPercent(playerHp) }} /></div></div>
          <div className="health-group enemy-health"><div className="health-label"><b>{enemyHp}<i> / {MAX_HP}</i></b><span>HP</span></div><div className="health-track"><div className="health-fill enemy-fill" style={{ width: hpPercent(enemyHp) }} /></div></div>
        </div>
        <div className={`phaser-stage ${flash ? `hit-${flash}` : ''}`} ref={mountRef} />
        <div className="arena-caption"><span><i className="tiny-square" /> LIVE COMBAT FEED</span><span>SIMULATION BUILD 0.1.0</span></div>
      </section>

      <section className="combat-panel">
        <div className="combat-heading">
          <div><span className="section-index">02</span><span className="section-name">COMBAT INPUT</span></div>
          <span className={`phase-pill ${phase}`}>{phase === 'playing' ? '● IN COMBAT' : phase === 'ready' ? '○ STANDBY' : phase === 'victory' ? '✓ VICTORY' : '× DEFEAT'}</span>
        </div>
        <div className="input-grid">
          <div className="target-word">
            <span className="mini-label">TARGET SEQUENCE</span>
            <div className="word-display" aria-label={`Target word ${target}`}>
              {target.split('').map((char, i) => <span key={`${target}-${i}`} className={i < typed.length ? 'typed-char' : ''}>{char === ' ' ? '·' : char}</span>)}
            </div>
            <div className="target-hint">TYPE THE WORD TO EXECUTE A STRIKE</div>
          </div>
          <div className="typing-box">
            <label htmlFor="typing-input">YOUR INPUT <span>↵ ENTER</span></label>
            <input
              id="typing-input"
              ref={inputRef}
              value={typed}
              onChange={(e) => submitWord(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setTyped('') }}
              disabled={phase !== 'playing'}
              placeholder={phase === 'playing' ? 'Type the target sequence…' : 'Begin a duel to type'}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
            />
            <div className="input-bottom"><span className="input-status"><i /> {phase === 'playing' ? 'INPUT LISTENING' : 'INPUT LOCKED'}</span><span>{typed.length} / {target.length}</span></div>
          </div>
        </div>
        <div className="combat-actions">
          <button className="primary-button" onClick={phase === 'playing' ? submitPhrase : beginDuel}>
            <span>{phase === 'playing' ? '⚡' : '▶'}</span>{phase === 'playing' ? 'CHARGE SPECIAL MOVE' : phase === 'ready' ? 'BEGIN DUEL' : 'FIGHT AGAIN'}<b>↗</b>
          </button>
          <div className="combat-message"><span className="message-icon">✦</span><span>{message}</span></div>
        </div>
      </section>

      <section className="stats-row">
        <div className="stat-card"><span className="stat-label">WORDS / MIN</span><strong>{wpm}<small>WPM</small></strong><span className="stat-foot">PACE INDICATOR</span></div>
        <div className="stat-card"><span className="stat-label">ACCURACY</span><strong>{accuracy}<small>%</small></strong><span className="stat-foot">INPUT PRECISION</span></div>
        <div className="stat-card"><span className="stat-label">COMBO STREAK</span><strong>{combo.toString().padStart(2, '0')}<small>×</small></strong><span className="stat-foot">BEST {bestCombo.toString().padStart(2, '0')}×</span></div>
        <div className="stat-card"><span className="stat-label">DAMAGE DEALT</span><strong>{damageDealt}<small>DMG</small></strong><span className="stat-foot">DAMAGE TAKEN {damageTaken}</span></div>
      </section>

      {phase !== 'playing' && phase !== 'ready' && (
        <section className={`result-banner ${phase}`}>
          <div><span className="mini-label">DUEL REPORT // FINAL RESULT</span><h2>{phase === 'victory' ? 'RONIN DEFEATED.' : 'FALL, THEN RISE.'}</h2><p>{phase === 'victory' ? 'Your timing was sharper than the void.' : 'Every defeat is data. Reset and sharpen your timing.'}</p></div>
          <button className="secondary-button" onClick={beginDuel}>REMATCH ↗</button>
        </section>
      )}

      <footer className="footer"><span>TYPE<span className="brand-accent">BLADE</span> © 2026</span><span>BUILT FOR QUICK HANDS & CLEAR MINDS</span><span>PRESS START. FIND YOUR FLOW.</span></footer>
    </main>
  )
}

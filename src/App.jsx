import { useState, useRef, useMemo, memo } from 'react'
import {
  CELLS, ARROWS, SNAKES,
  cellCenter, buildSnakePoints, buildArrowPoints, pointsToPath
} from './cells'
import './App.css'

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

function Dice({ value, rolling }) {
  const dotMap = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]],
    5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]]
  }
  const dots = value ? dotMap[value] : []
  return (
    <div className={`dice ${rolling ? 'rolling' : ''}`}>
      <div className="dice-face">
        {dots.map(([r, c], i) => (
          <span key={i} className="dot" style={{ gridRow: r + 1, gridColumn: c + 1 }} />
        ))}
      </div>
    </div>
  )
}

const CellsLayer = memo(function CellsLayer({ position, landedCell }) {
  const cells = []
  for (let n = 1; n <= 72; n++) {
    const { x, y } = cellCenter(n)
    const isArrow = !!ARROWS[n]
    const isSnake = !!SNAKES[n]
    const isLanded = landedCell === n
    const isCurrent = position === n
    let fill = '#12122a'
    let stroke = '#1e1e3a'
    if (isArrow) { fill = '#132a1c'; stroke = '#2a5535' }
    if (isSnake) { fill = '#2a1313'; stroke = '#553030' }
    if (isCurrent) { fill = 'rgba(201,162,39,0.12)'; stroke = '#c9a227' }
    if (isLanded) { fill = 'rgba(201,162,39,0.35)'; stroke = '#f5d76e' }

    cells.push(
      <g key={n}>
        <rect
          x={x - 48} y={y - 48} width="96" height="96" rx="6"
          fill={fill} stroke={stroke}
          strokeWidth={isLanded ? 3 : 1}
        />
        <text
          x={x - 40} y={y - 32}
          fill={isLanded ? '#f5d76e' : isCurrent ? '#c9a227' : '#4a4a6a'}
          fontSize="11" fontFamily="Georgia, serif"
        >{n}</text>
      </g>
    )
  }
  return <>{cells}</>
})

const ArrowsLayer = memo(function ArrowsLayer({ visuals }) {
  return (
    <>
      {visuals.map(a => (
        <g key={`a-${a.from}`}>
          <polygon
            points={a.feather1.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
            fill="url(#arrowGrad)" opacity="0.9"
          />
          <polygon
            points={a.feather2.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
            fill="url(#arrowGrad)" opacity="0.9"
          />
          <line
            x1={a.p1.x} y1={a.p1.y} x2={a.shaftEnd.x} y2={a.shaftEnd.y}
            stroke="url(#arrowGrad)" strokeWidth="7" strokeLinecap="round" opacity="0.95"
          />
          <line
            x1={a.p1.x} y1={a.p1.y} x2={a.shaftEnd.x} y2={a.shaftEnd.y}
            stroke="#fff8d0" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"
          />
          <polygon
            points={a.headPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
            fill="url(#arrowGrad)"
          />
        </g>
      ))}
    </>
  )
})

const SnakesLayer = memo(function SnakesLayer({ visuals }) {
  return (
    <>
      {visuals.map(s => (
        <g key={`s-${s.from}`}>
          <path
            d={s.path} fill="none" stroke="#3a0a0a" strokeWidth="18"
            strokeLinecap="round" strokeLinejoin="round" opacity="0.5"
          />
          <path
            d={s.path} fill="none" stroke="url(#snakeGrad)" strokeWidth="11"
            strokeLinecap="round" strokeLinejoin="round"
          />
          <path
            d={s.path} fill="none" stroke="#e8a86a" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="5 11" opacity="0.85"
          />
          <ellipse cx={s.head.x} cy={s.head.y} rx="16" ry="14"
            fill="#7a1f1f" stroke="#e8a86a" strokeWidth="1.5" />
          <ellipse cx={s.head.x - 5} cy={s.head.y - 3} rx="3" ry="3.5" fill="#1a0000" />
          <ellipse cx={s.head.x + 5} cy={s.head.y - 3} rx="3" ry="3.5" fill="#1a0000" />
          <circle cx={s.head.x - 4.5} cy={s.head.y - 3.8} r="1" fill="#fff" />
          <circle cx={s.head.x + 5.5} cy={s.head.y - 3.8} r="1" fill="#fff" />
          <line x1={s.head.x} y1={s.head.y + 13} x2={s.head.x} y2={s.head.y + 22}
            stroke="#e8a86a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1={s.head.x} y1={s.head.y + 22} x2={s.head.x - 4} y2={s.head.y + 26}
            stroke="#e8a86a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1={s.head.x} y1={s.head.y + 22} x2={s.head.x + 4} y2={s.head.y + 26}
            stroke="#e8a86a" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      ))}
    </>
  )
})

export default function App() {
  const [position, setPosition] = useState(0)
  const [intention, setIntention] = useState('')
  const [message, setMessage] = useState('Сформулируй намерение и брось кубик.')
  const [hint, setHint] = useState('')
  const [landedCell, setLandedCell] = useState(null)
  const [diceValue, setDiceValue] = useState(null)
  const [isRolling, setIsRolling] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [history, setHistory] = useState([])
  const [rolls, setRolls] = useState([])   // все значения кубика за игру
  const [gameOver, setGameOver] = useState(false)
  const [pawnPos, setPawnPos] = useState(cellCenter(1))
  const pawnPosRef = useRef(cellCenter(1))
  const busyRef = useRef(false)

  const snakeVisuals = useMemo(() => {
    return Object.entries(SNAKES).map(([from, to]) => {
      const fromN = Number(from)
      const toN = Number(to)
      const points = buildSnakePoints(fromN, toN)
      return { from: fromN, to: toN, points, path: pointsToPath(points), head: points[0] }
    })
  }, [])

  const arrowVisuals = useMemo(() => {
    return Object.entries(ARROWS).map(([from, to]) => {
      const fromN = Number(from)
      const toN = Number(to)
      const p1 = cellCenter(fromN)
      const p2 = cellCenter(toN)
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
      const headSize = 24
      const headHalf = 0.42

      return {
        from: fromN, to: toN, p1, p2, angle,
        headPoints: [
          p2,
          { x: p2.x - headSize * Math.cos(angle - headHalf), y: p2.y - headSize * Math.sin(angle - headHalf) },
          { x: p2.x - headSize * Math.cos(angle + headHalf), y: p2.y - headSize * Math.sin(angle + headHalf) }
        ],
        feather1: [
          p1,
          { x: p1.x - 24 * Math.cos(angle), y: p1.y - 24 * Math.sin(angle) },
          { x: p1.x + 6 * Math.cos(angle) + 12 * Math.cos(angle + Math.PI / 2), y: p1.y + 6 * Math.sin(angle) + 12 * Math.sin(angle + Math.PI / 2) }
        ],
        feather2: [
          p1,
          { x: p1.x - 24 * Math.cos(angle), y: p1.y - 24 * Math.sin(angle) },
          { x: p1.x + 6 * Math.cos(angle) - 12 * Math.cos(angle + Math.PI / 2), y: p1.y + 6 * Math.sin(angle) - 12 * Math.sin(angle + Math.PI / 2) }
        ],
        shaftEnd: {
          x: p2.x - 16 * Math.cos(angle),
          y: p2.y - 16 * Math.sin(angle)
        },
        points: buildArrowPoints(fromN, toN)
      }
    })
  }, [])

  function animateTo(target, duration) {
    const start = { ...pawnPosRef.current }
    return new Promise(resolve => {
      const t0 = performance.now()
      let finished = false
      const finish = () => { if (!finished) { finished = true; resolve() } }
      const safety = setTimeout(finish, duration + 1000)
      const tick = now => {
        if (finished) return
        let t = (now - t0) / duration
        if (!isFinite(t) || t < 0) t = 0
        if (t > 1) t = 1
        const pos = {
          x: start.x + (target.x - start.x) * t,
          y: start.y + (target.y - start.y) * t
        }
        pawnPosRef.current = pos
        setPawnPos(pos)
        if (t < 1) requestAnimationFrame(tick)
        else { clearTimeout(safety); finish() }
      }
      requestAnimationFrame(tick)
    })
  }

  function animateAlong(points, duration) {
    return new Promise(resolve => {
      if (!points || points.length < 2) return resolve()
      const t0 = performance.now()
      const maxIdx = points.length - 1
      let finished = false
      const finish = () => { if (!finished) { finished = true; resolve() } }
      const safety = setTimeout(finish, duration + 1000)
      const tick = now => {
        if (finished) return
        let t = (now - t0) / duration
        if (!isFinite(t) || t < 0) t = 0
        if (t > 1) t = 1
        let idx = t * maxIdx
        if (idx < 0) idx = 0
        if (idx > maxIdx) idx = maxIdx
        const i0 = Math.min(maxIdx, Math.floor(idx))
        const i1 = Math.min(maxIdx, i0 + 1)
        const frac = Math.max(0, Math.min(1, idx - i0))
        const p0 = points[i0]
        const p1 = points[i1] || p0
        const pos = {
          x: p0.x + (p1.x - p0.x) * frac,
          y: p0.y + (p1.y - p0.y) * frac
        }
        pawnPosRef.current = pos
        setPawnPos(pos)
        if (t < 1) requestAnimationFrame(tick)
        else { clearTimeout(safety); finish() }
      }
      requestAnimationFrame(tick)
    })
  }

  async function roll() {
    if (busyRef.current) return
    if (!intention.trim()) {
      setMessage('Сначала сформулируй намерение — зачем ты делаешь этот ход?')
      return
    }

    busyRef.current = true
    setIsRolling(true)
    setHint('')
    setLandedCell(null)

    try {
      const finalRoll = Math.floor(Math.random() * 6) + 1
      setRolls(prev => [...prev, finalRoll])

      const shakeStart = Date.now()
      while (Date.now() - shakeStart < 900) {
        setDiceValue(Math.floor(Math.random() * 6) + 1)
        await sleep(70)
      }
      setDiceValue(finalRoll)
      setIsRolling(false)
      await sleep(400)

      if (position === 0) {
        if (finalRoll === 6) {
          setPosition(6)
          setLandedCell(6)
          await animateTo(cellCenter(6), 500)
          setMessage(`🎲 Выпало 6. Ты родился! Клетка 6 — ${CELLS[6].name}.`)
          setHint(CELLS[6]?.hint || '')
          setHistory(prev => [...prev, {
            turn: prev.length + 1, intention, roll: finalRoll, to: 6, type: 'birth'
          }])
          setIntention('')
        } else {
          setMessage(`🎲 Выпало ${finalRoll}. Чтобы родиться, нужна 6. Намерение сохранено — попробуй снова.`)
        }
        return
      }

      if (position + finalRoll > 72) {
        setMessage(`🎲 Выпало ${finalRoll}, но нужно ровно ${72 - position} для точного попадания. Ход пропущен.`)
        return
      }

      setIsMoving(true)
      const startPos = position
      for (let step = 1; step <= finalRoll; step++) {
        await animateTo(cellCenter(startPos + step), 220)
      }

      const landed = startPos + finalRoll
      const arrow = arrowVisuals.find(a => a.from === landed)
      const snake = snakeVisuals.find(s => s.from === landed)

      // Проверка на повторяющийся урок: та же змея, что и в прошлый раз
      const lastSnake = history.length > 0
        ? history[history.length - 1].from
        : null

      if (arrow) {
        await sleep(250)
        setMessage(`🎲 Выпало ${finalRoll}. ⬆ Стрела: ${landed} (${CELLS[landed]?.name}) → ${ARROWS[landed]} (${CELLS[ARROWS[landed]]?.name})`)
        setHint(CELLS[landed]?.hint || '')
        setLandedCell(ARROWS[landed])
        await animateAlong(arrow.points, 1300)
        setPosition(ARROWS[landed])
      } else if (snake) {
        await sleep(250)
        const repeat = lastSnake === landed
        setMessage(
          `🎲 Выпало ${finalRoll}. ⬇ Змея: ${landed} (${CELLS[landed]?.name}) → ${SNAKES[landed]} (${CELLS[SNAKES[landed]]?.name}).` +
          (repeat ? ' Та же змея, что и в прошлый раз — это твой урок, задержись на нём.' : '')
        )
        setHint(CELLS[landed]?.hint || '')
        setLandedCell(SNAKES[landed])
        await animateAlong(snake.points, 1500)
        setPosition(SNAKES[landed])
      } else {
        setMessage(`🎲 Выпало ${finalRoll}. Клетка ${landed} — ${CELLS[landed]?.name || ''}`)
        setHint(CELLS[landed]?.hint || '')
        setLandedCell(landed)
      }

      setHistory(prev => [...prev, {
        turn: prev.length + 1,
        intention,
        roll: finalRoll,
        from: landed,              // куда фишка попала до стрелы/змеи
        to: arrow ? ARROWS[landed] : snake ? SNAKES[landed] : landed,
        type: arrow ? 'arrow' : snake ? 'snake' : 'plain'
      }])

  // Финальная позиция после возможной стрелы или змеи
      const finalPosition = arrow ? ARROWS[landed] : snake ? SNAKES[landed] : landed

      // Победа — только на клетке 68 «Космическое сознание»
      if (finalPosition === 68) {
        setMessage(prev => prev + ' 🌟 Ты достиг клетки 68 — Космическое сознание. Игра завершена.')
        setHint('Ты завершил путь. Освобождение — не финиш, а возвращение к тому, с чего начал. Посмотри на пройденный путь без сожаления.')
        setGameOver(true)
      }

      setIntention('')
    } catch (err) {
      console.error('Ошибка во время хода:', err)
      setMessage('Произошла ошибка: ' + (err?.message || String(err)))
    } finally {
      setIsRolling(false)
      setIsMoving(false)
      busyRef.current = false
    }
  }

  function reset() {
    if (busyRef.current) return
    setPosition(0)
    setIntention('')
    setMessage('Сформулируй намерение и брось кубик.')
    setHint('')
    setLandedCell(null)
    setDiceValue(null)
    setHistory([])
    setRolls([])
	setGameOver(false)
    const start = cellCenter(1)
    pawnPosRef.current = start
    setPawnPos(start)
  }

  return (
    <div className="app">
      <header>
        <h1>Лила</h1>
        <p className="subtitle">Игра самопознания · 72 клетки</p>
      </header>

      <div className="layout">
        <div className="board-wrap">
          <svg viewBox="0 0 900 800" className="board-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="arrowGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#7a5a10" />
                <stop offset="50%" stopColor="#e8c44a" />
                <stop offset="100%" stopColor="#f5e08a" />
              </linearGradient>
              <linearGradient id="snakeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c44545" />
                <stop offset="60%" stopColor="#7a1f1f" />
                <stop offset="100%" stopColor="#4a1010" />
              </linearGradient>
              <radialGradient id="pawnGrad" cx="0.35" cy="0.3" r="0.75">
                <stop offset="0%" stopColor="#fff8d0" />
                <stop offset="45%" stopColor="#f5d76e" />
                <stop offset="100%" stopColor="#8a6410" />
              </radialGradient>
              <pattern id="cellPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="5" cy="5" r="0.6" fill="rgba(255,255,255,0.03)" />
              </pattern>
            </defs>

            <rect width="900" height="800" fill="#080812" rx="14" />
            <rect width="900" height="800" fill="url(#cellPattern)" rx="14" />

            <CellsLayer position={position} landedCell={landedCell} />
            <ArrowsLayer visuals={arrowVisuals} />
            <SnakesLayer visuals={snakeVisuals} />

            <g transform={`translate(${pawnPos.x.toFixed(1)}, ${pawnPos.y.toFixed(1)})`}>
              <circle r="16" fill="rgba(245,215,110,0.25)" />
              <circle r="15" fill="url(#pawnGrad)" stroke="#fff8d0" strokeWidth="1" />
              <circle r="6" fill="none" stroke="#8a6410" strokeWidth="1.2" opacity="0.6" />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="15"
                fill="#0e0e1a"
                fontWeight="bold"
                fontFamily="Georgia, serif"
              >♟</text>
            </g>
          </svg>
        </div>

        <aside className="panel">
          <div className="intention-block">
            <label htmlFor="intention">Намерение перед ходом</label>
            <textarea
              id="intention"
              value={intention}
              onChange={e => setIntention(e.target.value)}
              placeholder="Зачем ты делаешь этот ход?"
              disabled={isRolling || isMoving}
              rows={3}
            />
          </div>

          <button
			  onClick={roll}
			  disabled={isRolling || isMoving || !intention.trim() || gameOver}
			>
			  {gameOver ? 'Игра завершена' : isRolling ? 'Бросаем…' : isMoving ? 'Двигаемся…' : 'Бросить кубик'}
			</button>

          {rolls.length > 0 && (
            <div className="rolls-strip">
              <span className="rolls-label">Броски:</span>
              {rolls.map((r, i) => (
                <span key={i} className="roll-chip">{r}</span>
              ))}
            </div>
          )}

          <div className="message-block">
            <p className="message">{message}</p>
            {hint && (
              <div className="hint">
                <div className="hint-label">Подсказка</div>
                <p>{hint}</p>
              </div>
            )}
          </div>

          <button className="reset" onClick={reset} disabled={isRolling || isMoving}>
            Начать заново
          </button>

          {history.length > 0 && (
            <div className="history">
              <div className="history-label">История ({history.length})</div>
              <ul>
                {history.slice().reverse().map((h, i) => (
                  <li key={i} className={h.type}>
                    <span className="h-turn">#{h.turn}</span>
                    <span className="h-intention">«{h.intention}»</span>
                    <span className="h-roll">🎲 {h.roll}</span>
                    <span className="h-to">
                      {h.from !== h.to ? `${h.from}→${h.to}` : h.to}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
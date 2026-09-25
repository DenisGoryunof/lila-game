import { useState, useRef } from 'react'
import { CELLS, ARROWS, SNAKES, getCellPosition } from './cells'
import './App.css'

const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const DICE_SHAKE_TIME = 900
const STEP_TIME = 220
const JUMP_TIME = 900

function Dice({ value, rolling }) {
  const dotMap = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [0, 2], [2, 0], [2, 2]],
    5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
    6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
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

export default function App() {
  const [position, setPosition] = useState(0)
  const [intention, setIntention] = useState('')
  const [message, setMessage] = useState('Сформулируй намерение и брось кубик.')
  const [hint, setHint] = useState('')
  const [landedCell, setLandedCell] = useState(null)
  const [diceValue, setDiceValue] = useState(null)
  const [isRolling, setIsRolling] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [pawnMotion, setPawnMotion] = useState('')
  const [history, setHistory] = useState([])
  const busyRef = useRef(false)

  const reset = () => {
    if (busyRef.current) return
    setPosition(0)
    setIntention('')
    setMessage('Сформулируй намерение и брось кубик.')
    setHint('')
    setLandedCell(null)
    setDiceValue(null)
    setHistory([])
  }

  const roll = async () => {
    if (busyRef.current) return
    if (!intention.trim()) {
      setMessage('Сначала сформулируй намерение — зачем ты делаешь этот ход?')
      return
    }
    busyRef.current = true
    setIsRolling(true)
    setHint('')
    setLandedCell(null)

    const finalRoll = Math.floor(Math.random() * 6) + 1

    // Анимация броска
    const shakeStart = Date.now()
    while (Date.now() - shakeStart < DICE_SHAKE_TIME) {
      setDiceValue(Math.floor(Math.random() * 6) + 1)
      await sleep(70)
    }
    setDiceValue(finalRoll)
    setIsRolling(false)
    await sleep(400)

    // Рождение
    if (position === 0) {
      if (finalRoll === 6) {
        setPosition(6)
        setLandedCell(6)
        setMessage('Ты родился! Клетка 6 — Эго.')
        setHint(CELLS[6].hint)
        setHistory(prev => [...prev, { turn: prev.length + 1, intention, roll: finalRoll, to: 6, type: 'birth' }])
        setIntention('')
      } else {
        setMessage(`Выпало ${finalRoll}. Чтобы родиться, нужна 6. Намерение сохранено — попробуй снова.`)
      }
      busyRef.current = false
      return
    }

    // Проверка на точное попадание в 72
    if (position + finalRoll > 72) {
      setMessage(`Выпало ${finalRoll}, но нужно ровно ${72 - position} для точного попадания. Ход пропущен.`)
      busyRef.current = false
      return
    }

    // Пошаговое движение
    setIsMoving(true)
    const startPos = position
    for (let step = 1; step <= finalRoll; step++) {
      await sleep(STEP_TIME)
      setPosition(startPos + step)
    }

    const landed = startPos + finalRoll

    // Стрела или змея
    if (ARROWS[landed]) {
      await sleep(500)
      setPawnMotion('climbing')
      setPosition(ARROWS[landed])
      setMessage(`⬆ Стрела: с клетки ${landed} (${CELLS[landed]?.name}) на ${ARROWS[landed]} (${CELLS[ARROWS[landed]]?.name})`)
      setHint(CELLS[landed]?.hint || '')
      setLandedCell(ARROWS[landed])
      await sleep(JUMP_TIME)
      setPawnMotion('')
    } else if (SNAKES[landed]) {
      await sleep(500)
      setPawnMotion('sliding')
      setPosition(SNAKES[landed])
      setMessage(`⬇ Змея: с клетки ${landed} (${CELLS[landed]?.name}) на ${SNAKES[landed]} (${CELLS[SNAKES[landed]]?.name})`)
      setHint(CELLS[landed]?.hint || '')
      setLandedCell(SNAKES[landed])
      await sleep(JUMP_TIME)
      setPawnMotion('')
    } else {
      setMessage(`Клетка ${landed} — ${CELLS[landed]?.name || ''}`)
      setHint(CELLS[landed]?.hint || '')
      setLandedCell(landed)
    }

    setHistory(prev => [...prev, {
      turn: prev.length + 1,
      intention,
      roll: finalRoll,
      to: landed,
      type: ARROWS[landed] ? 'arrow' : SNAKES[landed] ? 'snake' : 'plain'
    }])

    if (landed === 72) {
      setMessage('🎉 Ты достиг Мокши (клетка 72). Игра завершена.')
      setHint(CELLS[72].hint)
    }

    setIntention('')
    setIsMoving(false)
    busyRef.current = false
  }

  // Рендер доски
  const renderBoard = () => {
    const cells = []
    for (let g = 0; g < 9; g++) {
      const r = 8 - g
      for (let c = 0; c < 8; c++) {
        const num = r % 2 === 0 ? r * 8 + c + 1 : r * 8 + (7 - c) + 1
        const cellData = CELLS[num] || {}
        let cls = 'cell'
        if (ARROWS[num]) cls += ' arrow'
        if (SNAKES[num]) cls += ' snake'
        if (landedCell === num) cls += ' landed'
        cells.push(
          <div key={num} className={cls} title={cellData.name || ''}>
            <span className="cell-num">{num}</span>
            {ARROWS[num] && <span className="cell-icon">⬆</span>}
            {SNAKES[num] && <span className="cell-icon">⬇</span>}
          </div>
        )
      }
    }
    return cells
  }

  const pos = getCellPosition(position)

  return (
    <div className="app">
      <header>
        <h1>Лила</h1>
        <p className="subtitle">Игра самопознания · 72 клетки</p>
      </header>

      <div className="layout">
        <div className="board-wrap">
          <div className="board-grid">{renderBoard()}</div>
          <div
            className={`pawn ${pawnMotion}`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >♟</div>
        </div>

        <aside className="panel">
          <div className="intention-block">
            <label htmlFor="intention">Намерение перед ходом</label>
            <textarea
              id="intention"
              value={intention}
              onChange={e => setIntention(e.target.value)}
              placeholder="Зачем ты делаешь этот ход? Что хочешь увидеть?"
              disabled={isRolling || isMoving}
              rows={3}
            />
          </div>

          <div className="roll-block">
            <Dice value={diceValue} rolling={isRolling} />
            <button onClick={roll} disabled={isRolling || isMoving || !intention.trim()}>
              {isRolling ? 'Бросаем…' : isMoving ? 'Двигаемся…' : 'Бросить кубик'}
            </button>
          </div>

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
                    <span className="h-to">→ {h.to}</span>
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
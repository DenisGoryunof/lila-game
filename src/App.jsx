import { useState } from 'react'
import './App.css'

// Стрелы: { клетка: куда_ведёт }
const ARROWS = {
  10: 68, 17: 74, 22: 32, 27: 41, 28: 50,
  37: 66, 39: 58, 46: 62, 48: 56, 51: 67, 59: 71
}

// Змеи: { клетка: куда_спускает }
const SNAKES = {
  12: 8, 16: 4, 24: 7, 29: 6, 44: 9,
  52: 35, 55: 3, 61: 13, 63: 51, 72: 51
}

function App() {
  const [position, setPosition] = useState(0) // 0 = ещё не родился
  const [lastRoll, setLastRoll] = useState(null)
  const [message, setMessage] = useState('Нажми "Бросить кубик", чтобы начать путь.')

  const roll = () => {
    const rollValue = Math.floor(Math.random() * 6) + 1
    setLastRoll(rollValue)

    // Пока не выпадет 6 — игрок "не рождён"
    if (position === 0) {
      if (rollValue === 6) {
        setPosition(6) // после рождения сразу на 6-ю клетку
        setMessage('Ты родился! Ты на клетке 6 — Заблуждение (Моха).')
      } else {
        setMessage(`Выпало ${rollValue}. Чтобы родиться, нужна 6.`)
      }
      return
    }

    let newPos = position + rollValue

    // Проверка на стрелу
    if (ARROWS[newPos]) {
      newPos = ARROWS[newPos]
      setMessage(`Стрела! Подъём на клетку ${newPos}.`)
    }
    // Проверка на змею
    else if (SNAKES[newPos]) {
      newPos = SNAKES[newPos]
      setMessage(`Змея! Спуск на клетку ${newPos}. Задумайся о намерении.`)
    }
    // Обычный ход
    else {
      setMessage(`Ход на клетку ${newPos}.`)
    }

    // Не даём улететь за 72 (пока без точного попадания)
    if (newPos > 72) {
      newPos = 72
      setMessage('Ты у цели — Космическое Сознание (клетка 72). Игра завершена.')
    }

    setPosition(newPos)
  }

  const reset = () => {
    setPosition(0)
    setLastRoll(null)
    setMessage('Нажми "Бросить кубик", чтобы начать путь.')
  }

  // Рендер сетки 72 клеток (12x6) — снизу вверх, как в классической Лиле
  const renderBoard = () => {
    const cells = []
    for (let row = 5; row >= 0; row--) {
      for (let col = 0; col < 12; col++) {
        const num = row * 12 + col + 1
        let cellClass = 'cell'
        if (ARROWS[num]) cellClass += ' arrow'
        if (SNAKES[num]) cellClass += ' snake'
        if (position === num) cellClass += ' active'
        cells.push(
          <div key={num} className={cellClass}>
            <span className="cell-num">{num}</span>
            {position === num && <span className="pawn">♟</span>}
          </div>
        )
      }
    }
    return cells
  }

  return (
    <div className="app">
      <h1>Лила</h1>
      <p className="subtitle">Игра самопознания</p>

      <div className="board">{renderBoard()}</div>

      <div className="controls">
        <button onClick={roll}>Бросить кубик</button>
        {lastRoll && <span className="roll-display">Выпало: {lastRoll}</span>}
        <button onClick={reset} className="reset">Сначала</button>
      </div>

      <div className="message">{message}</div>
    </div>
  )
}

export default App
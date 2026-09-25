// Центр клетки в координатах SVG (viewBox 800×900)
export function cellCenter(n) {
  const row = Math.floor((n - 1) / 8)
  const colInRow = (n - 1) % 8
  const col = row % 2 === 0 ? colInRow : 7 - colInRow
  return {
    x: (col + 0.5) * 100,
    y: (8.5 - row) * 100
  }
}

// Волнистая линия для змеи: от головы (from) к хвосту (to)
export function buildSnakePoints(from, to, samples) {
  const p1 = cellCenter(from)
  const p2 = cellCenter(to)
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const dist = Math.hypot(dx, dy)
  const nx = -dy / dist
  const ny = dx / dist
  const amplitude = Math.min(42, dist / 7)
  const waves = Math.max(2, Math.round(dist / 180))

  const N = samples || Math.max(50, Math.round(dist / 12))
  const points = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    // Envelope: 0 в концах, максимум в середине — хвост и голова на месте
    const envelope = Math.sin(t * Math.PI)
    const wave = Math.sin(t * Math.PI * 2 * waves) * amplitude * envelope
    points.push({
      x: p1.x + dx * t + nx * wave,
      y: p1.y + dy * t + ny * wave
    })
  }
  return points
}

// Прямая линия для стрелы
export function buildArrowPoints(from, to, samples = 24) {
  const p1 = cellCenter(from)
  const p2 = cellCenter(to)
  const points = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    points.push({
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t
    })
  }
  return points
}

export function pointsToPath(points) {
  if (!points.length) return ''
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`
  }
  return d
}
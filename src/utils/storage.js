const STORAGE_KEY = 'sudoku_game_state'

export function saveGameState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('保存游戏状态失败:', e)
  }
}

export function loadGameState() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.warn('加载游戏状态失败:', e)
  }
  return null
}

export function clearGameState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.warn('清除游戏状态失败:', e)
  }
}

export function encodeBoard(board) {
  return board.map(row => row.join('')).join('')
}

export function decodeBoard(str) {
  const board = []
  for (let i = 0; i < 9; i++) {
    const row = []
    for (let j = 0; j < 9; j++) {
      row.push(parseInt(str[i * 9 + j] || '0', 10) || 0)
    }
    board.push(row)
  }
  return board
}

export function encodeNotes(notes) {
  return notes.map(row =>
    row.map(cell => cell.sort().join('')).join(',')
  ).join(';')
}

export function decodeNotes(str) {
  const rows = str.split(';')
  return rows.map(rowStr =>
    rowStr.split(',').map(cellStr =>
      cellStr.split('').map(c => parseInt(c, 10)).filter(n => n >= 1 && n <= 9)
    )
  )
}

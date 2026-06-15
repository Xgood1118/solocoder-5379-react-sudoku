export const SIZE = 9
export const BOX = 3

export function createEmptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
}

export function cloneBoard(board) {
  return board.map(row => [...row])
}

export function isValid(board, row, col, num) {
  for (let i = 0; i < SIZE; i++) {
    if (board[row][i] === num) return false
  }
  for (let i = 0; i < SIZE; i++) {
    if (board[i][col] === num) return false
  }
  const boxRow = Math.floor(row / BOX) * BOX
  const boxCol = Math.floor(col / BOX) * BOX
  for (let i = 0; i < BOX; i++) {
    for (let j = 0; j < BOX; j++) {
      if (board[boxRow + i][boxCol + j] === num) return false
    }
  }
  return true
}

export function getCandidates(board, row, col) {
  if (board[row][col] !== 0) return []
  const candidates = []
  for (let num = 1; num <= 9; num++) {
    if (isValid(board, row, col, num)) {
      candidates.push(num)
    }
  }
  return candidates
}

export function getAllCandidates(board) {
  const candidates = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => [])
  )
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (board[row][col] === 0) {
        candidates[row][col] = getCandidates(board, row, col)
      }
    }
  }
  return candidates
}

function findBestCell(board, candidates) {
  let bestRow = -1
  let bestCol = -1
  let bestCount = 10
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (board[row][col] === 0) {
        const count = candidates[row][col].length
        if (count < bestCount) {
          bestCount = count
          bestRow = row
          bestCol = col
          if (count === 0) return { row: bestRow, col: bestCol }
        }
      }
    }
  }
  return { row: bestRow, col: bestCol }
}

export function solveSudoku(board, options = {}) {
  const { maxSolutions = 1, random = null } = options
  const solutions = []
  const workingBoard = cloneBoard(board)
  const candidates = getAllCandidates(workingBoard)

  function backtrack() {
    if (solutions.length >= maxSolutions) return
    const { row, col } = findBestCell(workingBoard, candidates)
    if (row === -1) {
      solutions.push(cloneBoard(workingBoard))
      return
    }
    let nums = [...candidates[row][col]]
    if (random) {
      for (let i = nums.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1))
        ;[nums[i], nums[j]] = [nums[j], nums[i]]
      }
    }
    for (const num of nums) {
      if (isValid(workingBoard, row, col, num)) {
        workingBoard[row][col] = num
        const removed = []
        for (let i = 0; i < SIZE; i++) {
          const idx = candidates[row][i].indexOf(num)
          if (idx !== -1 && i !== col) {
            candidates[row][i].splice(idx, 1)
            removed.push({ row, col: i, num })
          }
        }
        for (let i = 0; i < SIZE; i++) {
          const idx = candidates[i][col].indexOf(num)
          if (idx !== -1 && i !== row) {
            candidates[i][col].splice(idx, 1)
            removed.push({ row: i, col, num })
          }
        }
        const boxRow = Math.floor(row / BOX) * BOX
        const boxCol = Math.floor(col / BOX) * BOX
        for (let i = 0; i < BOX; i++) {
          for (let j = 0; j < BOX; j++) {
            const r = boxRow + i
            const c = boxCol + j
            if (r !== row || c !== col) {
              const idx = candidates[r][c].indexOf(num)
              if (idx !== -1) {
                candidates[r][c].splice(idx, 1)
                removed.push({ row: r, col: c, num })
              }
            }
          }
        }
        backtrack()
        if (solutions.length >= maxSolutions) return
        workingBoard[row][col] = 0
        for (const r of removed) {
          candidates[r.row][r.col].push(r.num)
        }
      }
    }
  }
  backtrack()
  return solutions
}

export function hasUniqueSolution(board) {
  const solutions = solveSudoku(board, { maxSolutions: 2 })
  return solutions.length === 1
}

export function getSolution(board) {
  const solutions = solveSudoku(board, { maxSolutions: 1 })
  return solutions.length > 0 ? solutions[0] : null
}

export function getHint(board, solution) {
  const sol = solution || getSolution(board)
  if (!sol) return null
  const emptyCells = []
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (board[row][col] === 0) {
        const candidates = getCandidates(board, row, col)
        emptyCells.push({ row, col, candidates, answer: sol[row][col] })
      }
    }
  }
  if (emptyCells.length === 0) return null
  emptyCells.sort((a, b) => a.candidates.length - b.candidates.length)
  const cell = emptyCells[0]
  return {
    row: cell.row,
    col: cell.col,
    answer: cell.answer,
    candidates: cell.candidates,
    isNakedSingle: cell.candidates.length === 1,
  }
}

export function findConflicts(board) {
  const conflicts = new Set()
  for (let row = 0; row < SIZE; row++) {
    const seen = new Map()
    for (let col = 0; col < SIZE; col++) {
      const num = board[row][col]
      if (num !== 0) {
        if (seen.has(num)) {
          conflicts.add(`${row},${col}`)
          conflicts.add(`${row},${seen.get(num)}`)
        } else {
          seen.set(num, col)
        }
      }
    }
  }
  for (let col = 0; col < SIZE; col++) {
    const seen = new Map()
    for (let row = 0; row < SIZE; row++) {
      const num = board[row][col]
      if (num !== 0) {
        if (seen.has(num)) {
          conflicts.add(`${row},${col}`)
          conflicts.add(`${seen.get(num)},${col}`)
        } else {
          seen.set(num, row)
        }
      }
    }
  }
  for (let boxRow = 0; boxRow < BOX; boxRow++) {
    for (let boxCol = 0; boxCol < BOX; boxCol++) {
      const seen = new Map()
      for (let i = 0; i < BOX; i++) {
        for (let j = 0; j < BOX; j++) {
          const row = boxRow * BOX + i
          const col = boxCol * BOX + j
          const num = board[row][col]
          if (num !== 0) {
            const key = `${row},${col}`
            if (seen.has(num)) {
              conflicts.add(key)
              conflicts.add(seen.get(num))
            } else {
              seen.set(num, key)
            }
          }
        }
      }
    }
  }
  return conflicts
}

export function isSolved(board) {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (board[row][col] === 0) return false
    }
  }
  return findConflicts(board).size === 0
}

export function getBoxIndex(row, col) {
  return Math.floor(row / BOX) * BOX + Math.floor(col / BOX)
}

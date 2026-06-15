import { createSeededRandom, shuffleArray } from './seedRandom.js'
import { solveSudoku, hasUniqueSolution, cloneBoard, getCandidates, SIZE, BOX } from './sudokuSolver.js'

const DIFFICULTY_TARGETS = {
  beginner: { holes: 45, minDifficulty: 0, maxDifficulty: 0.3 },
  easy: { holes: 50, minDifficulty: 0.3, maxDifficulty: 0.5 },
  medium: { holes: 55, minDifficulty: 0.5, maxDifficulty: 0.7 },
  hard: { holes: 58, minDifficulty: 0.7, maxDifficulty: 1.0 },
}

export const DIFFICULTY_NAMES = {
  beginner: '入门',
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

function generateFullBoard(random) {
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
  const solutions = solveSudoku(board, { maxSolutions: 1, random })
  return solutions.length > 0 ? solutions[0] : null
}

function generatePuzzleByDigging(fullBoard, targetHoles, random, onProgress) {
  const puzzle = cloneBoard(fullBoard)
  const positions = []
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      positions.push([i, j])
    }
  }
  const shuffled = shuffleArray(positions, random)
  let holes = 0
  const maxAttempts = SIZE * SIZE
  let attempts = 0

  for (let i = 0; i < shuffled.length && holes < targetHoles && attempts < maxAttempts; i++) {
    const [row, col] = shuffled[i]
    const backup = puzzle[row][col]
    puzzle[row][col] = 0

    if (hasUniqueSolution(puzzle)) {
      holes++
      if (onProgress) {
        onProgress(holes / targetHoles)
      }
    } else {
      puzzle[row][col] = backup
    }
    attempts++
  }

  return { puzzle, holes }
}

function evaluateDifficulty(puzzle) {
  let score = 0
  const board = cloneBoard(puzzle)
  const solved = new Set()
  let steps = 0
  const maxSteps = 81

  function countEmptyCells() {
    let count = 0
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] === 0) count++
      }
    }
    return count
  }

  function findNakedSingle() {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] === 0) {
          const candidates = getCandidates(board, r, c)
          if (candidates.length === 1) {
            return { row: r, col: c, value: candidates[0] }
          }
        }
      }
    }
    return null
  }

  function findHiddenSingle() {
    for (let num = 1; num <= 9; num++) {
      for (let row = 0; row < SIZE; row++) {
        let count = 0
        let lastCol = -1
        for (let col = 0; col < SIZE; col++) {
          if (board[row][col] === 0) {
            const cands = getCandidates(board, row, col)
            if (cands.includes(num)) {
              count++
              lastCol = col
            }
          }
        }
        if (count === 1) {
          return { row, col: lastCol, value: num }
        }
      }
    }
    for (let num = 1; num <= 9; num++) {
      for (let col = 0; col < SIZE; col++) {
        let count = 0
        let lastRow = -1
        for (let row = 0; row < SIZE; row++) {
          if (board[row][col] === 0) {
            const cands = getCandidates(board, row, col)
            if (cands.includes(num)) {
              count++
              lastRow = row
            }
          }
        }
        if (count === 1) {
          return { row: lastRow, col, value: num }
        }
      }
    }
    for (let num = 1; num <= 9; num++) {
      for (let boxRow = 0; boxRow < BOX; boxRow++) {
        for (let boxCol = 0; boxCol < BOX; boxCol++) {
          let count = 0
          let lastPos = null
          for (let i = 0; i < BOX; i++) {
            for (let j = 0; j < BOX; j++) {
              const r = boxRow * BOX + i
              const c = boxCol * BOX + j
              if (board[r][c] === 0) {
                const cands = getCandidates(board, r, c)
                if (cands.includes(num)) {
                  count++
                  lastPos = { row: r, col: c }
                }
              }
            }
          }
          if (count === 1 && lastPos) {
            return { row: lastPos.row, col: lastPos.col, value: num }
          }
        }
      }
    }
    return null
  }

  let nakedSingles = 0
  let hiddenSingles = 0

  while (steps < maxSteps) {
    const nakedSingle = findNakedSingle()
    if (nakedSingle) {
      board[nakedSingle.row][nakedSingle.col] = nakedSingle.value
      nakedSingles++
      steps++
      continue
    }
    const hiddenSingle = findHiddenSingle()
    if (hiddenSingle) {
      board[hiddenSingle.row][hiddenSingle.col] = hiddenSingle.value
      hiddenSingles++
      steps++
      continue
    }
    break
  }

  const remaining = countEmptyCells()
  const totalCells = 81
  const initialEmpty = 81 - steps - remaining

  if (remaining === 0) {
    if (hiddenSingles === 0) {
      score = 0.2 + (nakedSingles / totalCells) * 0.2
    } else {
      score = 0.4 + (hiddenSingles / totalCells) * 0.3
    }
  } else {
    const backtrackRatio = remaining / (initialEmpty || 1)
    score = 0.7 + backtrackRatio * 0.3
  }

  score = Math.max(0, Math.min(1, score))

  let level
  if (score < 0.3) {
    level = 'beginner'
  } else if (score < 0.5) {
    level = 'easy'
  } else if (score < 0.7) {
    level = 'medium'
  } else {
    level = 'hard'
  }

  return {
    score,
    level,
    nakedSingles,
    hiddenSingles,
    remainingEmptyCells: remaining,
  }
}

export function generateSudoku(seed, difficulty, onProgress) {
  const random = createSeededRandom(seed)
  const target = DIFFICULTY_TARGETS[difficulty] || DIFFICULTY_TARGETS.medium

  if (onProgress) onProgress(0, '生成完整数独...')

  const fullBoard = generateFullBoard(random)
  if (!fullBoard) {
    throw new Error('无法生成完整数独')
  }

  if (onProgress) onProgress(0.2, '挖洞生成题目...')

  const { puzzle, holes } = generatePuzzleByDigging(
    fullBoard,
    target.holes,
    random,
    (p) => {
      if (onProgress) onProgress(0.2 + p * 0.6, '挖洞生成题目...')
    }
  )

  if (onProgress) onProgress(0.8, '评估难度...')

  const difficultyInfo = evaluateDifficulty(puzzle)

  if (onProgress) onProgress(1.0, '完成！')

  return {
    puzzle,
    solution: fullBoard,
    holes,
    seed,
    difficulty: difficultyInfo,
  }
}

export { evaluateDifficulty }

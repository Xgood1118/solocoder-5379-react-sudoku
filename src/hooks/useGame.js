import { useState, useEffect, useCallback, useRef } from 'react'
import { generateSudoku } from '../utils/sudokuGenerator.js'
import { generateSeed, decodeSeed } from '../utils/seedRandom.js'
import { getHint, getSolution, findConflicts, isSolved, cloneBoard, SIZE, getBoxIndex } from '../utils/sudokuSolver.js'
import { saveGameState, loadGameState } from '../utils/storage.js'

const GAME_STATES = {
  IDLE: 'idle',
  GENERATING: 'generating',
  PLAYING: 'playing',
  PAUSED: 'paused',
  SOLVED: 'solved',
  FAILED: 'failed',
}

const MAX_HISTORY = 200

function createInitialState() {
  return {
    gameState: GAME_STATES.IDLE,
    board: null,
    initialBoard: null,
    solution: null,
    notes: null,
    selectedCell: null,
    pencilMode: false,
    history: [],
    moveHistory: [],
    hintsUsed: 0,
    maxHints: 5,
    elapsedTime: 0,
    difficulty: 'medium',
    difficultyInfo: null,
    seed: null,
    holes: 0,
    conflicts: new Set(),
    highlightedCells: new Set(),
    hintCell: null,
    generationProgress: 0,
    generationMessage: '',
  }
}

function createEmptyNotes() {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => [])
  )
}

export function useGame() {
  const [state, setState] = useState(createInitialState)
  const timerRef = useRef(null)
  const broadcastChannelRef = useRef(null)
  const isSyncingRef = useRef(false)

  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      broadcastChannelRef.current = new BroadcastChannel('sudoku_game')
      broadcastChannelRef.current.onmessage = (event) => {
        if (event.data.type === 'state_sync' && !isSyncingRef.current) {
          isSyncingRef.current = true
          setState(prev => ({
            ...prev,
            ...event.data.state,
            conflicts: new Set(event.data.state.conflicts || []),
            highlightedCells: new Set(event.data.state.highlightedCells || []),
          }))
          setTimeout(() => {
            isSyncingRef.current = false
          }, 100)
        }
      }
    }
    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close()
      }
    }
  }, [])

  const syncState = useCallback((newState) => {
    if (broadcastChannelRef.current) {
      const serializableState = {
        ...newState,
        conflicts: Array.from(newState.conflicts || []),
        highlightedCells: Array.from(newState.highlightedCells || []),
      }
      broadcastChannelRef.current.postMessage({
        type: 'state_sync',
        state: serializableState,
      })
    }
  }, [])

  const setStateAndSync = useCallback((updater) => {
    setState(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater
      syncState(newState)
      return newState
    })
  }, [syncState])

  useEffect(() => {
    if (state.gameState === GAME_STATES.PLAYING) {
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          elapsedTime: prev.elapsedTime + 1,
        }))
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [state.gameState])

  useEffect(() => {
    if (state.gameState !== GAME_STATES.GENERATING && state.gameState !== GAME_STATES.IDLE) {
      const serializableState = {
        ...state,
        conflicts: Array.from(state.conflicts),
        highlightedCells: Array.from(state.highlightedCells),
      }
      saveGameState(serializableState)
    }
  }, [state])

  useEffect(() => {
    const saved = loadGameState()
    if (saved && saved.gameState !== GAME_STATES.IDLE) {
      setState({
        ...saved,
        conflicts: new Set(saved.conflicts || []),
        highlightedCells: new Set(saved.highlightedCells || []),
      })
    }
  }, [])

  const checkConflicts = useCallback((board) => {
    return findConflicts(board)
  }, [])

  const checkAndUpdateState = useCallback((board) => {
    const conflicts = findConflicts(board)
    if (conflicts.size > 0) {
      return { conflicts, gameState: GAME_STATES.FAILED }
    }
    if (isSolved(board)) {
      return { conflicts, gameState: GAME_STATES.SOLVED }
    }
    return { conflicts, gameState: GAME_STATES.PLAYING }
  }, [])

  const startNewGame = useCallback(async (difficulty, seed) => {
    const gameSeed = seed || generateSeed()
    const diff = difficulty || 'medium'

    setState(prev => ({
      ...prev,
      gameState: GAME_STATES.GENERATING,
      generationProgress: 0,
      generationMessage: '准备生成...',
      difficulty: diff,
      seed: gameSeed,
    }))

    await new Promise(resolve => setTimeout(resolve, 50))

    try {
      const result = generateSudoku(gameSeed, diff, (progress, message) => {
        setState(prev => ({
          ...prev,
          generationProgress: progress,
          generationMessage: message || '',
        }))
      })

      const notes = createEmptyNotes()
      const conflicts = new Set()

      setStateAndSync({
        gameState: GAME_STATES.PLAYING,
        board: result.puzzle,
        initialBoard: cloneBoard(result.puzzle),
        solution: result.solution,
        notes,
        selectedCell: null,
        pencilMode: false,
        history: [],
        moveHistory: [],
        hintsUsed: 0,
        maxHints: 5,
        elapsedTime: 0,
        difficulty: diff,
        difficultyInfo: result.difficulty,
        seed: gameSeed,
        holes: result.holes,
        conflicts,
        highlightedCells: new Set(),
        hintCell: null,
        generationProgress: 1,
        generationMessage: '完成！',
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        gameState: GAME_STATES.IDLE,
        generationProgress: 0,
        generationMessage: '',
      }))
      console.error('生成数独失败:', error)
    }
  }, [setStateAndSync])

  const selectCell = useCallback((row, col) => {
    if (state.gameState !== GAME_STATES.PLAYING && state.gameState !== GAME_STATES.FAILED) return

    const highlighted = new Set()
    if (row !== null && col !== null) {
      for (let i = 0; i < SIZE; i++) {
        highlighted.add(`${row},${i}`)
        highlighted.add(`${i},${col}`)
      }
      const boxRow = Math.floor(row / 3) * 3
      const boxCol = Math.floor(col / 3) * 3
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          highlighted.add(`${boxRow + i},${boxCol + j}`)
        }
      }
    }

    setState(prev => ({
      ...prev,
      selectedCell: { row, col },
      highlightedCells: highlighted,
      hintCell: null,
    }))
  }, [state.gameState])

  const setNumber = useCallback((num) => {
    if (!state.selectedCell) return
    if (state.gameState !== GAME_STATES.PLAYING && state.gameState !== GAME_STATES.FAILED) return

    const { row, col } = state.selectedCell
    if (state.initialBoard[row][col] !== 0) return

    if (state.pencilMode) {
      setState(prev => {
        const newNotes = prev.notes.map(r => r.map(c => [...c]))
        const cellNotes = newNotes[row][col]
        const idx = cellNotes.indexOf(num)
        if (idx !== -1) {
          cellNotes.splice(idx, 1)
        } else {
          cellNotes.push(num)
          cellNotes.sort((a, b) => a - b)
        }

        const newHistory = [...prev.history, {
          type: 'note',
          row,
          col,
          prevValue: prev.notes[row][col].slice(),
          newValue: cellNotes.slice(),
        }]

        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift()
        }

        return {
          ...prev,
          notes: newNotes,
          history: newHistory,
        }
      })
    } else {
      setState(prev => {
        const newBoard = prev.board.map(r => [...r])
        const oldValue = newBoard[row][col]
        newBoard[row][col] = num

        const newNotes = prev.notes.map(r => r.map(c => [...c]))
        newNotes[row][col] = []

        const { conflicts, gameState } = checkAndUpdateState(newBoard)

        const newHistory = [...prev.history, {
          type: 'number',
          row,
          col,
          prevValue: oldValue,
          newValue: num,
          prevNotes: prev.notes[row][col].slice(),
        }]

        const newMoveHistory = [...prev.moveHistory, {
          row,
          col,
          value: num,
          timestamp: Date.now(),
        }]

        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift()
        }

        return {
          ...prev,
          board: newBoard,
          notes: newNotes,
          conflicts,
          gameState,
          history: newHistory,
          moveHistory: newMoveHistory,
          hintCell: null,
        }
      })
    }
  }, [state.selectedCell, state.gameState, state.initialBoard, state.pencilMode, checkAndUpdateState])

  const clearCell = useCallback(() => {
    if (!state.selectedCell) return
    if (state.gameState !== GAME_STATES.PLAYING && state.gameState !== GAME_STATES.FAILED) return

    const { row, col } = state.selectedCell
    if (state.initialBoard[row][col] !== 0) return

    setState(prev => {
      const newBoard = prev.board.map(r => [...r])
      const oldValue = newBoard[row][col]
      newBoard[row][col] = 0

      const newNotes = prev.notes.map(r => r.map(c => [...c]))
      newNotes[row][col] = []

      const { conflicts, gameState } = checkAndUpdateState(newBoard)

      const newHistory = [...prev.history, {
        type: 'number',
        row,
        col,
        prevValue: oldValue,
        newValue: 0,
        prevNotes: prev.notes[row][col].slice(),
      }]

      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift()
      }

      return {
        ...prev,
        board: newBoard,
        notes: newNotes,
        conflicts,
        gameState,
        history: newHistory,
      }
    })
  }, [state.selectedCell, state.gameState, state.initialBoard, checkAndUpdateState])

  const undo = useCallback(() => {
    if (state.history.length === 0) return
    if (state.gameState !== GAME_STATES.PLAYING && state.gameState !== GAME_STATES.FAILED) return

    setState(prev => {
      const newHistory = [...prev.history]
      const lastAction = newHistory.pop()

      if (!lastAction) return prev

      const newBoard = prev.board.map(r => [...r])
      const newNotes = prev.notes.map(r => r.map(c => [...c]))

      if (lastAction.type === 'number') {
        newBoard[lastAction.row][lastAction.col] = lastAction.prevValue
        newNotes[lastAction.row][lastAction.col] = lastAction.prevNotes || []
      } else if (lastAction.type === 'note') {
        newNotes[lastAction.row][lastAction.col] = lastAction.prevValue
      }

      const { conflicts, gameState } = checkAndUpdateState(newBoard)

      return {
        ...prev,
        board: newBoard,
        notes: newNotes,
        conflicts,
        gameState,
        history: newHistory,
      }
    })
  }, [state.history.length, state.gameState, checkAndUpdateState])

  const useHint = useCallback(() => {
    if (state.hintsUsed >= state.maxHints) return
    if (state.gameState !== GAME_STATES.PLAYING && state.gameState !== GAME_STATES.FAILED) return

    const hint = getHint(state.board, state.solution)
    if (!hint) return

    setState(prev => ({
      ...prev,
      hintsUsed: prev.hintsUsed + 1,
      hintCell: { row: hint.row, col: hint.col },
      selectedCell: { row: hint.row, col: hint.col },
    }))
  }, [state.hintsUsed, state.maxHints, state.gameState, state.board, state.solution])

  const togglePause = useCallback(() => {
    if (state.gameState === GAME_STATES.PLAYING) {
      setState(prev => ({ ...prev, gameState: GAME_STATES.PAUSED }))
    } else if (state.gameState === GAME_STATES.PAUSED) {
      setState(prev => ({ ...prev, gameState: GAME_STATES.PLAYING }))
    }
  }, [state.gameState])

  const togglePencilMode = useCallback(() => {
    setState(prev => ({ ...prev, pencilMode: !prev.pencilMode }))
  }, [])

  const solveBoard = useCallback(() => {
    if (!state.solution) return
    if (state.gameState !== GAME_STATES.PLAYING && state.gameState !== GAME_STATES.FAILED) return

    setState(prev => ({
      ...prev,
      board: cloneBoard(prev.solution),
      gameState: GAME_STATES.SOLVED,
      conflicts: new Set(),
      notes: createEmptyNotes(),
    }))
  }, [state.solution, state.gameState])

  const checkBoard = useCallback(() => {
    if (state.gameState !== GAME_STATES.PLAYING && state.gameState !== GAME_STATES.FAILED) return
    const conflicts = findConflicts(state.board)
    setState(prev => ({
      ...prev,
      conflicts,
      gameState: conflicts.size > 0 ? GAME_STATES.FAILED : prev.gameState,
    }))
  }, [state.board, state.gameState])

  const moveSelection = useCallback((direction) => {
    if (!state.selectedCell) {
      selectCell(0, 0)
      return
    }
    let { row, col } = state.selectedCell
    switch (direction) {
      case 'up':
        row = Math.max(0, row - 1)
        break
      case 'down':
        row = Math.min(SIZE - 1, row + 1)
        break
      case 'left':
        col = Math.max(0, col - 1)
        break
      case 'right':
        col = Math.min(SIZE - 1, col + 1)
        break
    }
    selectCell(row, col)
  }, [state.selectedCell, selectCell])

  const getShareUrl = useCallback(() => {
    if (!state.seed) return ''
    const url = new URL(window.location.href)
    url.searchParams.set('seed', state.seed.toString(36))
    url.searchParams.set('difficulty', state.difficulty)
    return url.toString()
  }, [state.seed, state.difficulty])

  const getReplayUrl = useCallback(() => {
    if (!state.seed) return ''
    const url = new URL(window.location.href)
    url.searchParams.set('seed', state.seed.toString(36))
    url.searchParams.set('difficulty', state.difficulty)
    url.searchParams.set('replay', '1')
    return url.toString()
  }, [state.seed, state.difficulty])

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  return {
    ...state,
    GAME_STATES,
    startNewGame,
    selectCell,
    setNumber,
    clearCell,
    undo,
    useHint,
    togglePause,
    togglePencilMode,
    solveBoard,
    checkBoard,
    moveSelection,
    getShareUrl,
    getReplayUrl,
    formatTime,
  }
}

export { GAME_STATES }

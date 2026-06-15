import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useGame } from './hooks/useGame.js'
import { DIFFICULTY_NAMES } from './utils/sudokuGenerator.js'
import { decodeSeed } from './utils/seedRandom.js'
import SudokuBoard from './components/SudokuBoard.jsx'
import NumberPad from './components/NumberPad.jsx'
import GameControls from './components/GameControls.jsx'
import DifficultySelector from './components/DifficultySelector.jsx'
import GeneratingModal from './components/GeneratingModal.jsx'
import HistoryReplay from './components/HistoryReplay.jsx'
import ShareModal from './components/ShareModal.jsx'
import Celebration from './components/Celebration.jsx'
import Toast, { useToast } from './components/Toast.jsx'
import { cloneBoard, SIZE } from './utils/sudokuSolver.js'

function App() {
  const game = useGame()
  const { toasts, showToast, removeToast } = useToast()
  const [showDifficulty, setShowDifficulty] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showReplay, setShowReplay] = useState(false)
  const [replayBoard, setReplayBoard] = useState(null)
  const [isReplayMode, setIsReplayMode] = useState(false)
  const replayStepRef = useRef(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const seedStr = params.get('seed')
    const difficulty = params.get('difficulty')
    const isReplay = params.get('replay') === '1'

    if (seedStr) {
      const seed = decodeSeed(seedStr)
      if (!isNaN(seed) && seed > 0) {
        if (game.gameState === 'idle') {
          game.startNewGame(difficulty || 'medium', seed)
        }
      }
    }

    if (isReplay && game.gameState !== 'idle') {
      setIsReplayMode(true)
    }
  }, [])

  useEffect(() => {
    if (game.gameState === 'solved' && !showReplay) {
      const mins = Math.floor(game.elapsedTime / 60)
      const secs = game.elapsedTime % 60
      let timeStr = ''
      if (mins > 0) timeStr += `${mins}分`
      timeStr += `${secs}秒`

      showToast({
        title: '太棒了！🎉',
        message: `你用了 ${timeStr} 完成！\n提示: ${game.hintsUsed} 次 | 撤销: ${game.history.length} 步`,
        type: 'success',
        duration: 0,
      })
    }
  }, [game.gameState])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (game.gameState !== 'playing' && game.gameState !== 'failed') return

      if (e.key >= '1' && e.key <= '9') {
        game.setNumber(parseInt(e.key, 10))
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        game.clearCell()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        game.moveSelection('up')
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        game.moveSelection('down')
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        game.moveSelection('left')
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        game.moveSelection('right')
      } else if (e.key === 'Escape') {
        game.selectCell(null, null)
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        game.undo()
      } else if (e.key === 'p' || e.key === 'P') {
        game.togglePencilMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [game])

  const handleNewGame = () => {
    setShowDifficulty(true)
  }

  const handleDifficultySelect = (difficulty) => {
    setShowDifficulty(false)
    game.startNewGame(difficulty)
    setShowReplay(false)
    setIsReplayMode(false)
  }

  const handleCellClick = (row, col) => {
    if (showReplay) return
    game.selectCell(row, col)
  }

  const handleShare = () => {
    setShowShare(true)
  }

  const handleReplayStep = useCallback((stepIndex) => {
    if (!game.initialBoard || !game.moveHistory) return

    const board = cloneBoard(game.initialBoard)
    for (let i = 0; i <= stepIndex && i < game.moveHistory.length; i++) {
      const move = game.moveHistory[i]
      board[move.row][move.col] = move.value
    }
    setReplayBoard(board)
    replayStepRef.current = stepIndex
  }, [game.initialBoard, game.moveHistory])

  const toggleReplay = () => {
    if (showReplay) {
      setShowReplay(false)
      setReplayBoard(null)
    } else {
      setShowReplay(true)
      if (game.initialBoard) {
        setReplayBoard(cloneBoard(game.initialBoard))
      }
    }
  }

  const displayBoard = showReplay && replayBoard ? replayBoard : game.board
  const displayConflicts = showReplay ? new Set() : game.conflicts

  return (
    <div className={`app ${game.gameState === 'solved' ? 'solved' : ''}`}>
      <header className="app-header">
        <h1>数独游戏</h1>
        <p className="subtitle">锻炼大脑，享受解谜的乐趣</p>
      </header>

      <div className="game-container">
        {game.gameState === 'idle' && !showDifficulty && (
          <DifficultySelector onSelect={handleDifficultySelect} />
        )}

        {showDifficulty && (
          <DifficultySelector onSelect={handleDifficultySelect} />
        )}

        {game.board && (
          <>
            <div className="game-info">
              <div className="info-item">
                <span className="info-label">时间</span>
                <span className="info-value">{game.formatTime(game.elapsedTime)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">难度</span>
                <span className={`difficulty-badge difficulty-${game.difficulty}`}>
                  {DIFFICULTY_NAMES[game.difficulty]}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">空格</span>
                <span className="info-value">{game.holes}</span>
              </div>
              <div className="info-item">
                <span className="info-label">提示</span>
                <span className="info-value">{game.hintsUsed}/{game.maxHints}</span>
              </div>
            </div>

            {showReplay && (
              <HistoryReplay
                moveHistory={game.moveHistory}
                initialBoard={game.initialBoard}
                currentStep={replayStepRef.current}
                onReplayStep={handleReplayStep}
                onClose={toggleReplay}
              />
            )}

            <SudokuBoard
              board={displayBoard}
              initialBoard={game.initialBoard}
              notes={game.notes}
              selectedCell={game.selectedCell}
              highlightedCells={game.highlightedCells}
              conflicts={displayConflicts}
              hintCell={game.hintCell}
              gameState={showReplay ? 'replay' : game.gameState}
              onCellClick={handleCellClick}
            />

            {!showReplay && (
              <NumberPad
                onNumberClick={game.setNumber}
                onErase={game.clearCell}
                disabled={game.gameState !== 'playing' && game.gameState !== 'failed'}
              />
            )}

            {!showReplay && (
              <GameControls
                gameState={game.gameState}
                pencilMode={game.pencilMode}
                hintsUsed={game.hintsUsed}
                maxHints={game.maxHints}
                difficulty={game.difficulty}
                onNewGame={handleNewGame}
                onUndo={game.undo}
                onHint={game.useHint}
                onTogglePause={game.togglePause}
                onTogglePencil={game.togglePencilMode}
                onSolve={game.solveBoard}
                onCheck={game.checkBoard}
                onShare={handleShare}
              />
            )}

            {game.gameState === 'solved' && !showReplay && (
              <button className="btn btn-primary" onClick={toggleReplay}>
                查看回放
              </button>
            )}
          </>
        )}
      </div>

      {game.gameState === 'generating' && (
        <GeneratingModal
          progress={game.generationProgress}
          message={game.generationMessage}
        />
      )}

      {showShare && (
        <ShareModal
          shareUrl={game.getShareUrl()}
          replayUrl={game.getReplayUrl()}
          onClose={() => setShowShare(false)}
        />
      )}

      <Celebration active={game.gameState === 'solved'} />

      <Toast toasts={toasts} onClose={removeToast} />
    </div>
  )
}

export default App

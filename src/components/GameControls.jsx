import React from 'react'
import { DIFFICULTY_NAMES } from '../utils/sudokuGenerator.js'

function GameControls({
  gameState,
  pencilMode,
  hintsUsed,
  maxHints,
  difficulty,
  onNewGame,
  onUndo,
  onHint,
  onTogglePause,
  onTogglePencil,
  onSolve,
  onCheck,
  onShare,
}) {
  const canPlay = gameState === 'playing' || gameState === 'failed'

  return (
    <div className="controls">
      <button className="btn btn-primary" onClick={onNewGame}>
        新游戏
      </button>
      {canPlay && (
        <>
          <button
            className="btn"
            onClick={onUndo}
          >
            撤销
          </button>
          <button
            className="btn btn-warning"
            onClick={onHint}
            disabled={hintsUsed >= maxHints}
          >
            提示 ({maxHints - hintsUsed})
          </button>
          <button
            className={`btn btn-pencil ${pencilMode ? 'active' : ''}`}
            onClick={onTogglePencil}
          >
            {pencilMode ? '笔记中' : '笔记'}
          </button>
          <button className="btn btn-success" onClick={onCheck}>
            检查
          </button>
          <button className="btn btn-danger" onClick={onSolve}>
            求解
          </button>
          <button className="btn" onClick={onTogglePause}>
            {gameState === 'paused' ? '继续' : '暂停'}
          </button>
          <button className="btn" onClick={onShare}>
            分享
          </button>
        </>
      )}
    </div>
  )
}

export default GameControls

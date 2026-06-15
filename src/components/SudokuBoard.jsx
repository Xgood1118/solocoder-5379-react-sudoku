import React from 'react'
import SudokuCell from './SudokuCell.jsx'
import { SIZE } from '../utils/sudokuSolver.js'

function SudokuBoard({ board, initialBoard, notes, selectedCell, highlightedCells, conflicts, hintCell, gameState, onCellClick }) {
  const selectedValue = selectedCell && board[selectedCell.row][selectedCell.col]

  return (
    <div className={`sudoku-board ${gameState === 'paused' ? 'paused' : ''}`}>
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const isSelected = selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex
          const isHighlighted = highlightedCells.has(`${rowIndex},${colIndex}`)
          const isConflict = conflicts.has(`${rowIndex},${colIndex}`)
          const isHint = hintCell && hintCell.row === rowIndex && hintCell.col === colIndex
          const isSameNumber = selectedValue && selectedValue !== 0 && cell === selectedValue && !isSelected
          const isInitial = initialBoard[rowIndex][colIndex] !== 0

          return (
            <SudokuCell
              key={`${rowIndex}-${colIndex}`}
              value={cell}
              isInitial={isInitial}
              isSelected={isSelected}
              isHighlighted={isHighlighted}
              isConflict={isConflict}
              isHint={isHint}
              isSameNumber={isSameNumber}
              notes={notes[rowIndex][colIndex]}
              onClick={() => onCellClick(rowIndex, colIndex)}
            />
          )
        })
      )}
    </div>
  )
}

export default SudokuBoard

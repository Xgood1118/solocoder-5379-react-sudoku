import React from 'react'

function SudokuCell({ value, isInitial, isSelected, isHighlighted, isConflict, isHint, isSameNumber, notes, onClick }) {
  const classNames = [
    'sudoku-cell',
    isInitial ? 'initial' : 'user',
    isSelected ? 'selected' : '',
    isHighlighted ? 'highlighted' : '',
    isConflict ? 'conflict' : '',
    isHint ? 'hint' : '',
    isSameNumber ? 'same-number' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={classNames} onClick={onClick}>
      {value !== 0 ? (
        <span className="cell-value">{value}</span>
      ) : notes && notes.length > 0 ? (
        <div className="cell-notes">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <span key={n} className="cell-note">
              {notes.includes(n) ? n : ''}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default SudokuCell

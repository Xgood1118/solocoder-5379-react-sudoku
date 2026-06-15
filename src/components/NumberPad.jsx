import React from 'react'

function NumberPad({ onNumberClick, onErase, disabled }) {
  return (
    <div className="number-pad">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
        <button
          key={num}
          className="number-btn"
          onClick={() => onNumberClick(num)}
          disabled={disabled}
        >
          {num}
        </button>
      ))}
      <button
        className="number-btn erase"
        onClick={onErase}
        disabled={disabled}
      >
        清除
      </button>
    </div>
  )
}

export default NumberPad

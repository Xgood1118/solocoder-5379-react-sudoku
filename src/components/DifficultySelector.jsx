import React from 'react'
import { DIFFICULTY_NAMES } from '../utils/sudokuGenerator.js'

const DIFFICULTY_DESCRIPTIONS = {
  beginner: '45个空格，适合新手入门',
  easy: '50个空格，轻松愉快',
  medium: '55个空格，有些挑战',
  hard: '58个空格，烧脑时刻',
}

function DifficultySelector({ onSelect }) {
  return (
    <div className="difficulty-selector">
      <h2>选择难度</h2>
      <div className="difficulty-options">
        {['beginner', 'easy', 'medium', 'hard'].map(diff => (
          <div
            key={diff}
            className={`difficulty-option difficulty-${diff}`}
            onClick={() => onSelect(diff)}
          >
            <h3>{DIFFICULTY_NAMES[diff]}</h3>
            <p>{DIFFICULTY_DESCRIPTIONS[diff]}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DifficultySelector

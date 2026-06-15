import React from 'react'

function GeneratingModal({ progress, message }) {
  return (
    <div className="generating-overlay">
      <div className="generating-modal">
        <h2>正在生成数独...</h2>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <div className="progress-text">{message || `${Math.round(progress * 100)}%`}</div>
      </div>
    </div>
  )
}

export default GeneratingModal

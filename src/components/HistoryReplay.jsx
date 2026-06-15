import React, { useState, useEffect, useRef } from 'react'

function HistoryReplay({ moveHistory, initialBoard, onClose, onReplayStep }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(500)
  const intervalRef = useRef(null)

  const totalSteps = moveHistory.length

  useEffect(() => {
    if (isPlaying && currentStep < totalSteps) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, speed)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, currentStep, speed, totalSteps])

  useEffect(() => {
    if (onReplayStep) {
      onReplayStep(currentStep)
    }
  }, [currentStep, onReplayStep])

  const handlePlayPause = () => {
    if (currentStep >= totalSteps - 1) {
      setCurrentStep(0)
    }
    setIsPlaying(!isPlaying)
  }

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentStep(prev => Math.min(totalSteps - 1, prev + 1))
  }

  const handleReset = () => {
    setCurrentStep(0)
    setIsPlaying(false)
  }

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed)
  }

  return (
    <div className="replay-controls">
      <button className="btn" onClick={handleReset}>
        ⏮
      </button>
      <button className="btn" onClick={handlePrev} disabled={currentStep === 0}>
        ◀
      </button>
      <button className="btn btn-primary" onClick={handlePlayPause}>
        {isPlaying ? '⏸' : '▶'}
      </button>
      <button className="btn" onClick={handleNext} disabled={currentStep >= totalSteps - 1}>
        ▶
      </button>
      <span style={{ fontSize: '0.85rem', minWidth: '60px', textAlign: 'center' }}>
        {currentStep + 1} / {totalSteps}
      </span>
      <input
        type="range"
        min="0"
        max={totalSteps - 1}
        value={currentStep}
        onChange={(e) => setCurrentStep(parseInt(e.target.value))}
        style={{ flex: 1 }}
      />
      <div className="replay-speed">
        <button
          className={`btn ${speed === 1000 ? 'btn-primary' : ''}`}
          onClick={() => handleSpeedChange(1000)}
        >
          0.5x
        </button>
        <button
          className={`btn ${speed === 500 ? 'btn-primary' : ''}`}
          onClick={() => handleSpeedChange(500)}
        >
          1x
        </button>
        <button
          className={`btn ${speed === 250 ? 'btn-primary' : ''}`}
          onClick={() => handleSpeedChange(250)}
        >
          2x
        </button>
      </div>
      <button className="btn btn-danger" onClick={onClose}>
        关闭回放
      </button>
    </div>
  )
}

export default HistoryReplay

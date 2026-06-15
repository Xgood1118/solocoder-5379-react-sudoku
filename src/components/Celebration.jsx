import React, { useEffect, useState } from 'react'

function Celebration({ active, onComplete }) {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (active) {
      const newParticles = []
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7dc6f', '#bb8fce', '#58d68d']
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 2,
          duration: 2 + Math.random() * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 6 + Math.random() * 8,
        })
      }
      setParticles(newParticles)

      const timer = setTimeout(() => {
        if (onComplete) onComplete()
      }, 3000)

      return () => clearTimeout(timer)
    } else {
      setParticles([])
    }
  }, [active, onComplete])

  if (!active) return null

  return (
    <div className="celebration">
      {particles.map(p => (
        <div
          key={p.id}
          className="confetti"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
          }}
        />
      ))}
    </div>
  )
}

export default Celebration

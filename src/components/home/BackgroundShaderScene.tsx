'use client'

import { useEffect, useRef } from 'react'

const chars = '░▒▓'.split('')
const numLines = 100
const numCharsPerLine = 50

declare global {
  interface HTMLCanvasElement {
    drawWidth: number
    drawHeight: number
  }
}

export default function BackgroundShaderScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timeRef = useRef(0)
  const lastTimeRef = useRef(0)
  const linesRef = useRef<Array<{ chars: string[], angle: number, offset: number }>>([])
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) {
      console.warn('Canvas 2D context not supported')
      return
    }

    // Setup for high DPI displays
    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      
      // Set logical size
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      
      // Scale all drawing operations
      ctx.scale(dpr, dpr)
      
      // Set display size
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      
      // Store the actual drawing dimensions
      canvas.drawWidth = rect.width
      canvas.drawHeight = rect.height
    }

    const animate = (time: number) => {
      try {
        if (!ctx || !canvas) return
        
        const deltaTime = (time - lastTimeRef.current) / 1000
        lastTimeRef.current = time
        timeRef.current += deltaTime
        
        // Use the stored drawing dimensions instead of getBoundingClientRect
        const centerX = canvas.drawWidth / 2
        const centerY = canvas.drawHeight / 2
        const radius = Math.min(canvas.drawWidth, canvas.drawHeight) * 0.8

        // Clear the entire canvas using the scaled dimensions
        ctx.clearRect(0, 0, canvas.drawWidth, canvas.drawHeight)
        const maxDistance = radius * 0.6

        ctx.font = '28px monospace'
        ctx.textAlign = 'center'
        
        linesRef.current.forEach((line, i) => {
          const tentacleWave = Math.sin(timeRef.current * 0.5 + line.offset) * 0.2
          const newAngle = line.angle + 0.0002 + Math.sin(timeRef.current * 0.2 + line.offset) * 0.0005

          line.angle = newAngle

          line.chars.forEach((char, j) => {
            const t = j / numCharsPerLine
            const waveAmplitude = 35 * (1 - t * 0.8)
            
            const tentacleOffset = Math.sin(t * 20 + timeRef.current * 1 + i) * 
                                  (radius * 0.15) * t * tentacleWave
            const sineOffset = Math.sin(t * 5 + timeRef.current * 0.5 + i * 0.5) * 
                              waveAmplitude

            const x = centerX + 
                     Math.cos(line.angle) * (radius * t) + 
                     Math.cos(line.angle + Math.PI/2) * tentacleOffset
            const y = centerY + 
                     Math.sin(line.angle) * (radius * t) + 
                     Math.sin(line.angle + Math.PI/2) * tentacleOffset + 
                     sineOffset

            const distance = Math.hypot(x - centerX, y - centerY)
            const opacity = Math.max(0.1, 1 - (distance / maxDistance))
            
            ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`
            ctx.fillText(char, x, y)
          })
        })

        requestAnimationFrame(animate)
      } catch (error) {
        console.error('Animation error:', error)
        cancelAnimationFrame(animationId)
      }
    }

    // Initial setup
    setupCanvas()
    linesRef.current = Array.from({ length: numLines }, (_, i) => ({
      chars: Array.from({ length: numCharsPerLine }, () => 
        chars[Math.floor(Math.random() * chars.length)]
      ),
      angle: (i * Math.PI * 2 / numLines),
      offset: Math.random() * Math.PI * 2
    }))

    const animationId = requestAnimationFrame(animate)
    window.addEventListener('resize', setupCanvas)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', setupCanvas)
    }
  }, [])

  return (
    <div className="animate-shader-appear absolute top-1/2 left-1/2 w-full h-full">
      <canvas 
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full z-0 bg-white"
      />
    </div>
  )
} 
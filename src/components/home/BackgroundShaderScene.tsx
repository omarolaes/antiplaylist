'use client'

import { useEffect, useRef } from 'react'

const chars = '░'.split('')
const numLines = 80
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
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  
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

      // Reset the font after resize since context gets reset
      ctx.font = '8px monospace'
      ctx.textAlign = 'center'
    }

    // Create a resize observer for more reliable size updates
    resizeObserverRef.current = new ResizeObserver((entries) => {
      if (entries[0]) {
        setupCanvas()
      }
    })

    // Observe the canvas element
    resizeObserverRef.current.observe(canvas)

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
        const maxDistance = radius * 0.8

        ctx.font = '8px monospace'
        ctx.textAlign = 'center'
        
        linesRef.current.forEach((line, i) => {
          const tentacleWave = Math.sin(timeRef.current * 0.5 + line.offset) * 0.2
          const newAngle = line.angle + 0.0002 + Math.sin(timeRef.current * 0.2 + line.offset) * 0.0005

          line.angle = newAngle

          line.chars.forEach((char, j) => {
            const t = j / numCharsPerLine
            const waveAmplitude = 10 * (1 - t * 0.8)
            
            const tentacleOffset = Math.sin(t * 20 + timeRef.current * 1 + i) * 
                                  (radius * 0.1) * t * tentacleWave
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
            
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
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
      resizeObserverRef.current?.disconnect()
    }
  }, [])

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <canvas 
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full z-0"
      />
    </div>
  )
} 
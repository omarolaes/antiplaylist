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
  const animationFrameRef = useRef<number>()
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) {
      console.warn('Canvas 2D context not supported')
      return
    }

    // Improved setup for high DPI displays
    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      
      // Store the actual drawing dimensions
      canvas.drawWidth = rect.width
      canvas.drawHeight = rect.height
      
      // Scale all drawing operations
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      
      // Reset the font and text alignment
      ctx.font = '7px monospace'
      ctx.textAlign = 'center'
    }

    // More efficient resize handling
    const handleResize = () => {
      setupCanvas()
    }

    // Create a resize observer with a more efficient callback
    resizeObserverRef.current = new ResizeObserver(() => {
      if (!animationFrameRef.current) {
        handleResize()
      }
    })

    const animate = (time: number) => {
      if (!ctx || !canvas) return

      const deltaTime = time - lastTimeRef.current
      lastTimeRef.current = time
      timeRef.current += deltaTime * 0.001 // Convert to seconds and slow down animation

      // Clear with canvas dimensions
      ctx.clearRect(0, 0, canvas.drawWidth, canvas.drawHeight)

      const centerX = canvas.drawWidth / 2
      const centerY = canvas.drawHeight / 2
      const radius = Math.min(canvas.drawWidth, canvas.drawHeight) * 0.8 // Reduced radius
      const maxDistance = radius * 0.8

      linesRef.current.forEach((line, i) => {
        const tentacleWave = Math.sin(timeRef.current * 0.5 + line.offset) * 0.15 // Reduced wave intensity
        const newAngle = line.angle + 0.0001 + Math.sin(timeRef.current * 0.2 + line.offset) * 0.0003

        line.angle = newAngle

        line.chars.forEach((char, j) => {
          const t = j / numCharsPerLine
          const waveAmplitude = 8 * (1 - t * 0.8) // Reduced amplitude
          
          const tentacleOffset = Math.sin(t * 15 + timeRef.current * 0.8 + i) * 
                                (radius * 0.08) * t * tentacleWave
          const sineOffset = Math.sin(t * 4 + timeRef.current * 0.4 + i * 0.5) * 
                            waveAmplitude

          const x = centerX + 
                   Math.cos(line.angle) * (radius * t) + 
                   Math.cos(line.angle + Math.PI/2) * tentacleOffset
          const y = centerY + 
                   Math.sin(line.angle) * (radius * t) + 
                   Math.sin(line.angle + Math.PI/2) * tentacleOffset + 
                   sineOffset

          const distance = Math.hypot(x - centerX, y - centerY)
          const opacity = Math.max(0.05, 1 - (distance / maxDistance))
          
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
          ctx.fillText(char, x, y)
        })
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // Initial setup
    setupCanvas()
    
    // Initialize lines with fewer characters for better performance
    linesRef.current = Array.from({ length: numLines }, (_, i) => ({
      chars: Array.from({ length: numCharsPerLine }, () => 
        chars[Math.floor(Math.random() * chars.length)]
      ),
      angle: (i * Math.PI * 2 / numLines),
      offset: Math.random() * Math.PI * 2
    }))

    // Start animation
    lastTimeRef.current = performance.now()
    animationFrameRef.current = requestAnimationFrame(animate)

    // Observe canvas
    resizeObserverRef.current.observe(canvas)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      resizeObserverRef.current?.disconnect()
    }
  }, [])

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <canvas 
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full z-0 bg-transparent"
      />
    </div>
  )
} 
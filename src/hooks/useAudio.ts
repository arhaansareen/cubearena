import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseAudioReturn {
  playInspectionCallout: (seconds: '8' | '12') => void
  startAmbient: () => void
  stopAmbient: () => void
  setAmbientVolume: (vol: number) => void
  isAmbientPlaying: boolean
}

export function useAudio(): UseAudioReturn {
  const ctxRef = useRef<AudioContext | null>(null)
  const ambientGainRef = useRef<GainNode | null>(null)
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const filterRef = useRef<BiquadFilterNode | null>(null)
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false)
  const volumeRef = useRef(0.15)

  const getContext = useCallback((): AudioContext => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext()
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {})
    }
    return ctxRef.current
  }, [])

  // Unlock AudioContext on first user gesture so beeps at 8s/12s
  // don't hit a stale-gesture block in Safari / strict Chrome configs.
  useEffect(() => {
    const unlock = () => {
      if (!ctxRef.current) {
        ctxRef.current = new AudioContext()
      }
      if (ctxRef.current.state === 'suspended') {
        ctxRef.current.resume().catch(() => {})
      }
    }
    window.addEventListener('keydown', unlock, { once: true })
    window.addEventListener('touchstart', unlock, { once: true, passive: true })
    window.addEventListener('mousedown', unlock, { once: true })
    return () => {
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('touchstart', unlock)
      window.removeEventListener('mousedown', unlock)
    }
  }, [])

  const playInspectionCallout = useCallback(
    (seconds: '8' | '12') => {
      try {
        const ctx = getContext()
        const frequency = seconds === '8' ? 880 : 1100
        const duration = 0.08

        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)

        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

        gainNode.gain.setValueAtTime(0, ctx.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.005)
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + duration)
      } catch (err) {
        console.warn('[useAudio] playInspectionCallout failed:', err)
      }
    },
    [getContext]
  )

  const buildNoiseBuffer = useCallback((ctx: AudioContext): AudioBuffer => {
    // Create 2 seconds of white noise
    const bufferSize = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }
    }

    return buffer
  }, [])

  const startAmbient = useCallback(() => {
    try {
      const ctx = getContext()

      // Stop existing if playing
      if (noiseSourceRef.current) {
        try {
          noiseSourceRef.current.stop()
        } catch {}
        noiseSourceRef.current = null
      }

      const noiseBuffer = buildNoiseBuffer(ctx)
      const source = ctx.createBufferSource()
      source.buffer = noiseBuffer
      source.loop = true

      // Bandpass filter to simulate crowd noise
      const bandpass = ctx.createBiquadFilter()
      bandpass.type = 'bandpass'
      bandpass.frequency.setValueAtTime(400, ctx.currentTime)
      bandpass.Q.setValueAtTime(0.5, ctx.currentTime)

      // Low-pass to remove harshness
      const lowpass = ctx.createBiquadFilter()
      lowpass.type = 'lowpass'
      lowpass.frequency.setValueAtTime(800, ctx.currentTime)

      const gainNode = ctx.createGain()
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(volumeRef.current, ctx.currentTime + 0.5)

      source.connect(bandpass)
      bandpass.connect(lowpass)
      lowpass.connect(gainNode)
      gainNode.connect(ctx.destination)

      source.start()
      noiseSourceRef.current = source
      ambientGainRef.current = gainNode
      filterRef.current = bandpass
      setIsAmbientPlaying(true)
    } catch (err) {
      console.warn('[useAudio] startAmbient failed:', err)
    }
  }, [getContext, buildNoiseBuffer])

  const stopAmbient = useCallback(() => {
    try {
      const ctx = ctxRef.current
      if (!ctx || !ambientGainRef.current || !noiseSourceRef.current) return

      const gain = ambientGainRef.current
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5)

      const source = noiseSourceRef.current
      setTimeout(() => {
        try {
          source.stop()
        } catch {}
        noiseSourceRef.current = null
        ambientGainRef.current = null
      }, 600)

      setIsAmbientPlaying(false)
    } catch (err) {
      console.warn('[useAudio] stopAmbient failed:', err)
    }
  }, [])

  const setAmbientVolume = useCallback((vol: number) => {
    volumeRef.current = Math.max(0, Math.min(1, vol)) * 0.3 // scale down to safe range
    if (ambientGainRef.current && ctxRef.current) {
      ambientGainRef.current.gain.setValueAtTime(
        volumeRef.current,
        ctxRef.current.currentTime
      )
    }
  }, [])

  useEffect(() => {
    return () => {
      try {
        if (noiseSourceRef.current) {
          noiseSourceRef.current.stop()
        }
        if (ctxRef.current) {
          ctxRef.current.close().catch(() => {})
        }
      } catch {}
    }
  }, [])

  return {
    playInspectionCallout,
    startAmbient,
    stopAmbient,
    setAmbientVolume,
    isAmbientPlaying,
  }
}

import React, { useEffect, useRef } from 'react'
import { useAudioStore } from '@/store/audioStore'

export function GlobalAudioPlayer() {
  const audioRef = useRef(null)
  
  const {
    playlist,
    currentIndex,
    isPlaying,
    playbackRate,
    loopMode,
    sleepTimer,
    setSleepTimer,
    setProgress,
    setDuration,
    next,
    pause
  } = useAudioStore()
  
  const track = playlist[currentIndex]

  // Play/Pause effect
  useEffect(() => {
    if (!audioRef.current) return
    if (isPlaying && track) {
      audioRef.current.play().catch(e => console.error("Playback failed:", e))
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying, track])

  // Track change effect
  useEffect(() => {
    if (!audioRef.current || !track) return
    audioRef.current.src = track.url
    audioRef.current.load()
    if (isPlaying) {
      audioRef.current.play().catch(e => console.error("Playback failed:", e))
    }
    
    // Setup Media Session API
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: 'Deen Quran',
        artwork: track.artwork ? [{ src: track.artwork, sizes: '512x512', type: 'image/png' }] : []
      })
      
      navigator.mediaSession.setActionHandler('play', () => useAudioStore.getState().resume())
      navigator.mediaSession.setActionHandler('pause', () => useAudioStore.getState().pause())
      navigator.mediaSession.setActionHandler('previoustrack', () => useAudioStore.getState().prev())
      navigator.mediaSession.setActionHandler('nexttrack', () => useAudioStore.getState().next())
    }
  }, [track]) // Don't include isPlaying here to avoid reloading on pause/play

  // Playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate
    }
  }, [playbackRate])

  // Event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    if (loopMode === 'track') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play()
      }
    } else {
      next()
    }
  }

  // Seek event listener
  useEffect(() => {
    const handleSeek = (e) => {
      if (audioRef.current && e.detail !== undefined) {
        audioRef.current.currentTime = e.detail
        setProgress(e.detail)
      }
    }
    window.addEventListener('seekAudio', handleSeek)
    return () => window.removeEventListener('seekAudio', handleSeek)
  }, [setProgress])

  // Sleep timer interval
  useEffect(() => {
    if (!sleepTimer) return
    const interval = setInterval(() => {
      if (Date.now() >= sleepTimer) {
        pause()
        setSleepTimer(null)
      }
    }, 10000) // check every 10s
    return () => clearInterval(interval)
  }, [sleepTimer, pause, setSleepTimer])

  return (
    <audio
      ref={audioRef}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onEnded={handleEnded}
      className="hidden"
    />
  )
}

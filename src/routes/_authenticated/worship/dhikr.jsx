import React, { useState, useEffect, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@/components/ui/icon'
import { dhikrApi } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

export const Route = createFileRoute('/_authenticated/worship/dhikr')({
  component: DhikrPage,
})

const DHIKR_PRESETS = [
  { id: 1, arabic: 'سُبْحَانَ ٱللَّٰهِ', transliteration: 'Subhanallah', translation: 'Glory be to Allah', count: 33 },
  { id: 2, arabic: 'ٱلْحَمْدُ لِلَّٰهِ', transliteration: 'Alhamdulillah', translation: 'Praise be to Allah', count: 33 },
  { id: 3, arabic: 'ٱللَّٰهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'Allah is the Greatest', count: 34 },
  { id: 4, arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ', transliteration: 'La ilaha illallah', translation: 'There is no deity but Allah', count: 100 },
]

function DhikrPage() {
  const qc = useQueryClient()
  const [activeDhikr, setActiveDhikr] = useState(DHIKR_PRESETS[0])
  const [count, setCount] = useState(0)
  const [vibrate, setVibrate] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  
  // Create session mutation
  const { mutate: createSession } = useMutation({
    mutationFn: () => dhikrApi.createSession({ dhikr_id: activeDhikr.id, target: activeDhikr.count }),
    onSuccess: (data) => setSessionId(data.id),
  })

  // Complete session mutation
  const { mutate: completeSession } = useMutation({
    mutationFn: (id) => dhikrApi.complete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dhikr', 'history'] })
      toast.success("Dhikr session completed! Alhamdulillah.")
    }
  })
  
  // History query
  const { data: history = [] } = useQuery({
    queryKey: ['dhikr', 'history'],
    queryFn: () => dhikrApi.history(7),
  })

  // Start session on dhikr change
  useEffect(() => {
    setCount(0)
    setSessionId(null)
    // createSession() // Un-comment if a backend actually exists, else it will error.
  }, [activeDhikr])

  const handleTap = () => {
    if (vibrate && navigator.vibrate) {
      navigator.vibrate(50)
    }
    
    const newCount = count + 1
    setCount(newCount)
    
    // Fire confetti when target reached
    if (newCount === activeDhikr.count) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#3b82f6'] // Primary, Gold, Blue
      })
      if (sessionId) completeSession(sessionId)
    }
  }

  const resetCount = () => setCount(0)

  const progress = Math.min((count / activeDhikr.count) * 100, 100)
  
  // Tasbih beads generation
  const beads = Array.from({ length: 33 }).map((_, i) => {
    const angle = (i / 33) * 360
    const isActive = (count % 33) > i
    return (
      <div 
        key={i} 
        className={`absolute w-3 h-3 rounded-full transition-colors duration-300 ${isActive ? 'bg-primary shadow-glow-primary' : 'bg-muted-foreground/30'}`}
        style={{
          transform: `rotate(${angle}deg) translateY(-110px)`,
          transformOrigin: '120px 120px', // Center of the 240x240 circle
          left: '114px',
          top: '114px'
        }}
      />
    )
  })

  return (
    <div className="page-container max-w-lg mx-auto flex flex-col min-h-[calc(100vh-140px)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dhikr</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{count > 0 ? `${count} remembrances` : 'Begin with bismillah'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2.5 rounded-xl transition-all ${showHistory ? 'bg-primary/15 text-primary shadow-inner' : 'bg-muted/60 text-muted-foreground hover:bg-muted'}`}
          >
            <Icon name="history" size={18} />
          </button>
          <button 
            onClick={() => setVibrate(!vibrate)}
            className={`p-2.5 rounded-xl transition-all ${vibrate ? 'bg-primary/15 text-primary shadow-inner' : 'bg-muted/60 text-muted-foreground hover:bg-muted'}`}
          >
            <Icon name={vibrate ? 'smartphone' : 'smartphone'} size={18} />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showHistory ? (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 space-y-4"
          >
            <h2 className="text-lg font-bold">Recent Sessions</h2>
            {history.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">No recent sessions found.</p>
            ) : (
              history.map(session => (
                <Card key={session.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold">{DHIKR_PRESETS.find(p => p.id === session.dhikr_id)?.transliteration || 'Custom'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(session.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="secondary" className="font-black text-xs px-2 py-1">
                    {session.count} / {session.target}
                  </Badge>
                </Card>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="counter"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col"
          >
            {/* Preset selector */}
            <div className="flex overflow-x-auto gap-2.5 pb-4 scrollbar-none mb-4 -mx-4 px-4 md:mx-0 md:px-0">
              {DHIKR_PRESETS.map(preset => (
                <motion.button
                  key={preset.id}
                  onClick={() => setActiveDhikr(preset)}
                  className={`flex-shrink-0 flex flex-col items-start px-4 py-3 rounded-2xl text-left transition-all border ${
                    activeDhikr.id === preset.id 
                      ? 'bg-primary text-primary-foreground shadow-glow-primary border-primary' 
                      : 'bg-card border-border text-foreground hover:border-primary/30 hover:bg-muted/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <span className={`font-amiri text-xl leading-none mb-1 ${activeDhikr.id === preset.id ? 'text-primary-foreground' : 'text-primary'}`} dir="rtl">
                    {preset.arabic.split(' ')[0]}
                  </span>
                  <span className={`text-xs font-bold whitespace-nowrap ${activeDhikr.id === preset.id ? 'text-primary-foreground/90' : 'text-foreground'}`}>
                    {preset.transliteration}
                  </span>
                  <span className={`text-[9px] font-medium mt-0.5 ${activeDhikr.id === preset.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {preset.count}×
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Active Dhikr Display */}
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 mt-4">
              <motion.div 
                key={activeDhikr.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <p className="font-amiri text-5xl md:text-6xl text-foreground leading-loose" dir="rtl">
                  {activeDhikr.arabic}
                </p>
                <p className="text-xl font-medium text-primary">
                  {activeDhikr.transliteration}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activeDhikr.translation}
                </p>
              </motion.div>
            </div>

            {/* Counter Area */}
            <div className="relative mt-auto pt-10 flex flex-col items-center justify-center mb-10">
              <div className="absolute top-0 right-0 flex items-center justify-between w-full px-6 z-10">
                <button onClick={resetCount} className="p-3 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-sm">
                  <Icon name="rotate-ccw" size={24} />
                </button>
              </div>

              {/* Tap Button */}
              <motion.button
                onClick={handleTap}
                className="relative group focus:outline-none select-none touch-manipulation"
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              >
                {/* Tasbih Beads ring */}
                <div className="absolute inset-0 scale-[1.05] -z-10 pointer-events-none">
                   {beads}
                </div>

                {/* Outer glow pulse */}
                {count > 0 && count < activeDhikr.count && (
                  <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping scale-110" />
                )}

                {/* Progress Ring */}
                <svg width="240" height="240" className="-rotate-90 absolute -inset-4 transition-all duration-500">
                  <circle cx="120" cy="120" r="110" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/40" />
                  <circle cx="120" cy="120" r="110" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 110} 
                    strokeDashoffset={2 * Math.PI * 110 - (progress / 100) * (2 * Math.PI * 110)}
                    className="text-primary transition-all duration-500"
                    style={{ filter: 'drop-shadow(0 0 6px var(--color-primary))' }} />
                </svg>

                {/* Button Surface */}
                <div className="w-52 h-52 rounded-full border-[5px] border-card shadow-elevated flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-card to-muted/40">
                  {/* Inner gradient sweep */}
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/8 to-transparent" />
                  {/* Count */}
                  <motion.span
                    key={count}
                    className="text-7xl font-black text-foreground tabular-nums tracking-tighter relative z-10"
                    initial={{ scale: 1.2, opacity: 0.7 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  >
                    {count}
                  </motion.span>
                  <span className="text-xs font-bold text-muted-foreground/70 mt-1.5 uppercase tracking-widest z-10">
                    / {activeDhikr.count}
                  </span>
                  {count === activeDhikr.count && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-b from-primary/20 to-primary/5 rounded-full"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    />
                  )}
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


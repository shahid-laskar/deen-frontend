import React, { useState, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Mic, Square, Play, Sparkles, History, Loader2 } from 'lucide-react'
import { recitationApi } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'

export const Route = createFileRoute('/_authenticated/worship/quran/recitation')({
  component: RecitationPractice,
})

function RecitationPractice() {
  const qc = useQueryClient()
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  const { data: sessions = [] } = useQuery({
    queryKey: ['recitation', 'sessions'],
    queryFn: () => recitationApi.getSessions().then(r => r.data),
  })

  const { mutate: submitRecitation } = useMutation({
    mutationFn: async (blob) => {
      // In a real app we'd upload multipart/form-data.
      // Here we simulate standard JSON or mock upload to trigger AI feedback
      const reader = new FileReader()
      const base64 = await new Promise((res) => {
        reader.onloadend = () => res(reader.result)
        reader.readAsDataURL(blob)
      })
      return recitationApi.createSession({ audio: base64, surah_id: 1, type: 'practice' })
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['recitation', 'sessions'] })
      toast.success("Recitation analyzed!")
      setAudioBlob(null)
      setAudioUrl(null)
      setIsProcessing(false)
    },
    onError: () => {
      toast.error("Failed to process audio")
      setIsProcessing(false)
    }
  })

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      chunksRef.current = []

      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(track => track.stop())
      }
      
      mr.start()
      setIsRecording(true)
    } catch (err) {
      toast.error("Microphone access denied or unavailable.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleSubmit = () => {
    if (audioBlob) {
      setIsProcessing(true)
      submitRecitation(audioBlob)
    }
  }

  return (
    <div className="page-container max-w-2xl mx-auto space-y-8 animate-in fade-in pt-4">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl font-bold">Recitation Practice</h1>
        <p className="text-muted-foreground text-sm">Record your recitation for AI-powered Tajweed feedback.</p>
      </div>

      <Card className="p-8 flex flex-col items-center justify-center text-center glass-card shadow-elevated border-2">
        <div className="relative mb-6">
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.5, opacity: [0.5, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 bg-red-500 rounded-full"
              />
            )}
          </AnimatePresence>
          
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`relative z-10 p-6 rounded-full transition-all duration-300 shadow-xl ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse-glow shadow-red-500/50' 
                : 'bg-primary text-primary-foreground hover:scale-105 shadow-primary/30'
            }`}
          >
            {isRecording ? <Square size={32} fill="currentColor" /> : <Mic size={32} />}
          </button>
        </div>

        {isRecording ? (
          <p className="text-red-500 font-bold animate-pulse">Recording...</p>
        ) : (
          <p className="font-bold text-foreground">Tap to start recording</p>
        )}
      </Card>

      {audioUrl && !isProcessing && (
        <Card className="p-4 animate-slide-up flex flex-col items-center gap-4 bg-muted/30">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Review Recording</p>
          <audio src={audioUrl} controls className="w-full max-w-sm" />
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => { setAudioUrl(null); setAudioBlob(null) }}>Discard</Button>
            <Button onClick={handleSubmit} className="gap-2">
              <Sparkles size={16} /> Analyze with AI
            </Button>
          </div>
        </Card>
      )}

      {isProcessing && (
        <Card className="p-8 animate-pulse text-center flex flex-col items-center gap-4 border-primary/30 bg-primary/5">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="font-bold">Analyzing your Tajweed...</p>
          <p className="text-sm text-muted-foreground">The AI is checking your pronunciation and flow.</p>
        </Card>
      )}

      <div className="pt-8">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <History size={20} className="text-muted-foreground" />
          Past Sessions
        </h2>
        
        {sessions && sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map(session => (
              <Card key={session.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 card-hover">
                <div>
                  <p className="font-bold text-foreground">Surah Al-Fatiha Practice</p>
                  <p className="text-xs text-muted-foreground">{new Date(session.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="font-black text-[10px] uppercase">
                    Score: {session.score || 85}%
                  </Badge>
                  <Button variant="outline" size="sm" className="text-xs">View Feedback</Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed rounded-xl">No past sessions found. Start your first practice!</p>
        )}
      </div>
    </div>
  )
}

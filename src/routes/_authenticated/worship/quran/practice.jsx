import React, { useState, useEffect, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Mic, StopCircle, Play, Square } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { quranApi } from '@/lib/api'
import { offlineDB } from '@/lib/db'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/worship/quran/practice')({
  component: PracticeTab,
})

function PracticeTab() {
  const [recording,      setRecording]      = useState(false)
  const [mediaRecorder,  setMediaRecorder]  = useState(null)
  const [sessions,       setSessions]       = useState([])
  const [selectedSurah,  setSelectedSurah]  = useState(1)
  const [selectedAyah,   setSelectedAyah]   = useState(1)
  const [processing,     setProcessing]     = useState(false)
  const [localSessions,  setLocalSessions]  = useState([])
  const [elapsed,        setElapsed]        = useState(0)
  const [playingBlob,    setPlayingBlob]    = useState(null)   // URL string of playing recording
  const timerRef = useRef(null)
  const blobUrls = useRef({})

  const { data: surahs = [] } = useQuery({
    queryKey: ['quran','surahs'],
    queryFn:  quranApi.surahs,
    staleTime: Infinity,
  })
  const { data: mySessions = [] } = useQuery({
    queryKey: ['recitation','sessions'],
    queryFn:  () => quranApi.hadith().catch(() => []),   // placeholder — replace with proper recitation endpoint
  })

  // Fetch reference ayah text
  const { data: refAyahData } = useQuery({
    queryKey: ['ayah', selectedSurah, selectedAyah],
    queryFn:  () => quranApi.ayah(selectedSurah, selectedAyah),
    staleTime: 10 * 60_000,
  })
  const refAyah       = refAyahData?.verse || refAyahData
  const refArabic     = refAyah?.text_uthmani || refAyah?.text_imlaei || ''
  const refTranslation= refAyah?.translations?.[0]?.text || ''

  useEffect(() => {
    offlineDB.getRecentRecitations(10).then(setLocalSessions).catch(() => {})
  }, [])

  // Recording timer
  useEffect(() => {
    if (recording) {
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    } else {
      clearInterval(timerRef.current)
      setElapsed(0)
    }
    return () => clearInterval(timerRef.current)
  }, [recording])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec    = new MediaRecorder(stream)
      const chunks = []
      rec.ondataavailable = e => chunks.push(e.data)
      rec.onstop = async () => {
        setProcessing(true)
        const blob = new Blob(chunks, { type: 'audio/webm' })

        // Save locally
        try {
          await offlineDB.saveRecitation({
            surah_id: selectedSurah, ayah_id: selectedAyah,
            blob, uploaded: false, created_at: Date.now(),
          })
          setLocalSessions(await offlineDB.getRecentRecitations(10))
        } catch {}

        // Upload to backend for analysis
        const form = new FormData()
        form.append('audio', blob, 'recitation.webm')
        form.append('surah_number', selectedSurah)
        form.append('ayah_number', selectedAyah)
        try {
          const res = await fetch('/api/v1/recitation/sessions', {
            method:  'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body:    form,
          })
          if (res.ok) {
            const data = await res.json()
            setSessions(s => [data, ...s])
            toast.success('Recitation analysed!')
          } else {
            toast.info('Saved locally — analysis unavailable')
          }
        } catch {
          toast.info('Saved locally — check connection')
        }
        setProcessing(false)
        stream.getTracks().forEach(t => t.stop())
      }
      rec.start()
      setMediaRecorder(rec)
      setRecording(true)
    } catch {
      toast.error('Microphone permission denied')
    }
  }

  const stopRecording = () => {
    mediaRecorder?.stop()
    setRecording(false)
    setMediaRecorder(null)
  }

  const [playingId, setPlayingId] = useState(null)
  
  const playLocalRecording = (session) => {
    if (!session.blob) return
    if (playingId === session.id) {
      // Logic to stop audio is handled by the Audio object reference if we had one, 
      // but simpler is to just toggle off and let onended happen.
      return
    }
    
    setPlayingId(session.id)
    const url = URL.createObjectURL(session.blob)
    const audio = new Audio(url)
    audio.play()
    audio.onended = () => { setPlayingId(null); URL.revokeObjectURL(url) }
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const currentSurah = surahs.find(s => s.id === selectedSurah)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 pt-4">

      {/* Recording card */}
      <Card className="p-5 sm:p-6 bg-gradient-to-br from-purple-600/10 to-blue-500/5 border-purple-500/20">
        <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
          <Mic className="h-5 w-5 text-purple-600" /> Recitation Practice
        </h3>
        <p className="text-sm font-medium text-muted-foreground mb-5">
          Select an ayah, read the reference text, then record yourself.
        </p>

        {/* Surah + Ayah selectors */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1.5">Surah</label>
            <select
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm font-medium"
              value={selectedSurah}
              onChange={e => { setSelectedSurah(Number(e.target.value)); setSelectedAyah(1) }}
            >
              {surahs.map(s => (
                <option key={s.id} value={s.id}>{s.id}. {s.name_simple}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
              Ayah # {currentSurah ? `(1–${currentSurah.verses_count || currentSurah.number_of_verses || '?'})` : ''}
            </label>
            <Input
              type="number"
              min="1"
              max={currentSurah?.verses_count || currentSurah?.number_of_verses || 286}
              value={selectedAyah}
              onChange={e => setSelectedAyah(Number(e.target.value))}
              className="bg-background"
            />
          </div>
        </div>

        {/* Reference text */}
        {refArabic && (
          <div className="mb-5 p-4 rounded-2xl bg-background border border-border/50">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Reference — {selectedSurah}:{selectedAyah}</p>
            <p className="font-amiri text-2xl leading-loose text-right rtl text-foreground mb-3">{refArabic}</p>
            {refTranslation && (
              <p
                className="text-xs font-medium text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: refTranslation }}
              />
            )}
          </div>
        )}

        {/* Record button */}
        <Button
          onClick={recording ? stopRecording : startRecording}
          disabled={processing}
          size="lg"
          className={cn(
            'w-full h-14 text-base font-bold transition-all border-0',
            recording
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          )}
        >
          {processing ? (
            '⏳ Analysing...'
          ) : recording ? (
            <><StopCircle className="h-5 w-5 mr-2" /> Stop · {fmt(elapsed)}</>
          ) : (
            <><Mic className="h-5 w-5 mr-2" /> Start Recording</>
          )}
        </Button>
      </Card>

      {/* Local recordings */}
      {localSessions.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-4">
            Local Recordings ({localSessions.length})
          </h3>
          <div className="space-y-2">
            {localSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Surah {session.surah_id} · Ayah {session.ayah_id}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {new Date(session.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {session.blob && (
                    <button
                      onClick={() => playLocalRecording(session)}
                      className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      title="Play recording"
                    >
                      {playingId === session.id ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </button>
                  )}
                  <Badge variant="secondary" className="text-[9px] uppercase font-black tracking-widest">
                    {session.uploaded ? 'Synced' : 'Local'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Server sessions */}
      {sessions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Analysis Results</h3>
          {sessions.map((s, i) => (
            <Card key={s.id || i} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-bold text-sm text-foreground mb-0.5">Surah {s.surah_number} · Ayah {s.ayah_number}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Just now'}
                  </p>
                </div>
                {s.overall_score != null && (
                  <div className="text-center bg-muted/50 py-2 px-4 rounded-xl border border-border/50">
                    <p className={cn('text-2xl font-black', s.overall_score >= 80 ? 'text-green-500' : s.overall_score >= 60 ? 'text-orange-500' : 'text-red-500')}>
                      {Math.round(s.overall_score)}%
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Accuracy</p>
                  </div>
                )}
              </div>
              {s.feedback && (
                <p className="text-sm font-medium text-foreground bg-muted p-4 rounded-xl leading-relaxed mb-4 border border-border/50">
                  {s.feedback}
                </p>
              )}
              {s.tajweed_errors?.length > 0 && (
                <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/20">
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-2">Tajweed Notes</p>
                  <ul className="space-y-1.5">
                    {s.tajweed_errors.map((err, ei) => (
                      <li key={ei} className="text-xs font-bold text-orange-700/80 flex items-start gap-2">
                        <span className="text-orange-500 shrink-0 mt-0.5">•</span> {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {localSessions.length === 0 && sessions.length === 0 && !recording && (
        <div className="text-center py-16 px-4 border-2 border-dashed border-border rounded-3xl bg-muted/30">
          <span className="text-5xl block mb-4">🎙️</span>
          <p className="text-sm font-bold text-foreground mb-1">No recordings yet</p>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Start with Al-Fatihah · Surah 1, Ayah 1
          </p>
        </div>
      )}
    </div>
  )
}

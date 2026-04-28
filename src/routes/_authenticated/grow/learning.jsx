import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Search, CheckCircle2, ChevronRight, BrainCircuit, PlayCircle, FileText } from 'lucide-react'
import api from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/_authenticated/grow/learning')({
  component: LearningPage,
})

function LessonViewer({ lesson, onComplete, onBack }) {
  const [completeLoading, setCompleteLoading] = useState(false)
  const isQuiz = lesson.content_type === 'quiz'

  const handleComplete = async () => {
    setCompleteLoading(true)
    await onComplete(lesson.id)
    setCompleteLoading(false)
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="icon" onClick={onBack} className="h-9 w-9 shrink-0"><ChevronRight className="h-4 w-4 rotate-180" /></Button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{lesson.content_type} <span className="text-primary mx-1">•</span> {lesson.xp_reward} XP</p>
          <h2 className="text-lg font-bold text-foreground leading-tight">{lesson.title}</h2>
        </div>
      </div>

      <Card className="p-5 sm:p-6 overflow-hidden">
        {isQuiz ? (
          <div>
            <div className="flex items-center gap-2 mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <div className="text-purple-600"><BrainCircuit className="h-5 w-5" /></div>
              <h3 className="font-bold text-sm text-purple-700 dark:text-purple-300">Knowledge Check</h3>
            </div>
            {lesson.content_data.questions?.map((q, i) => (
              <div key={i} className="mb-4 p-5 rounded-2xl bg-muted/50 border border-border">
                <p className="font-bold text-sm text-foreground mb-3">Q: {q.Q}</p>
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <p className="font-medium text-sm text-green-700 dark:text-green-300">A: {q.A}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-foreground [&>h1]:text-lg [&>h2]:text-base [&>h3]:text-sm">
            <ReactMarkdown>{lesson.content_data.text || ''}</ReactMarkdown>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border flex justify-center">
          <Button size="lg" className="w-full sm:w-auto font-bold" onClick={handleComplete} disabled={completeLoading}>
            <CheckCircle2 className="h-5 w-5 mr-2" /> Complete & Earn {lesson.xp_reward} XP
          </Button>
        </div>
      </Card>
    </div>
  )
}

function ModuleAccordion({ module, onLessonSelect }) {
  const [open, setOpen] = useState(true)
  const completedCount = module.lessons.filter(l => l.completed).length

  return (
    <div className="mb-4 rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors hover:bg-muted/50">
        <div className="flex-1 pr-4">
          <h4 className="font-bold text-base text-foreground mb-1">{module.title}</h4>
          <p className="text-xs font-medium text-muted-foreground">{module.description}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={cn("text-xs font-black uppercase tracking-wider", completedCount === module.lessons.length ? "text-primary" : "text-muted-foreground")}>
            {completedCount}/{module.lessons.length}
          </span>
          <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", open ? "rotate-90" : "")} />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-2 animate-in slide-in-from-top-2">
          {module.lessons.map(l => (
            <button key={l.id} onClick={() => onLessonSelect(l)}
              className={cn("w-full flex items-center justify-between p-3.5 rounded-xl transition-all border text-left",
                l.completed ? "bg-primary/5 border-primary/20 hover:border-primary/40" : "bg-muted/30 border-transparent hover:border-border hover:bg-muted")}>
              <div className="flex items-center gap-3">
                <div className="shrink-0 flex items-center justify-center">
                  {l.completed ? <CheckCircle2 className="h-4 w-4 text-primary" /> : l.content_type === 'video' ? <PlayCircle className="h-4 w-4 text-blue-500" /> : l.content_type === 'quiz' ? <BrainCircuit className="h-4 w-4 text-purple-500" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                </div>
                <span className={cn("text-sm font-bold transition-all", l.completed ? "text-foreground opacity-60 line-through" : "text-foreground")}>{l.title}</span>
              </div>
              <span className="text-[10px] font-black uppercase text-muted-foreground">+{l.xp_reward} XP</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function VocabReview() {
  const qc = useQueryClient()
  const { data: words = [], isLoading } = useQuery({ queryKey:['learning','vocab'], queryFn:()=>api.get('/learning/vocab/review').then(r=>r.data).catch(()=>[]) })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const { mutate: submitReview } = useMutation({
    mutationFn: (remembered) => api.post(`/learning/vocab/${words[currentIndex].user_vocab_id}/review`, null, { params: { remembered } }),
    onSuccess: () => {
      setShowAnswer(false)
      if (currentIndex < words.length - 1) { setCurrentIndex(i => i + 1) } 
      else { toast.success("Daily vocab review complete!"); qc.invalidateQueries({ queryKey:['learning','vocab'] }) }
    }
  })

  if (isLoading) return <Skeleton className="h-48 rounded-2xl" />
  if (words.length === 0 || currentIndex >= words.length) return (
    <div className="text-center py-16 px-4 border-2 border-dashed border-border rounded-3xl bg-muted/30">
      <span className="text-5xl mb-4 block">🎉</span>
      <h3 className="text-base font-bold text-foreground mb-1">All caught up!</h3>
      <p className="text-sm text-muted-foreground">You've reviewed all your spaced repetition vocabulary for today.</p>
    </div>
  )

  const word = words[currentIndex]

  return (
    <Card className="p-6 text-center animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-8">
        <span>Word {currentIndex + 1} of {words.length}</span>
        <span>Box {word.level}</span>
      </div>

      <p className="font-amiri text-6xl text-foreground mb-8 leading-normal" dir="rtl">{word.arabic}</p>
      
      {!showAnswer ? (
        <Button size="lg" variant="outline" className="w-full font-bold h-14 text-base" onClick={() => setShowAnswer(true)}>Show Answer</Button>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <p className="text-base font-medium text-primary italic mb-2">{word.transliteration}</p>
          <p className="text-2xl font-bold text-foreground mb-8">{word.translation}</p>
          <div className="flex gap-3">
            <Button size="lg" variant="outline" className="flex-1 font-bold h-14 border-red-500/20 text-red-600 hover:bg-red-500/10 hover:text-red-700 hover:border-red-500/30" onClick={() => submitReview(false)}>Forgetting it</Button>
            <Button size="lg" className="flex-1 font-bold h-14 bg-green-600 hover:bg-green-700 text-white" onClick={() => submitReview(true)}>I knew it</Button>
          </div>
        </div>
      )}
    </Card>
  )
}

export default function LearningPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('Courses')
  const [activePathId, setActivePathId] = useState(null)
  const [activeLesson, setActiveLesson] = useState(null)

  const { data: paths = [], isLoading } = useQuery({ queryKey:['learning','paths'], queryFn:()=>api.get('/learning/paths').then(r=>r.data).catch(()=>[]) })
  const { data: pathDetail } = useQuery({ queryKey:['learning','path',activePathId], queryFn:()=>api.get(`/learning/paths/${activePathId}`).then(r=>r.data), enabled: !!activePathId })

  const { mutate: completeLesson } = useMutation({
    mutationFn: async (lessonId) => { const res = await api.post(`/learning/lessons/${lessonId}/complete`); return res.data },
    onSuccess: (data) => {
      if (data.xp_rewarded > 0) toast.success(`+${data.xp_rewarded} XP Earned! 🏆`)
      qc.invalidateQueries({ queryKey:['learning'] })
      qc.invalidateQueries({ queryKey:['gamification'] })
      setActiveLesson(null)
    }
  })

  const { mutate: seed } = useMutation({
    mutationFn: ()=>api.post('/learning/seed'),
    onSuccess: ()=>{ qc.invalidateQueries({ queryKey:['learning'] }); toast.success('Learning Demo content seeded') }
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {!activePathId && !activeLesson && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">Learning Hub <BookOpen className="h-6 w-6 text-primary" /></h1>
              <p className="text-sm font-medium text-muted-foreground mt-0.5">Expand your Islamic knowledge via interactive tracks.</p>
            </div>
          </div>

          <div className="flex p-1 rounded-xl bg-muted gap-1 w-fit">
            {['Courses', 'Vocabulary (SRS)'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={cn('px-4 py-2.5 rounded-lg text-xs font-bold transition-all', tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        {!activePathId && tab === 'Courses' && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            {isLoading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl w-full" />)}
              </div>
            ) : paths.length === 0 ? (
              <div className="text-center py-16 px-4 border-2 border-dashed border-border rounded-3xl bg-muted/30">
                <span className="text-5xl block mb-4">📚</span>
                <p className="text-sm font-medium text-muted-foreground mb-4">No courses available yet.</p>
                <Button onClick={() => seed()} variant="outline">Load Demo Content</Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {paths.map(p => (
                  <button key={p.id} onClick={() => setActivePathId(p.id)} className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border shadow-sm text-left transition-all hover:border-primary/40 group">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition-transform">{p.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-foreground">{p.title}</h3>
                        <Badge variant="secondary" className="text-[9px] uppercase font-black">{p.difficulty}</Badge>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground line-clamp-2">{p.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activePathId && !activeLesson && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="outline" size="icon" onClick={() => setActivePathId(null)} className="h-9 w-9 shrink-0"><ChevronRight className="h-4 w-4 rotate-180" /></Button>
              {!pathDetail ? <Skeleton className="w-32 h-6" /> : <h2 className="text-lg font-bold text-foreground leading-tight">{pathDetail.title}</h2>}
            </div>

            {pathDetail && (
              <>
                <Card className="p-5 mb-6 bg-primary border-primary/20 text-primary-foreground shadow-md flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/70 mb-1">Course Progress</p>
                    <h3 className="text-3xl font-black">{pathDetail.progress_pct}%</h3>
                  </div>
                  <div className="relative w-16 h-16 rounded-full border-4 border-primary-foreground/20 flex items-center justify-center shrink-0">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="28" cy="28" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-primary-foreground transition-all duration-1000 ease-out" strokeDasharray={175.92} strokeDashoffset={175.92 - (175.92 * pathDetail.progress_pct) / 100} />
                    </svg>
                    <CheckCircle2 className="h-5 w-5 opacity-50" />
                  </div>
                </Card>

                <div>
                  {pathDetail.modules.map((m) => <ModuleAccordion key={m.id} module={m} onLessonSelect={(lesson) => setActiveLesson(lesson)} />)}
                </div>
              </>
            )}
          </div>
        )}

        {activeLesson && <LessonViewer key="lesson" lesson={activeLesson} onComplete={completeLesson} onBack={() => setActiveLesson(null)} />}

        {!activePathId && tab === 'Vocabulary (SRS)' && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-foreground">Daily Vocabulary Review</h2>
              <p className="text-sm font-medium text-muted-foreground mt-1">Spaced repetition system for Quranic words.</p>
            </div>
            <VocabReview />
          </div>
        )}
      </div>
    </div>
  )
}

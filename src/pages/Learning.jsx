import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Search, CheckCircle2, ChevronRight, Lock, BrainCircuit, PlayCircle, FileText } from 'lucide-react'
import api from '../lib/api'
import { Card, Button, Skeleton, ProgressRing } from '../components/ui/index'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import { clsx } from 'clsx'

// ─── Lesson Viewer Component ──────────────────────────────────────────────────
function LessonViewer({ lesson, onComplete, onBack }) {
  const [completeLoading, setCompleteLoading] = useState(false)
  const isQuiz = lesson.content_type === 'quiz'

  const handleComplete = async () => {
    setCompleteLoading(true)
    await onComplete(lesson.id)
    setCompleteLoading(false)
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--t-bg-card)', border: '0.5px solid var(--t-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--t-text)' }}>
          <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div>
          <p style={{ fontSize: 11, color: 'var(--t-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{lesson.content_type} · {lesson.xp_reward} XP</p>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t-text)' }}>{lesson.title}</h2>
        </div>
      </div>

      <Card>
        {isQuiz ? (
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
              <div style={{ padding: 8, borderRadius: 10, background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}><BrainCircuit size={20} /></div>
              <h3 style={{ fontWeight: 600, fontSize: 15 }}>Knowledge Check</h3>
            </div>
            {lesson.content_data.questions?.map((q, i) => (
              <div key={i} style={{ marginBottom: 16, padding: '16px', borderRadius: 12, background: 'var(--t-bg)' }}>
                <p style={{ fontWeight: 500, fontSize: 14, color: 'var(--t-text)', marginBottom: 12 }}>Q: {q.Q}</p>
                <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(20,168,96,0.1)', border: '1px solid rgba(20,168,96,0.3)' }}>
                  <p style={{ fontSize: 13, color: 'var(--t-primary)' }}>A: {q.A}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="prose dark:prose-invert max-w-none" style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--t-text)' }}>
            <ReactMarkdown>{lesson.content_data.text || ''}</ReactMarkdown>
          </div>
        )}

        <div style={{ marginTop: 32, paddingTop: 16, borderTop: '0.5px solid var(--t-border)', display: 'flex', justifyContent: 'center' }}>
          <Button variant="primary" onClick={handleComplete} loading={completeLoading} style={{ width: '100%', padding: '14px', fontSize: 15 }}>
            <CheckCircle2 size={18} style={{ marginRight: 8 }} /> Complete & Earn {lesson.xp_reward} XP
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

// ─── Module Accordion Component ───────────────────────────────────────────────
function ModuleAccordion({ module, onLessonSelect }) {
  const [open, setOpen] = useState(true)
  const completedCount = module.lessons.filter(l => l.completed).length

  return (
    <div style={{ marginBottom: 12, borderRadius: 14, background: 'var(--t-bg-card)', border: '1px solid var(--t-border)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ flex: 1, paddingRight: 16 }}>
          <h4 style={{ fontWeight: 700, fontSize: 15, color: 'var(--t-text)', marginBottom: 2 }}>{module.title}</h4>
          <p style={{ fontSize: 12, color: 'var(--t-text-muted)' }}>{module.description}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: completedCount === module.lessons.length ? 'var(--t-primary)' : 'var(--t-text-muted)' }}>
            {completedCount}/{module.lessons.length}
          </span>
          <ChevronRight size={18} style={{ color: 'var(--t-text-muted)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {module.lessons.map(l => (
                <button
                  key={l.id}
                  onClick={() => onLessonSelect(l)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: 10, background: l.completed ? 'rgba(20,168,96,0.06)' : 'var(--t-bg)', border: `1px solid ${l.completed ? 'rgba(20,168,96,0.2)' : 'transparent'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {l.completed ? (
                      <CheckCircle2 size={16} style={{ color: 'var(--t-primary)' }} />
                    ) : l.content_type === 'video' ? (
                      <PlayCircle size={16} style={{ color: '#3b82f6' }} />
                    ) : l.content_type === 'quiz' ? (
                      <BrainCircuit size={16} style={{ color: '#a855f7' }} />
                    ) : (
                      <FileText size={16} style={{ color: 'var(--t-text-muted)' }} />
                    )}
                    <span style={{ fontSize: 13, fontWeight: 500, color: l.completed ? 'var(--t-text)' : 'var(--t-text)', textDecoration: l.completed ? 'line-through' : 'none', opacity: l.completed ? 0.7 : 1 }}>{l.title}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--t-text-muted)', fontWeight: 600 }}>+{l.xp_reward} XP</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── SRS Vocab Component ──────────────────────────────────────────────────────
function VocabReview() {
  const qc = useQueryClient()
  const { data: words = [], isLoading } = useQuery({ queryKey:['learning','vocab'], queryFn:()=>api.get('/learning/vocab/review').then(r=>r.data) })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const { mutate: submitReview } = useMutation({
    mutationFn: (remembered) => api.post(`/learning/vocab/${words[currentIndex].user_vocab_id}/review`, null, { params: { remembered } }),
    onSuccess: () => {
      setShowAnswer(false)
      if (currentIndex < words.length - 1) {
        setCurrentIndex(i => i + 1)
      } else {
        toast.success("Daily vocab review complete!")
        qc.invalidateQueries({ queryKey:['learning','vocab'] })
      }
    }
  })

  if (isLoading) return <Skeleton className="h-48" />
  if (words.length === 0 || currentIndex >= words.length) return (
    <div style={{ textAlign: 'center', padding: '40px 20px', borderRadius: 16, background: 'var(--t-bg-card)', border: '1px solid var(--t-border)' }}>
      <span style={{ fontSize: 40 }}>🎉</span>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: '12px 0 4px 0', color: 'var(--t-text)' }}>All caught up!</h3>
      <p style={{ fontSize: 13, color: 'var(--t-text-muted)' }}>You've reviewed all your spaced repetition vocabulary for today.</p>
    </div>
  )

  const word = words[currentIndex]

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ borderRadius: 16, padding: '24px', background: 'var(--t-bg-card)', border: '1px solid var(--t-border)', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--t-text-muted)', marginBottom: 20 }}>
        <span>Word {currentIndex + 1} of {words.length}</span>
        <span>Box {word.level}</span>
      </div>

      <p style={{ fontFamily: 'Amiri,serif', fontSize: 48, color: 'var(--t-text)', marginBottom: 8, direction: 'rtl' }}>{word.arabic}</p>
      
      {!showAnswer ? (
        <Button variant="outline" onClick={() => setShowAnswer(true)} style={{ marginTop: 24, padding: '12px 32px' }}>Show Answer</Button>
      ) : (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <p style={{ fontSize: 16, color: 'var(--t-accent)', fontStyle: 'italic', marginBottom: 8 }}>{word.transliteration}</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--t-primary)', marginBottom: 24 }}>{word.translation}</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => submitReview(false)} style={{ flex: 1, padding: '14px', borderRadius: 12, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 600, cursor: 'pointer' }}>Forgetting it</button>
            <button onClick={() => submitReview(true)} style={{ flex: 1, padding: '14px', borderRadius: 12, border: 'none', background: 'var(--t-primary)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>I knew it</button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Learning() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('Courses')
  const [activePathId, setActivePathId] = useState(null)
  const [activeLesson, setActiveLesson] = useState(null)

  const { data: paths = [], isLoading } = useQuery({ queryKey:['learning','paths'], queryFn:()=>api.get('/learning/paths').then(r=>r.data) })
  const { data: pathDetail } = useQuery({ queryKey:['learning','path',activePathId], queryFn:()=>api.get(`/learning/paths/${activePathId}`).then(r=>r.data), enabled: !!activePathId })

  const { mutate: completeLesson } = useMutation({
    mutationFn: async (lessonId) => {
      const res = await api.post(`/learning/lessons/${lessonId}/complete`)
      return res.data
    },
    onSuccess: (data) => {
      if (data.xp_rewarded > 0) toast.success(`+${data.xp_rewarded} XP Earned! 🏆`)
      qc.invalidateQueries({ queryKey:['learning'] })
      qc.invalidateQueries({ queryKey:['gamification'] })
      setActiveLesson(null)
    }
  })

  // Seed learning
  const { mutate: seed } = useMutation({
    mutationFn: ()=>api.post('/learning/seed'),
    onSuccess: ()=>{ qc.invalidateQueries({ queryKey:['learning'] }); toast.success('Learning Demo content seeded') }
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 pb-24">
      {/* Header */}
      {!activePathId && !activeLesson && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--t-text)' }}>Learning Hub</h1>
              <p style={{ fontSize: 13, color: 'var(--t-text-muted)', marginTop: 2 }}>Expand your Islamic knowledge</p>
            </div>
            <div style={{ w: 40, h: 40, borderRadius: 12, background: 'rgba(20,168,96,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t-primary)' }}>
              <BookOpen size={20} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 12, background: 'var(--t-bg-card)', border: '0.5px solid var(--t-border)' }}>
            {['Courses', 'Vocabulary (SRS)'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: tab === t ? 'var(--t-primary)' : 'transparent', color: tab === t ? 'white' : 'var(--t-text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>{t}</button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        
        {/* COURSES TAB LISTING */}
        {!activePathId && tab === 'Courses' && (
          <motion.div key="list" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            {paths.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ fontSize: 40 }}>📚</p>
                <p style={{ fontSize: 14, color: 'var(--t-text-muted)', marginTop: 12 }}>No courses available yet.</p>
                <Button variant="primary" onClick={() => seed()} style={{ marginTop: 16 }}>Load Demo Content</Button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {paths.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setActivePathId(p.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px', borderRadius: 16, background: 'var(--t-bg-card)', border: '0.5px solid var(--t-border)', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(20,168,96,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                      {p.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t-text)' }}>{p.title}</h3>
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: 'var(--t-bg)', color: 'var(--t-text-muted)', textTransform: 'uppercase' }}>{p.difficulty}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--t-text-muted)', lineHeight: 1.4 }}>{p.description}</p>
                    </div>
                    <ChevronRight size={20} style={{ color: 'var(--t-text-muted)' }} />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* PATH DETAILS VIEW */}
        {activePathId && !activeLesson && (
          <motion.div key="path" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button onClick={() => setActivePathId(null)} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--t-bg-card)', border: '0.5px solid var(--t-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--t-text)' }}>
                <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
              </button>
              {!pathDetail ? <Skeleton className="w-40 h-6" /> : <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t-text)' }}>{pathDetail.title}</h2>}
            </div>

            {pathDetail && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--t-primary)', borderRadius: 16, padding: '20px', color: 'white', marginBottom: 24 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>Course Progress</p>
                    <h3 style={{ fontSize: 24, fontWeight: 800 }}>{pathDetail.progress_pct}%</h3>
                  </div>
                  <ProgressRing value={pathDetail.progress_pct} max={100} size={70} strokeWidth={6} color="rgba(255,255,255,0.9)">
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{pathDetail.progress_pct}%</span>
                  </ProgressRing>
                </div>

                <div className="space-y-4">
                  {pathDetail.modules.map((m, i) => (
                    <ModuleAccordion key={m.id} module={m} onLessonSelect={(lesson) => setActiveLesson(lesson)} />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* LESSON ENTRY VIEW */}
        {activeLesson && (
          <LessonViewer key="lesson" lesson={activeLesson} onComplete={completeLesson} onBack={() => setActiveLesson(null)} />
        )}

        {/* SRS VOCAB TAB */}
        {!activePathId && tab === 'Vocabulary (SRS)' && (
          <motion.div key="vocab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t-text)' }}>Daily Vocabulary Review</h2>
              <p style={{ fontSize: 13, color: 'var(--t-text-muted)', marginTop: 4 }}>Spaced repetition system for Quranic words.</p>
            </div>
            <VocabReview />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

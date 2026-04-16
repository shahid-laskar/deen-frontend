import { createFileRoute } from '@tanstack/react-router'
import Quran from '@/pages/Quran'

export const Route = createFileRoute('/_authenticated/quran')({
  component: Quran,
})

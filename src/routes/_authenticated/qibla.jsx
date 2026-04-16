import { createFileRoute } from '@tanstack/react-router'
import Qibla from '@/pages/Qibla'

export const Route = createFileRoute('/_authenticated/qibla')({
  component: Qibla,
})

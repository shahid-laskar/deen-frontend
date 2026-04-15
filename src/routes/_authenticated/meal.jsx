import { createFileRoute } from '@tanstack/react-router'
import { Utensils } from 'lucide-react'
import { WipPage } from '@/components/common/WipPage'

export const Route = createFileRoute('/_authenticated/meal')({
  component: () => (
    <WipPage icon={Utensils} title="Meal Planner" phase="Phase 10"
      description="Halal meal planning with nutrition tracking and fasting schedule." />
  ),
})

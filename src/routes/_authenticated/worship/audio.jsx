import React from 'react'
import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/worship/audio')({
  component: AudioHubRedirect,
})

function AudioHubRedirect() {
  // Audio hub features have been integrated into the Quran page
  return <Navigate to="/worship/quran" replace />
}


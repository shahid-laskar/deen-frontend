import React, { useState, useEffect } from 'react'
import { Card } from './card'
import { Button } from './button'
import { Icon } from './icon'

export function InstallPwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      setDeferredPrompt(e)
      // Check if user has already dismissed it
      const dismissed = localStorage.getItem('deen-pwa-dismissed')
      if (!dismissed) {
        setShow(true)
      }
    }
    
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!show || !deferredPrompt) return null

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    }
    setDeferredPrompt(null)
    setShow(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('deen-pwa-dismissed', 'true')
    setShow(false)
  }

  return (
    <Card className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 md:bottom-4 z-50 p-4 bg-primary text-primary-foreground shadow-2xl animate-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between gap-3">
        <Icon name="download" className="h-6 w-6 mt-1 shrink-0" />
        <div className="flex-1">
          <p className="font-bold text-sm">Install Deen App</p>
          <p className="text-xs opacity-90 mt-1">Get offline access, prayer notifications, and a better experience.</p>
        </div>
        <button onClick={handleDismiss} className="p-1 opacity-70 hover:opacity-100 transition-opacity">
          <Icon name="x" className="h-4 w-4" />
        </button>
      </div>
      <Button 
        variant="secondary" 
        className="w-full mt-3 text-xs font-bold"
        onClick={handleInstall}
      >
        Install Now
      </Button>
    </Card>
  )
}

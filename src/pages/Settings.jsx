import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { MapPin, Lock, User, Trash2, Moon, Globe } from 'lucide-react'
import { userApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Card, Button, Input, Select, Toggle } from '../components/ui/index'
import { useAppStore } from '../store/appStore'
import toast from 'react-hot-toast'

const MADHABS = ['hanafi', 'shafii', 'maliki', 'hanbali']
const TIMEZONES = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : []

export default function Settings() {
  const { user, updateUser, logout, isFemale } = useAuthStore()
  const { theme, toggleTheme } = useAppStore()

  const [profileForm, setProfileForm] = useState({
    display_name: user?.profile?.display_name || '',
    quran_daily_goal_minutes: user?.profile?.quran_daily_goal_minutes || 15,
  })

  const [userForm, setUserForm] = useState({
    madhab: user?.madhab || 'hanafi',
    timezone: user?.timezone || 'UTC',
    latitude: user?.latitude || '',
    longitude: user?.longitude || '',
    gender: user?.gender || '',
  })

  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '' })
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)

  const { mutate: saveProfile, isPending: savingProfile } = useMutation({
    mutationFn: () => Promise.all([
      userApi.updateProfile(profileForm),
      userApi.updateMe(userForm),
    ]),
    onSuccess: ([_, userResp]) => {
      updateUser(userResp.data)
      toast.success('Settings saved!')
    },
    onError: () => toast.error('Could not save settings.'),
  })

  const { mutate: changePassword, isPending: changingPwd } = useMutation({
    mutationFn: () => userApi.changePassword(pwdForm),
    onSuccess: () => {
      setPwdForm({ current_password: '', new_password: '' })
      toast.success('Password changed successfully.')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Could not change password.'),
  })

  const { mutate: deleteAccount, isPending: deleting } = useMutation({
    mutationFn: () => userApi.deleteAccount(),
    onSuccess: () => {
      logout()
      toast.success('Account deleted. May Allah bless your journey.')
    },
  })

  const getLocation = () => {
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserForm({ ...userForm, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) })
        setGeoLoading(false)
        toast.success('Location updated!')
      },
      () => {
        setGeoLoading(false)
        toast.error('Could not get location.')
      }
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="page-title mb-6">Settings</h1>

      {/* Profile */}
      <Card className="mb-5">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-emerald-700" />
          <h2 className="section-title text-base">Profile</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Email</label>
            <p className="px-4 py-3 bg-parchment-50 dark:bg-emerald-900/20 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm">{user?.email}</p>
          </div>
          <Input label="Display name" value={profileForm.display_name}
            onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })} />
          <div>
            <label className="label">Quran daily goal (minutes)</label>
            <div className="flex gap-2">
              {[10, 15, 20, 30, 45, 60].map((m) => (
                <button key={m} type="button"
                  onClick={() => setProfileForm({ ...profileForm, quran_daily_goal_minutes: m })}
                  className={`px-3 py-2 rounded-xl text-sm border transition-all ${profileForm.quran_daily_goal_minutes === m ? 'bg-emerald-800 text-white border-emerald-800' : 'border-parchment-300 dark:border-emerald-800 text-parchment-600 dark:text-emerald-500'}`}
                >{m}m</button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Islamic settings */}
      <Card className="mb-5">
        <div className="flex items-center gap-2 mb-5">
          <Globe size={18} className="text-emerald-700" />
          <h2 className="section-title text-base">Islamic & Regional</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">School of thought (Madhab)</label>
            <div className="grid grid-cols-2 gap-2">
              {MADHABS.map((m) => (
                <button key={m} type="button" onClick={() => setUserForm({ ...userForm, madhab: m })}
                  className={`py-3 rounded-xl text-sm font-medium border transition-all capitalize ${userForm.madhab === m ? 'bg-emerald-800 text-white border-emerald-800' : 'border-parchment-300 dark:border-emerald-800 text-parchment-600 dark:text-emerald-500'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Gender</label>
            <div className="grid grid-cols-3 gap-2">
              {[['male', 'Male'], ['female', 'Female'], ['prefer_not_to_say', 'Prefer not']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setUserForm({ ...userForm, gender: v })}
                  className={`py-3 rounded-xl text-sm border transition-all ${userForm.gender === v ? 'bg-emerald-800 text-white border-emerald-800' : 'border-parchment-300 dark:border-emerald-800 text-parchment-600 dark:text-emerald-500'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Timezone</label>
            <select className="input" value={userForm.timezone} onChange={(e) => setUserForm({ ...userForm, timezone: e.target.value })}>
              {TIMEZONES.length > 0
                ? TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)
                : <option value={userForm.timezone}>{userForm.timezone}</option>
              }
            </select>
          </div>
        </div>
      </Card>

      {/* Location */}
      <Card className="mb-5">
        <div className="flex items-center gap-2 mb-5">
          <MapPin size={18} className="text-emerald-700" />
          <h2 className="section-title text-base">Prayer Location</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Latitude" type="number" step="0.0001" value={userForm.latitude}
              onChange={(e) => setUserForm({ ...userForm, latitude: e.target.value })} />
            <Input label="Longitude" type="number" step="0.0001" value={userForm.longitude}
              onChange={(e) => setUserForm({ ...userForm, longitude: e.target.value })} />
          </div>
          <Button variant="outline" onClick={getLocation} loading={geoLoading} className="w-full">
            <MapPin size={14} /> Use my current location
          </Button>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="mb-5">
        <div className="flex items-center gap-2 mb-5">
          <Moon size={18} className="text-emerald-700" />
          <h2 className="section-title text-base">Appearance</h2>
        </div>
        <Toggle
          checked={theme === 'dark'}
          onChange={toggleTheme}
          label={theme === 'dark' ? 'Dark mode (enabled)' : 'Dark mode (disabled)'}
        />
      </Card>

      {/* Save */}
      <Button variant="primary" onClick={() => saveProfile()} loading={savingProfile} className="w-full mb-5">
        Save all settings
      </Button>

      {/* Password */}
      <Card className="mb-5">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={18} className="text-emerald-700" />
          <h2 className="section-title text-base">Change Password</h2>
        </div>
        <div className="space-y-4">
          <Input label="Current password" type="password" value={pwdForm.current_password}
            onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })} />
          <Input label="New password" type="password" placeholder="Min. 8 chars, uppercase, number" value={pwdForm.new_password}
            onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })} />
          <Button variant="secondary" onClick={() => changePassword()} loading={changingPwd} className="w-full">
            Update password
          </Button>
        </div>
      </Card>

      {/* Delete account */}
      <Card className="border-red-200 dark:border-red-900/40">
        <div className="flex items-center gap-2 mb-3">
          <Trash2 size={18} className="text-red-500" />
          <h2 className="font-display font-semibold text-red-600">Danger zone</h2>
        </div>
        <p className="text-sm text-muted mb-4">
          Permanently delete your account and all data. This cannot be undone.
          All your prayers, habits, journal entries, and cycle data will be erased.
        </p>
        {!deleteConfirm ? (
          <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>
            Delete account
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-red-600">Are you absolutely sure? This is irreversible.</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setDeleteConfirm(false)} className="flex-1">Cancel</Button>
              <Button variant="danger" onClick={() => deleteAccount()} loading={deleting} className="flex-1">
                Yes, delete everything
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

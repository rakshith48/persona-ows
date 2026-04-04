import { useState, useEffect, useCallback } from 'react'

interface Profile {
  name: string
  usual_coffee: string
  preferred_coffee_shop: string
  girlfriend: string
  locations: { home: string; work: string }
  delivery_preferences: { food: string; retail: string; pickup: string }
  dietary: string
}

const DEFAULT_PROFILE: Profile = {
  name: '',
  usual_coffee: '',
  preferred_coffee_shop: '',
  girlfriend: '',
  locations: { home: '', work: '' },
  delivery_preferences: {
    food: 'Deliver to home unless calendar event has a different location',
    retail: 'Ship to home',
    pickup: 'Nearest store to current location',
  },
  dietary: 'No restrictions',
}

export function SettingsPage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.persona.getProfile().then((p) => {
      setProfile({ ...DEFAULT_PROFILE, ...(p as unknown as Profile) })
    })
  }, [])

  const handleSave = useCallback(async () => {
    await window.persona.setProfile(profile as unknown as Record<string, unknown>)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [profile])

  const update = (key: string, value: string) => {
    setProfile((p) => ({ ...p, [key]: value }))
  }

  const updateLocation = (key: 'home' | 'work', value: string) => {
    setProfile((p) => ({ ...p, locations: { ...p.locations, [key]: value } }))
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2">
      <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>

      <div className="space-y-4">
        <Section title="Profile">
          <Field label="Name" value={profile.name} onChange={(v) => update('name', v)} />
          <Field label="Usual coffee" value={profile.usual_coffee} onChange={(v) => update('usual_coffee', v)} />
          <Field label="Preferred coffee shop" value={profile.preferred_coffee_shop} onChange={(v) => update('preferred_coffee_shop', v)} />
          <Field label="Dietary restrictions" value={profile.dietary} onChange={(v) => update('dietary', v)} />
        </Section>

        <Section title="Locations">
          <Field label="Home address" value={profile.locations.home} onChange={(v) => updateLocation('home', v)} />
          <Field label="Work address" value={profile.locations.work} onChange={(v) => updateLocation('work', v)} />
        </Section>

        <Section title="Delivery Preferences">
          <Field label="Food delivery" value={profile.delivery_preferences.food} onChange={(v) => setProfile((p) => ({ ...p, delivery_preferences: { ...p.delivery_preferences, food: v } }))} />
          <Field label="Retail shipping" value={profile.delivery_preferences.retail} onChange={(v) => setProfile((p) => ({ ...p, delivery_preferences: { ...p.delivery_preferences, retail: v } }))} />
        </Section>

        <button
          onClick={handleSave}
          className={`w-full py-3 rounded-xl font-medium text-sm transition-colors ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-neutral-800/50 rounded-xl p-4">
      <div className="text-xs text-neutral-500 uppercase tracking-wider mb-3">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="text-xs text-neutral-400 mb-1">{label}</div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="no-drag w-full bg-neutral-800 text-white rounded-lg px-3 py-2 text-sm
                   outline-none focus:ring-1 focus:ring-blue-500/50 placeholder-neutral-600"
      />
    </div>
  )
}

import React from 'react';
import {
  ChevronLeft,
  Moon,
  Bell,
  MapPin,
  Eye,
  Lock,
  Trash2,
} from 'lucide-react';
import { DEFAULT_SETTINGS } from '../hooks/useSettings';
import { storageManager } from '../utils/storageManager';

/**
 * Settings panel view. Displays toggles and options for user preferences.
 *
 * @param {{
 *   settings: object,
 *   onSettingsChange: (settings: object) => void,
 *   onBack: () => void,
 *   onClearData: () => void,
 * }} props
 */
export default function Settings({ settings, onSettingsChange, onBack, onClearData }) {
  const toggle = (key) =>
    onSettingsChange({ ...settings, [key]: !settings[key] });

  const set = (key, value) =>
    onSettingsChange({ ...settings, [key]: value });

  return (
    <div className="flex flex-col h-full bg-[#0A0A0C] text-white overflow-y-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-6 border-b border-gray-800">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-wide">Settings</h1>
      </div>

      <div className="flex-1 px-5 py-6 space-y-2">
        {/* Appearance */}
        <SectionLabel>Appearance</SectionLabel>
        <SettingRow
          icon={<Moon size={20} className="text-[#00E5FF]" aria-hidden="true" />}
          label="Dark Mode"
          description="Use dark theme throughout the app"
        >
          <Toggle
            checked={settings.theme === 'dark'}
            onChange={() =>
              set('theme', settings.theme === 'dark' ? 'light' : 'dark')
            }
          />
        </SettingRow>

        {/* Privacy & Notifications */}
        <SectionLabel>Privacy &amp; Notifications</SectionLabel>
        <SettingRow
          icon={<Bell size={20} className="text-[#00E5FF]" aria-hidden="true" />}
          label="Notifications"
          description="Pod reminders and match alerts"
        >
          <Toggle
            checked={settings.notifications}
            onChange={() => toggle('notifications')}
          />
        </SettingRow>

        <SettingRow
          icon={<MapPin size={20} className="text-[#00E5FF]" aria-hidden="true" />}
          label="Location Sharing"
          description="Share your zip code for pod matching"
        >
          <Toggle
            checked={settings.shareLocation}
            onChange={() => toggle('shareLocation')}
          />
        </SettingRow>

        {/* Visibility */}
        <SectionLabel>Visibility</SectionLabel>
        <SettingRow
          icon={<Eye size={20} className="text-[#00E5FF]" aria-hidden="true" />}
          label="Online Status"
          description="Show others when you're active"
        >
          <SegmentedControl
            options={[
              { value: 'online', label: 'Online' },
              { value: 'offline', label: 'Hidden' },
            ]}
            value={settings.visibility}
            onChange={(v) => set('visibility', v)}
          />
        </SettingRow>

        <SettingRow
          icon={<Lock size={20} className="text-[#00E5FF]" aria-hidden="true" />}
          label="Photo Privacy"
          description="Who can see your photos after exchange"
        >
          <SegmentedControl
            options={[
              { value: 'public', label: 'Public' },
              { value: 'pods_only', label: 'Pods Only' },
            ]}
            value={settings.photoPrivacy}
            onChange={(v) => set('photoPrivacy', v)}
          />
        </SettingRow>

        {/* Data */}
        <SectionLabel>Data</SectionLabel>
        <button
          onClick={onClearData}
          className="w-full flex items-center gap-3 bg-[#1C1C1E] border border-gray-800 rounded-xl px-4 py-4 text-[#FF2D55] hover:bg-[#FF2D55]/10 transition-colors"
        >
          <Trash2 size={20} aria-hidden="true" />
          <span className="font-medium">Clear All App Data</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────── */

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 pt-4 pb-1 px-1">
      {children}
    </p>
  );
}

function SettingRow({ icon, label, description, children }) {
  return (
    <div className="bg-[#1C1C1E] border border-gray-800 rounded-xl px-4 py-4 flex items-center gap-3">
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-white">{label}</p>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-[#00E5FF]' : 'bg-gray-700'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex bg-[#0A0A0C] rounded-lg overflow-hidden border border-gray-800">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            value === opt.value
              ? 'bg-[#00E5FF] text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

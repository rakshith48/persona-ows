export function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-2">
      <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>

      <div className="space-y-4">
        <Section title="API Keys">
          <SettingRow label="Zinc API" value="Not configured" />
          <SettingRow label="Bitrefill" value="Not configured" />
          <SettingRow label="Tempo Wallet" value="Not configured" />
        </Section>

        <Section title="Shipping Address">
          <div className="text-neutral-500 text-xs">
            Set in .env file (SHIPPING_* variables)
          </div>
        </Section>

        <Section title="Preferences">
          <SettingRow label="Voice" value="Coming soon" />
          <SettingRow label="Default retailer" value="Amazon" />
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-neutral-800/50 rounded-xl p-4">
      <div className="text-xs text-neutral-500 uppercase tracking-wider mb-3">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-neutral-300">{label}</span>
      <span className="text-neutral-500">{value}</span>
    </div>
  )
}

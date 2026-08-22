import React, { useState } from 'react';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';
import { ShieldCheck, Save, RefreshCw, BellRing, Globe, Brain, Key, Sliders } from 'lucide-react';

const SectionCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="glass-panel rounded-2xl p-5 flex flex-col gap-5">
    <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="p-2 rounded-lg bg-adcc-accentDim border border-adcc-accentBorder text-adcc-accent">{icon}</div>
      <h3 className="text-[13px] font-bold font-mono uppercase tracking-wider text-adcc-textPrimary">{title}</h3>
    </div>
    {children}
  </div>
);

const SliderRow: React.FC<{ label: string; value: number | string; unit?: string; min: number; max: number; step: number; onChange: (v: number) => void }> =
  ({ label, value, unit = '', min, max, step, onChange }) => (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-[10px] font-mono">
        <span className="text-adcc-textMuted uppercase">{label}</span>
        <span className="text-adcc-accent font-bold">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value as number}
        onChange={e => onChange(parseFloat(e.target.value))} className="w-full" />
    </div>
  );

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; desc: string }> =
  ({ checked, onChange, label, desc }) => (
    <label className="flex items-start gap-3 cursor-pointer select-none pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="mt-0.5" />
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-adcc-textPrimary">{label}</span>
        <span className="text-[10px] font-mono text-adcc-textMuted">{desc}</span>
      </div>
    </label>
  );

export const Settings: React.FC = () => {
  const [pollingRate, setPollingRate] = useState(30);
  const [simSpeed,    setSimSpeed]    = useState(1);
  const [enableGDS,   setEnableGDS]   = useState(true);
  const [enableSMS,   setEnableSMS]   = useState(false);
  const [enableEmail, setEnableEmail] = useState(true);
  const [aiModel,     setAiModel]     = useState('gemini-3.5-pro');
  const [apiKey,      setApiKey]      = useState('');
  const [saveStatus,  setSaveStatus]  = useState<null | 'syncing' | 'saved'>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('syncing');
    setTimeout(() => { setSaveStatus('saved'); setTimeout(() => setSaveStatus(null), 3000); }, 1500);
  };

  return (
    <PageContainer>
      <SectionHeader
        title="Command Settings"
        description="Configure GIS sensor feeds, AI cognitive models, notification integration APIs, and simulator speeds."
      />

      <form onSubmit={handleSave} className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left 2 cols */}
        <div className="xl:col-span-2 flex flex-col gap-6">

          <SectionCard icon={<Globe size={14} />} title="GIS Sensor Stream Settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SliderRow label="Satellite Poll Rate" value={pollingRate} unit="s" min={5} max={300} step={5} onChange={setPollingRate} />
              <SliderRow label="Simulation Speed Index" value={simSpeed} unit="x" min={0.5} max={5} step={0.5} onChange={setSimSpeed} />
            </div>
            <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <Toggle
                checked={enableGDS} onChange={setEnableGDS}
                label="GDACS API Integration"
                desc="Stream global alert data automatically from United Nations nodes."
              />
            </div>
          </SectionCard>

          <SectionCard icon={<Brain size={14} />} title="AI Cognitive Layer Parameters">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono uppercase text-adcc-textMuted tracking-wider">Orchestration Model</label>
                <select value={aiModel} onChange={e => setAiModel(e.target.value)}
                  className="text-[11px] font-mono rounded-xl px-3 py-2.5">
                  <option value="gemini-3.5-pro">Gemini 3.5 Pro (Recommended)</option>
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                  <option value="custom-disaster-llama">Fine-tuned DisasterLlama-70B</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono uppercase text-adcc-textMuted tracking-wider flex items-center gap-1.5">
                  <Key size={10} /> API Auth Token
                </label>
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                  placeholder="Enter API key..."
                  className="text-[11px] font-mono rounded-xl px-3 py-2.5" />
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={<Sliders size={14} />} title="Advanced Pipeline Controls">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px]">
              {[
                { label: 'Max Agent Iterations',    value: '10',    color: 'text-adcc-accent'  },
                { label: 'Confidence Threshold',    value: '0.65',  color: 'text-adcc-success' },
                { label: 'Severity Escalation Gate',value: 'High',  color: 'text-adcc-warning' },
                { label: 'Parallel Fan-out Mode',   value: 'ENABLED', color: 'text-adcc-success' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center bg-adcc-surface2/60 border border-adcc-border px-3.5 py-2.5 rounded-xl">
                  <span className="text-adcc-textMuted uppercase text-[10px]">{label}</span>
                  <span className={`font-bold text-[10px] ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right 1 col */}
        <div className="flex flex-col gap-6">

          <SectionCard icon={<BellRing size={14} />} title="Notification Broadcasters">
            <div className="flex flex-col gap-0">
              <Toggle
                checked={enableSMS} onChange={setEnableSMS}
                label="SMS Responder Broadcasts"
                desc="Dispatches automated cellular messages to NDRF rescue teams."
              />
              <div className="pt-3">
                <Toggle
                  checked={enableEmail} onChange={setEnableEmail}
                  label="Command Center Email Digests"
                  desc="Sends hourly status emails to government relief departments."
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {saveStatus === 'syncing' && (
                <div className="flex items-center justify-center gap-2 p-2.5 bg-adcc-accentDim border border-adcc-accentBorder text-adcc-accent text-[10px] font-mono rounded-xl">
                  <RefreshCw size={11} className="animate-spin" />
                  <span>SYNCHRONIZING CONFIG WITH CLUSTER...</span>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center justify-center gap-2 p-2.5 bg-adcc-success/10 border border-adcc-success/25 text-adcc-success text-[10px] font-mono rounded-xl">
                  <ShieldCheck size={11} />
                  <span>SETTINGS SUCCESSFULLY SYNCHRONIZED</span>
                </div>
              )}
              <button type="submit" disabled={saveStatus === 'syncing'}
                className="w-full flex items-center justify-center gap-2 py-3 bg-adcc-accentDim border border-adcc-accentBorder hover:bg-adcc-accent hover:text-adcc-bg text-[11px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all duration-200 disabled:opacity-50">
                <Save size={13} /> Synchronize Config
              </button>
            </div>
          </SectionCard>

          {/* System info card */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col gap-3">
            <div className="pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-[11px] font-bold font-mono uppercase tracking-wider text-adcc-textPrimary">System Information</h3>
            </div>
            {[
              { label: 'ADCC Version',    value: 'v1.0.0 MVP'       },
              { label: 'Backend',         value: 'FastAPI + Python'  },
              { label: 'AI Engine',       value: 'LangGraph + Gemini'},
              { label: 'Frontend',        value: 'React + Vite + TS' },
              { label: 'Database',        value: 'PostgreSQL / SQLite'},
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-adcc-textMuted uppercase">{label}</span>
                <span className="text-adcc-textSecondary font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>

      </form>
    </PageContainer>
  );
};
export default Settings;

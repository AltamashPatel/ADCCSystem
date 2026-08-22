import React, { useState } from 'react';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { FileSpreadsheet, Calendar, TrendingUp, Clock, Users, Compass } from 'lucide-react';

const TOOLTIP_STYLE = {
  backgroundColor: '#111D35',
  border: '1px solid rgba(0,224,255,0.15)',
  borderRadius: '12px',
  color: '#EEF2FF',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '11px',
};
const LEGEND_STYLE = { fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', paddingTop: '10px' };
const AXIS_PROPS   = { stroke: '#6B7FA3', fontSize: 10, tickLine: false, axisLine: false };

export const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');

  const resolutionData = [
    { month: 'Jan', Cyclones: 45, Wildfires: 30, Floods: 24 },
    { month: 'Feb', Cyclones: 40, Wildfires: 28, Floods: 20 },
    { month: 'Mar', Cyclones: 38, Wildfires: 25, Floods: 18 },
    { month: 'Apr', Cyclones: 32, Wildfires: 22, Floods: 15 },
    { month: 'May', Cyclones: 28, Wildfires: 18, Floods: 12 },
    { month: 'Jun', Cyclones: 24, Wildfires: 15, Floods: 10 },
  ];

  const shelterData = [
    { name: 'Alpha (West)',   Occupancy: 82,  Capacity: 100 },
    { name: 'Beta (Coast)',   Occupancy: 95,  Capacity: 100 },
    { name: 'Gamma (Metro)',  Occupancy: 45,  Capacity: 100 },
    { name: 'Delta (North)',  Occupancy: 62,  Capacity: 100 },
    { name: 'Epsilon (South)',Occupancy: 28,  Capacity: 100 },
  ];

  const pieData = [
    { name: 'Contained',  value: 42,  color: '#00E0FF' },
    { name: 'Active',     value: 12,  color: '#F43F5E' },
    { name: 'Resolved',   value: 145, color: '#10B981' },
  ];

  const kpiCards = [
    { label: 'Mean Response Time (MRT)',    value: '16.3 mins', sub: '−4.2% from prev period', subColor: 'text-adcc-success', icon: TrendingUp, iconBg: 'bg-adcc-success/10 border-adcc-success/20 text-adcc-success' },
    { label: 'Evacuation Dispatch Latency', value: '3.4 mins',  sub: 'Nominal response index',  subColor: 'text-adcc-success', icon: Clock,      iconBg: 'bg-adcc-accentDim border-adcc-accentBorder text-adcc-accent'  },
    { label: 'Shelter Buffer Capacity',     value: '42.8%',     sub: 'High density — Stage 1',  subColor: 'text-adcc-warning', icon: Users,      iconBg: 'bg-adcc-warning/10 border-adcc-warning/20 text-adcc-warning' },
  ];

  return (
    <PageContainer>
      <SectionHeader
        title="Historical Reports & Analytics"
        description="Review multi-agent response latency, structural damage projections, and shelter occupancy indexes."
        actions={
          <div className="flex items-center gap-2">
            <Calendar size={13} className="text-adcc-accent" />
            <select value={timeRange} onChange={e => setTimeRange(e.target.value)}
              className="text-[11px] font-mono rounded-xl px-3 py-2">
              <option value="7d">LAST 7 DAYS</option>
              <option value="30d">LAST 30 DAYS</option>
              <option value="6m">LAST 6 MONTHS</option>
              <option value="1y">LAST 1 YEAR</option>
            </select>
            <button className="flex items-center gap-1.5 px-3.5 py-2 bg-adcc-accentDim border border-adcc-accentBorder hover:bg-adcc-accent hover:text-adcc-bg text-[11px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all duration-200">
              <FileSpreadsheet size={12} /> Export XLS
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpiCards.map(({ label, value, sub, subColor, icon: Icon, iconBg }) => (
          <div key={label} className="glass-panel rounded-2xl p-4 flex items-center gap-4">
            <div className={`p-3 rounded-xl border ${iconBg} shrink-0`}>
              <Icon size={22} />
            </div>
            <div className="flex flex-col font-mono">
              <span className="text-[10px] text-adcc-textMuted uppercase tracking-wider">{label}</span>
              <span className="text-2xl font-bold text-adcc-textPrimary mt-0.5">{value}</span>
              <span className={`text-[9px] mt-0.5 font-bold uppercase ${subColor}`}>{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <div className="xl:col-span-2 glass-panel rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="text-[11px] font-bold font-mono uppercase tracking-wider text-adcc-textPrimary">
              Average Resolution Speed (mins / incident)
            </h3>
            <span className="text-[9px] font-mono text-adcc-accent uppercase font-bold">Optimization Curve</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={resolutionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="month" {...AXIS_PROPS} />
                <YAxis {...AXIS_PROPS} />
                <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ fontSize: '10px' }} />
                <Legend wrapperStyle={LEGEND_STYLE} />
                <Line type="monotone" dataKey="Cyclones" stroke="#F43F5E" strokeWidth={2.5} dot={{ r: 3, fill: '#F43F5E' }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Wildfires" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3, fill: '#F59E0B' }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Floods"   stroke="#00E0FF" strokeWidth={2.5} dot={{ r: 3, fill: '#00E0FF' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
          <div className="pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="text-[11px] font-bold font-mono uppercase tracking-wider text-adcc-textPrimary">
              Crisis Resolution Ratio
            </h3>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={4} dataKey="value">
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 font-mono text-center">
            {pieData.map((d, i) => (
              <div key={i} className="flex flex-col gap-1 items-center p-2 rounded-xl bg-adcc-surface2/50 border border-adcc-border">
                <span className="w-3 h-1.5 rounded-full" style={{ background: d.color }} />
                <span className="text-[9px] text-adcc-textMuted uppercase">{d.name}</span>
                <span className="text-sm font-bold text-adcc-textPrimary">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shelter occupancy chart */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 className="text-[11px] font-bold font-mono uppercase tracking-wider text-adcc-textPrimary flex items-center gap-2">
            <Compass size={13} className="text-adcc-accent animate-pulse" />
            Evacuation Camps Occupancy Status
          </h3>
          <span className="text-[9px] font-mono text-adcc-accent uppercase">Live GIS Telemetry</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shelterData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="name" {...AXIS_PROPS} />
              <YAxis {...AXIS_PROPS} />
              <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ fontSize: '10px' }} />
              <Legend wrapperStyle={LEGEND_STYLE} />
              <Bar dataKey="Occupancy" fill="#F59E0B" radius={[5, 5, 0, 0]} />
              <Bar dataKey="Capacity"  fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </PageContainer>
  );
};
export default Analytics;

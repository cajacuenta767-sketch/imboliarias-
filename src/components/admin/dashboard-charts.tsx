"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tooltipStyle = { borderRadius: 12, border: "1px solid var(--line)", background: "var(--bg-elevated)", fontSize: 12, boxShadow: "var(--shadow-md)" };

export function ActivityChart({ data }: { data: { month: string; propiedades: number; consultas: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0f766e" stopOpacity={0.35} /><stop offset="100%" stopColor="#0f766e" stopOpacity={0} /></linearGradient>
          <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d97706" stopOpacity={0.3} /><stop offset="100%" stopColor="#d97706" stopOpacity={0} /></linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--ink-muted)" }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--ink-muted)" }} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="propiedades" name="Propiedades" stroke="#0f766e" strokeWidth={2.5} fill="url(#gP)" />
        <Area type="monotone" dataKey="consultas" name="Consultas" stroke="#d97706" strokeWidth={2.5} fill="url(#gI)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CityChart({ data }: { data: { city: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="city" width={90} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--ink-soft)" }} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--bg-muted)" }} />
        <Bar dataKey="total" name="Propiedades" fill="#0f766e" radius={[0, 8, 8, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RevenueChart({ data }: { data: { month: string; ingresos: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--ink-muted)" }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--ink-muted)" }} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--bg-muted)" }} formatter={(v) => [`US$${Number(v).toFixed(2)}`, "Ingresos"]} />
        <Bar dataKey="ingresos" fill="#d97706" radius={[8, 8, 0, 0]} barSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

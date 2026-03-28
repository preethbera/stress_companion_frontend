import React, { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, ReferenceArea
} from "recharts";

// --- Pure Helper Functions ---
const formatTime = (timestamp) => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString([], { 
    hour12: false, minute: "2-digit", second: "2-digit" 
  });
};

const getLostTrackingPeriods = (data) => {
  if (!data || data.length === 0) return [];
  const periods = [];
  let currentPeriod = null;

  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    if (d.status === "NO_FACE" || d.score === null || d.prob === null) {
      if (!currentPeriod) {
        const prevTimestamp = i > 0 ? data[i - 1].timestamp : d.timestamp;
        currentPeriod = { start: prevTimestamp, end: d.timestamp };
      } else {
        currentPeriod.end = d.timestamp;
      }
    } else {
      if (currentPeriod) {
        currentPeriod.end = d.timestamp;
        periods.push(currentPeriod);
        currentPeriod = null;
      }
    }
  }
  if (currentPeriod) periods.push(currentPeriod);
  return periods;
};

// --- Pure Chart Component ---
export default function TimeSeriesChart({ data, config, height = 300 }) {
  const lostPeriods = useMemo(() => getLostTrackingPeriods(data), [data]);

  const renderIsolatedPoint = (props) => {
    const { cx, cy, payload, index } = props;
    if (payload.status !== "FACE_DETECTED") return null;

    const prev = data[index - 1];
    const next = data[index + 1];
    const isPrevLost = !prev || prev.status === "NO_FACE";
    const isNextLost = !next || next.status === "NO_FACE";

    if (isPrevLost && isNextLost) {
      return (
        <circle 
          key={`dot-${index}`} 
          cx={cx} cy={cy} r={4} 
          fill={config.stroke} 
          stroke="hsl(var(--background))" 
          strokeWidth={2} 
        />
      );
    }
    return null;
  };

  if (!data || data.length === 0) return null;

  const stripeId = `stripes-${config.gradientId}`;

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={config.fillStart} stopOpacity={0.3} />
              <stop offset="95%" stopColor={config.fillStart} stopOpacity={0} />
            </linearGradient>
            
            <pattern id={stripeId} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="2" height="8" transform="translate(0,0)" fill="currentColor" className="text-muted-foreground opacity-20" />
            </pattern>
          </defs>

          <CartesianGrid strokeDasharray="3 3" className="stroke-muted opacity-40" vertical={false} />
          
          <XAxis 
            dataKey="timestamp" 
            stroke="currentColor" 
            className="text-muted-foreground opacity-60" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={formatTime} 
            minTickGap={50} 
          />
          
          <YAxis 
            stroke="currentColor" 
            className="text-muted-foreground opacity-60" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            domain={config.domain} 
            tickFormatter={(val) => `${config.formatter(val).toFixed(0)}%`} 
          />
          
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--popover))", 
              borderColor: "hsl(var(--border))", 
              color: "hsl(var(--popover-foreground))", 
              borderRadius: "var(--radius)"
            }}
            labelFormatter={formatTime}
            formatter={(value) => {
              if (value === null || value === undefined) return ["User out of frame", "Status"];
              return [`${config.formatter(value).toFixed(1)}%`, "Stress Level"];
            }}
          />
          
          {lostPeriods.map((period, idx) => (
            <ReferenceArea 
              key={idx} 
              x1={period.start} 
              x2={period.end} 
              fill={`url(#${stripeId})`} 
              strokeOpacity={0} 
            />
          ))}

          <ReferenceLine 
            y={config.domain[1] === 1 ? 0.5 : 50} 
            className="stroke-muted-foreground opacity-50" 
            strokeDasharray="4 4" 
          />
          
          <Area 
            type="monotone" 
            dataKey={config.dataKey} 
            stroke={config.stroke} 
            strokeWidth={2.5} 
            fillOpacity={1} 
            fill={`url(#${config.gradientId})`} 
            animationDuration={1500} 
            connectNulls={false} 
            dot={renderIsolatedPoint} 
            activeDot={{ r: 5, fill: config.stroke, stroke: "hsl(var(--background))", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
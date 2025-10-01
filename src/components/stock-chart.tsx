"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Mock data for the chart
const data = [
  { time: "09:00", price: 175.20 },
  { time: "09:30", price: 175.45 },
  { time: "10:00", price: 175.80 },
  { time: "10:30", price: 175.30 },
  { time: "11:00", price: 175.90 },
  { time: "11:30", price: 176.15 },
  { time: "12:00", price: 175.75 },
  { time: "12:30", price: 175.60 },
  { time: "13:00", price: 175.95 },
  { time: "13:30", price: 176.20 },
  { time: "14:00", price: 176.05 },
  { time: "14:30", price: 175.85 },
  { time: "15:00", price: 176.30 },
  { time: "15:30", price: 176.45 },
  { time: "16:00", price: 176.20 },
];

export function StockChart() {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="time" 
            axisLine={false}
            tickLine={false}
            className="text-xs"
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            className="text-xs"
            domain={['dataMin - 0.5', 'dataMax + 0.5']}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-card border rounded-lg shadow-lg p-3">
                    <p className="text-sm font-medium">{`Time: ${label}`}</p>
                    <p className="text-sm text-primary">
                      {`Price: $${payload[0].value}`}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

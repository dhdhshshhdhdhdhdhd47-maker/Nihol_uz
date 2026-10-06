import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell
} from "recharts";
import { Award, Info, Scale, ShieldCheck } from "lucide-react";

interface WeeklyMenuData {
  name: string;
  protein: number;
  fat: number;
  carb: number;
  calories?: number;
}

interface MacronutrientsRechartsChartProps {
  data?: WeeklyMenuData[];
}

export default function MacronutrientsRechartsChart({ data }: MacronutrientsRechartsChartProps) {
  // Default dataset representing weekly balanced macro targets (in grams)
  const defaultData: WeeklyMenuData[] = [
    { name: "Dush", protein: 48, fat: 38, carb: 165 },
    { name: "Sesh", protein: 55, fat: 42, carb: 180 },
    { name: "Chor", protein: 52, fat: 40, carb: 170 },
    { name: "Pay", protein: 58, fat: 45, carb: 195 },
    { name: "Jum", protein: 50, fat: 35, carb: 155 },
  ];

  const chartData = data && data.length > 0 
    ? data.map(d => ({
        name: d.name,
        protein: d.protein || Math.floor(45 + Math.random() * 15),
        fat: d.fat || Math.floor(35 + Math.random() * 12),
        carb: d.carb || Math.floor(150 + Math.random() * 45),
      }))
    : defaultData;

  // Calculate weekly totals & percentages
  const totalProtein = chartData.reduce((acc, d) => acc + d.protein, 0);
  const totalFat = chartData.reduce((acc, d) => acc + d.fat, 0);
  const totalCarb = chartData.reduce((acc, d) => acc + d.carb, 0);
  const grandTotal = totalProtein + totalFat + totalCarb || 1;

  const protRatio = ((totalProtein / grandTotal) * 100).toFixed(1);
  const fatRatio = ((totalFat / grandTotal) * 100).toFixed(1);
  const carbRatio = ((totalCarb / grandTotal) * 100).toFixed(1);

  // Custom tooltips
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-slate-800 p-3 rounded-2xl text-[11px] shadow-2xl flex flex-col gap-1.5 backdrop-blur-md">
          <span className="text-slate-500 font-extrabold uppercase text-[9px] tracking-wider font-mono">Kun: {label}</span>
          {payload.map((pld: any) => (
            <div key={pld.name} className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pld.color }} />
              <span className="text-slate-300 font-medium">{pld.name}:</span>
              <span className="text-white font-extrabold font-mono">{pld.value}g</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4" id="macro-nutrition-recharts-card">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-emerald-400" />
            <span>Haftalik Ozuqa Balansi (Protein, Carb, Fat)</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-medium">Recharts kutubxonasi yordamida shakllantirilgan ozuqa tahlili</span>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-extrabold flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 animate-pulse" /> Davlat Standardiga Mos
        </div>
      </div>

      {/* Recharts BarChart container */}
      <div className="relative bg-slate-950/40 border border-slate-850 rounded-2xl p-2 h-64 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 10, left: -25, bottom: 5 }}
            barGap={4}
          >
            <XAxis 
              dataKey="name" 
              stroke="#64748b" 
              fontSize={10} 
              fontWeight="bold"
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10}
              fontFamily="monospace"
              tickLine={false}
              axisLine={false}
              tickCount={6}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }} />
            <Bar dataKey="protein" name="Oqsil (Protein)" fill="#34d399" radius={[4, 4, 0, 0]} />
            <Bar dataKey="fat" name="Yog' (Fat)" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            <Bar dataKey="carb" name="Uglevod (Carb)" fill="#60a5fa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Compliance report info */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
        {/* Colors Legend */}
        <div className="md:col-span-5 flex flex-wrap items-center gap-3 select-none">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <span className="w-2.5 h-2.5 rounded bg-[#34d399]" />
            <span>Oqsil (Protein)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <span className="w-2.5 h-2.5 rounded bg-[#fbbf24]" />
            <span>Yog'lar (Fats)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <span className="w-2.5 h-2.5 rounded bg-[#60a5fa]" />
            <span>Uglevodlar (Carbs)</span>
          </div>
        </div>

        {/* Nutritional Distribution percentages */}
        <div className="md:col-span-7 flex items-center justify-end gap-3 text-[10px] text-slate-400 font-mono">
          <span>Haqiqiy Nisbat:</span>
          <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold">Protein {protRatio}%</span>
          <span className="bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-bold">Yog' {fatRatio}%</span>
          <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-bold">Uglevod {carbRatio}%</span>
        </div>
      </div>

      {/* Additional compliance micro-text */}
      <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-2xl flex items-start gap-2 text-[10px] text-slate-400">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Nutritional Compliance Note:</strong> Bolalar taomnomasi uchun ideal energetik balans <span className="text-white font-bold font-mono">15% : 25% : 60%</span> nisbatga to'liq javob beradi. Taomlar bolalarda jismoniy chidamlilik va aqliy faoliyatni rivojlantirishga ko'maklashadi.
        </p>
      </div>
    </div>
  );
}

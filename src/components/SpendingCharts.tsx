import React, { useMemo, useState } from 'react';
import {
  formatCurrency,
  getDaysInMonth,
  getLastNMonths,
  getMonthKey,
  getMonthLabel,
  shiftMonthKey,
} from '../data/seedData';
import { Category, Expense } from '../types/budget';

export type ChartMode = 'trend' | 'stacked' | 'pace';

interface MonthlySpendingChartProps {
  expenses: Expense[];
  categories: Category[];
  selectedMonth: string;
  monthlyBudget: number;
  mode: ChartMode;
  onSelectMonth: (monthKey: string) => void;
}

export const MonthlySpendingChart: React.FC<MonthlySpendingChartProps> = ({
  expenses,
  categories,
  selectedMonth,
  monthlyBudget,
  mode,
  onSelectMonth,
}) => {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const months = useMemo(() => getLastNMonths(selectedMonth, 6), [selectedMonth]);

  const monthData = useMemo(() => {
    return months.map((m) => {
      const mExpenses = expenses.filter((e) => getMonthKey(e.date) === m);
      const total = mExpenses.reduce((sum, e) => sum + e.amount, 0);
      const byCategory: Record<string, number> = {};
      categories.forEach((c) => {
        byCategory[c.id] = 0;
      });
      mExpenses.forEach((e) => {
        byCategory[e.categoryId] = (byCategory[e.categoryId] ?? 0) + e.amount;
      });
      return {
        monthKey: m,
        label: getMonthLabel(m, true),
        fullLabel: getMonthLabel(m, false),
        total,
        count: mExpenses.length,
        byCategory,
      };
    });
  }, [months, expenses, categories]);

  const prevMonthKey = useMemo(() => shiftMonthKey(selectedMonth, -1), [selectedMonth]);

  const paceData = useMemo(() => {
    const daysInCurrent = getDaysInMonth(selectedMonth);
    const daysInPrev = getDaysInMonth(prevMonthKey);
    const maxDays = Math.max(daysInCurrent, daysInPrev);

    const currByDay = new Array(maxDays + 1).fill(0);
    const prevByDay = new Array(maxDays + 1).fill(0);

    expenses.forEach((e) => {
      const mk = getMonthKey(e.date);
      const day = Number(e.date.slice(8, 10));
      if (mk === selectedMonth && day >= 1 && day <= maxDays) {
        currByDay[day] += e.amount;
      } else if (mk === prevMonthKey && day >= 1 && day <= maxDays) {
        prevByDay[day] += e.amount;
      }
    });

    const points: {
      day: number;
      currCum: number | null;
      prevCum: number;
      budgetPace: number;
    }[] = [];

    let currAcc = 0;
    let prevAcc = 0;

    // Determine last day with data in selected month if it is the current anchor month (2026-11 -> day 14)
    const currExpenses = expenses.filter((e) => getMonthKey(e.date) === selectedMonth);
    const maxLoggedDayInCurrent =
      selectedMonth === '2026-11'
        ? Math.max(
            14,
            ...currExpenses.map((e) => Number(e.date.slice(8, 10)))
          )
        : daysInCurrent;

    for (let d = 1; d <= daysInCurrent; d++) {
      currAcc += currByDay[d] ?? 0;
      prevAcc += prevByDay[d] ?? 0;
      points.push({
        day: d,
        currCum: d <= maxLoggedDayInCurrent ? currAcc : null,
        prevCum: prevAcc,
        budgetPace: monthlyBudget > 0 ? (monthlyBudget / daysInCurrent) * d : 0,
      });
    }

    return { points, daysInCurrent };
  }, [expenses, selectedMonth, prevMonthKey, monthlyBudget]);

  // Shared SVG dimensions
  const width = 680;
  const height = 270;
  const pad = { top: 20, right: 20, bottom: 38, left: 62 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  if (mode === 'pace') {
    const maxVal = Math.max(
      monthlyBudget * 1.08,
      ...paceData.points.map((p) => Math.max(p.currCum ?? 0, p.prevCum)),
      500
    );
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round((maxVal * t) / 100) * 100);
    const yMax = Math.max(ticks[ticks.length - 1], maxVal);

    const xForDay = (day: number) =>
      pad.left + ((day - 1) / Math.max(paceData.daysInCurrent - 1, 1)) * plotW;
    const yForVal = (val: number) => pad.top + plotH - (val / yMax) * plotH;

    const prevPath = paceData.points
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${xForDay(p.day).toFixed(1)} ${yForVal(p.prevCum).toFixed(1)}`)
      .join(' ');

    const currPoints = paceData.points.filter((p) => p.currCum !== null);
    const currPath = currPoints
      .map(
        (p, idx) =>
          `${idx === 0 ? 'M' : 'L'} ${xForDay(p.day).toFixed(1)} ${yForVal(p.currCum!).toFixed(1)}`
      )
      .join(' ');

    const currAreaPath =
      currPoints.length > 0
        ? `${currPath} L ${xForDay(currPoints[currPoints.length - 1].day).toFixed(1)} ${(
            pad.top + plotH
          ).toFixed(1)} L ${xForDay(currPoints[0].day).toFixed(1)} ${(pad.top + plotH).toFixed(1)} Z`
        : '';

    const activePoint =
      hoveredDay !== null
        ? paceData.points.find((p) => p.day === hoveredDay) ?? null
        : currPoints[currPoints.length - 1] ?? null;

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-2">
              <span className="h-0.5 w-4 bg-emerald-700 inline-block" />
              <span className="font-medium text-slate-900">{getMonthLabel(selectedMonth)}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-0.5 w-4 bg-slate-400 inline-block" />
              <span>{getMonthLabel(prevMonthKey)}</span>
            </span>
            {monthlyBudget > 0 && (
              <span className="inline-flex items-center gap-2">
                <span className="h-0.5 w-4 border-t border-dashed border-slate-500 inline-block" />
                <span>Budget pace</span>
              </span>
            )}
          </div>
          {activePoint && (
            <div className="font-mono tabular-nums text-slate-700">
              Day {activePoint.day}:{' '}
              <span className="font-semibold text-slate-900">
                {activePoint.currCum !== null ? formatCurrency(activePoint.currCum) : '—'}
              </span>
              <span className="text-slate-400"> · Prior: {formatCurrency(activePoint.prevCum)}</span>
            </div>
          )}
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full min-w-[520px] h-auto select-none"
            role="img"
            aria-label={`Cumulative daily spending pace for ${getMonthLabel(selectedMonth)}`}
          >
            {ticks.map((tick, i) => {
              const y = yForVal(tick);
              return (
                <g key={i}>
                  <line
                    x1={pad.left}
                    y1={y}
                    x2={width - pad.right}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                  />
                  <text
                    x={pad.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-400 text-[11px] font-mono tabular-nums"
                  >
                    ₱{tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
                  </text>
                </g>
              );
            })}

            {monthlyBudget > 0 && (
              <line
                x1={xForDay(1)}
                y1={yForVal(0)}
                x2={xForDay(paceData.daysInCurrent)}
                y2={yForVal(monthlyBudget)}
                stroke="#64748B"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
            )}

            <path d={prevPath} fill="none" stroke="#94A3B8" strokeWidth="1.75" />

            {currAreaPath && <path d={currAreaPath} fill="#047857" fillOpacity="0.08" />}
            {currPath && (
              <path d={currPath} fill="none" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
            )}

            {paceData.points.map((p) => {
              if (p.day !== 1 && p.day % 5 !== 0 && p.day !== paceData.daysInCurrent) return null;
              return (
                <text
                  key={p.day}
                  x={xForDay(p.day)}
                  y={height - 12}
                  textAnchor="middle"
                  className="fill-slate-500 text-[11px] font-mono tabular-nums"
                >
                  Day {p.day}
                </text>
              );
            })}

            {activePoint && (
              <g>
                <line
                  x1={xForDay(activePoint.day)}
                  y1={pad.top}
                  x2={xForDay(activePoint.day)}
                  y2={pad.top + plotH}
                  stroke="#CBD5E1"
                  strokeWidth="1"
                />
                {activePoint.currCum !== null && (
                  <circle
                    cx={xForDay(activePoint.day)}
                    cy={yForVal(activePoint.currCum)}
                    r="4.5"
                    fill="#047857"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                )}
              </g>
            )}

            {paceData.points.map((p) => {
              const colW = plotW / paceData.daysInCurrent;
              return (
                <rect
                  key={p.day}
                  x={xForDay(p.day) - colW / 2}
                  y={pad.top}
                  width={colW}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHoveredDay(p.day)}
                  onMouseLeave={() => setHoveredDay(null)}
                />
              );
            })}
          </svg>
        </div>
      </div>
    );
  }

  // Bar Chart ('trend' or 'stacked')
  const maxTotal = Math.max(
    monthlyBudget * 1.12,
    ...monthData.map((d) => d.total * 1.1),
    500
  );
  const stepRaw = maxTotal / 4;
  const step = stepRaw >= 1000 ? Math.ceil(stepRaw / 500) * 500 : Math.ceil(stepRaw / 100) * 100;
  const yMax = step * 4;
  const ticks = [0, step, step * 2, step * 3, step * 4];

  const yForVal = (val: number) => pad.top + plotH - (val / yMax) * plotH;
  const groupW = plotW / monthData.length;
  const barW = Math.min(48, groupW * 0.52);

  const activeDatum =
    monthData.find((d) => d.monthKey === hoveredMonth) ??
    monthData.find((d) => d.monthKey === selectedMonth) ??
    monthData[monthData.length - 1];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          {mode === 'trend' ? (
            <>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-xs bg-emerald-700 inline-block" />
                <span>Selected month</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-xs bg-slate-300 inline-block" />
                <span>Prior months</span>
              </span>
              {monthlyBudget > 0 && (
                <span className="inline-flex items-center gap-2">
                  <span className="h-0.5 w-4 border-t border-dashed border-slate-500 inline-block" />
                  <span>Budget ({formatCurrency(monthlyBudget, false)})</span>
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-500">Click any month bar to inspect that month</span>
          )}
        </div>

        {activeDatum && (
          <div className="font-mono tabular-nums text-slate-700">
            <span className="font-semibold text-slate-900">{activeDatum.fullLabel}</span>
            <span className="text-slate-400"> · </span>
            <span>{formatCurrency(activeDatum.total)}</span>
            <span className="text-slate-400"> · {activeDatum.count} entries</span>
          </div>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[520px] h-auto select-none"
          role="img"
          aria-label="Six-month spending pattern bar chart"
        >
          {ticks.map((tick, i) => {
            const y = yForVal(tick);
            return (
              <g key={i}>
                <line
                  x1={pad.left}
                  y1={y}
                  x2={width - pad.right}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />
                <text
                  x={pad.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px] font-mono tabular-nums"
                >
                  ₱{tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
                </text>
              </g>
            );
          })}

          {monthData.map((d, idx) => {
            const cx = pad.left + groupW * idx + groupW / 2;
            const bx = cx - barW / 2;
            const isSelected = d.monthKey === selectedMonth;
            const isHovered = d.monthKey === hoveredMonth;
            const isOver = monthlyBudget > 0 && d.total > monthlyBudget;

            if (mode === 'trend') {
              const bh = (d.total / yMax) * plotH;
              const by = pad.top + plotH - bh;
              const fill = isSelected
                ? isOver
                  ? '#DC2626'
                  : '#047857'
                : isHovered
                  ? '#475569'
                  : '#CBD5E1';

              return (
                <g
                  key={d.monthKey}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredMonth(d.monthKey)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  onClick={() => onSelectMonth(d.monthKey)}
                >
                  <rect
                    x={bx}
                    y={by}
                    width={barW}
                    height={Math.max(bh, 2)}
                    rx="3"
                    fill={fill}
                    className="transition-colors duration-150"
                  />
                  {d.total > 0 && (
                    <text
                      x={cx}
                      y={by - 6}
                      textAnchor="middle"
                      className={`text-[10px] font-mono tabular-nums ${
                        isSelected ? 'fill-slate-900 font-semibold' : 'fill-slate-500'
                      }`}
                    >
                      {formatCurrency(d.total, false)}
                    </text>
                  )}
                  <text
                    x={cx}
                    y={height - 12}
                    textAnchor="middle"
                    className={`text-[11px] ${
                      isSelected ? 'fill-slate-900 font-semibold' : 'fill-slate-500'
                    }`}
                  >
                    {d.label}
                  </text>
                </g>
              );
            }

            // Stacked category mode
            let yCursor = pad.top + plotH;
            return (
              <g
                key={d.monthKey}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredMonth(d.monthKey)}
                onMouseLeave={() => setHoveredMonth(null)}
                onClick={() => onSelectMonth(d.monthKey)}
              >
                {isSelected && (
                  <rect
                    x={bx - 3}
                    y={pad.top}
                    width={barW + 6}
                    height={plotH}
                    rx="4"
                    fill="#F1F5F9"
                  />
                )}
                {categories.map((cat) => {
                  const val = d.byCategory[cat.id] ?? 0;
                  if (val <= 0) return null;
                  const segH = (val / yMax) * plotH;
                  yCursor -= segH;
                  return (
                    <rect
                      key={cat.id}
                      x={bx}
                      y={yCursor}
                      width={barW}
                      height={Math.max(segH, 1)}
                      fill={cat.color}
                      fillOpacity={hoveredMonth && !isHovered ? 0.55 : 0.92}
                    />
                  );
                })}
                {d.total > 0 && (
                  <text
                    x={cx}
                    y={yCursor - 6}
                    textAnchor="middle"
                    className={`text-[10px] font-mono tabular-nums ${
                      isSelected ? 'fill-slate-900 font-semibold' : 'fill-slate-500'
                    }`}
                  >
                    {formatCurrency(d.total, false)}
                  </text>
                )}
                <text
                  x={cx}
                  y={height - 12}
                  textAnchor="middle"
                  className={`text-[11px] ${
                    isSelected ? 'fill-slate-900 font-semibold' : 'fill-slate-500'
                  }`}
                >
                  {d.label}
                </text>
              </g>
            );
          })}

          {monthlyBudget > 0 && monthlyBudget <= yMax && (
            <line
              x1={pad.left}
              y1={yForVal(monthlyBudget)}
              x2={width - pad.right}
              y2={yForVal(monthlyBudget)}
              stroke="#475569"
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
          )}
        </svg>
      </div>
    </div>
  );
};

interface CategoryDonutChartProps {
  items: {
    category: Category;
    spent: number;
    share: number;
  }[];
  totalSpent: number;
  hoveredCategoryId: string | null;
  onHoverCategory: (id: string | null) => void;
  onClickCategory: (id: string) => void;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  items,
  totalSpent,
  hoveredCategoryId,
  onHoverCategory,
  onClickCategory,
}) => {
  const size = 184;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const nonZero = items.filter((i) => i.spent > 0);
  const hoveredItem = nonZero.find((i) => i.category.id === hoveredCategoryId) ?? null;

  let cumulativeOffset = 0;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="select-none"
        role="img"
        aria-label="Category spending distribution"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth={strokeWidth}
        />
        {nonZero.map((item) => {
          const segLength = (item.spent / Math.max(totalSpent, 1)) * circumference;
          const dashArray = `${Math.max(segLength - 1.5, 1)} ${circumference}`;
          const dashOffset = -cumulativeOffset;
          cumulativeOffset += segLength;

          const isDimmed = hoveredCategoryId !== null && hoveredCategoryId !== item.category.id;

          return (
            <circle
              key={item.category.id}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.category.color}
              strokeWidth={hoveredCategoryId === item.category.id ? strokeWidth + 3 : strokeWidth}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              opacity={isDimmed ? 0.35 : 1}
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => onHoverCategory(item.category.id)}
              onMouseLeave={() => onHoverCategory(null)}
              onClick={() => onClickCategory(item.category.id)}
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-6">
        <span className="text-[11px] font-medium text-slate-500 truncate max-w-[110px]">
          {hoveredItem ? hoveredItem.category.name : 'Total Spent'}
        </span>
        <span className="font-mono text-lg font-semibold text-slate-900 tabular-nums mt-0.5">
          {formatCurrency(hoveredItem ? hoveredItem.spent : totalSpent, false)}
        </span>
        <span className="text-[11px] font-mono text-slate-500 tabular-nums">
          {hoveredItem ? `${Math.round(hoveredItem.share * 100)}%` : `${nonZero.length} categories`}
        </span>
      </div>
    </div>
  );
};

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export const CATEGORY_COLOR_TOKENS = ['--color-cat-1', '--color-cat-2', '--color-cat-3', '--color-cat-4', '--color-cat-5', '--color-cat-6'];

const getToken = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const formatAmount = (value) => `₹${Number(value).toLocaleString('en-IN')}`;

function chartColors() {
  return {
    border: getToken('--color-border'),
    expense: getToken('--color-expense'),
    income: getToken('--color-income'),
    surface: getToken('--color-surface'),
    text: getToken('--color-text'),
    muted: getToken('--color-text-muted'),
    category: CATEGORY_COLOR_TOKENS.map(getToken),
  };
}

const commonTooltip = (colors) => ({
  backgroundColor: colors.surface,
  bodyColor: colors.text,
  borderColor: colors.border,
  borderWidth: 1,
  callbacks: { label: (context) => `${context.dataset.label || context.label}: ${formatAmount(context.raw)}` },
  padding: 10,
  titleColor: colors.muted,
});

export function BarChart({ data, theme }) {
  const canvas = useRef(null);
  useEffect(() => {
    const colors = chartColors();
    const chart = new Chart(canvas.current, {
      type: 'bar',
      data: {
        labels: data.map((item) => item.month),
        datasets: [
          { label: 'Income', data: data.map((item) => item.income), backgroundColor: colors.income, borderRadius: 4, borderSkipped: false, maxBarThickness: 28 },
          { label: 'Expenses', data: data.map((item) => item.expense), backgroundColor: colors.expense, borderRadius: 4, borderSkipped: false, maxBarThickness: 28 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { labels: { boxHeight: 8, boxWidth: 8, color: colors.muted, font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true, pointStyle: 'circle' } },
          tooltip: commonTooltip(colors),
        },
        scales: {
          x: { border: { display: false }, grid: { display: false }, ticks: { color: colors.muted, font: { family: 'Inter', size: 11 } } },
          y: { border: { display: false }, grid: { color: colors.border, drawTicks: false }, ticks: { color: colors.muted, font: { family: 'Inter', size: 11 }, padding: 8, callback: (value) => value === 0 ? '₹0' : `₹${Number(value / 1000).toLocaleString('en-IN')}k` } },
        },
      },
    });
    return () => chart.destroy();
  }, [data, theme]);
  return <canvas ref={canvas} />;
}

export function SpendingChart({ items, theme }) {
  const canvas = useRef(null);
  useEffect(() => {
    const colors = chartColors();
    const chart = new Chart(canvas.current, {
      type: 'doughnut',
      data: {
        labels: items.map((item) => item.category),
        datasets: [{ data: items.map((item) => item.amount), backgroundColor: colors.category, borderColor: colors.surface, borderWidth: 3, hoverOffset: 2 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: { legend: { display: false }, tooltip: commonTooltip(colors) },
      },
    });
    return () => chart.destroy();
  }, [items, theme]);
  return <canvas ref={canvas} />;
}

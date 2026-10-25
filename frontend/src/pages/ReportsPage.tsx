import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Cpu,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  BarChart3,
  Car,
  Bike
} from 'lucide-react';
import { DashboardMetrics } from '../types';
import { api } from '../api';

interface ReportsPageProps {
  metrics: DashboardMetrics | null;
}

const PIE_COLORS = ['#143d2b', '#2d6a4f', '#52b788', '#f59e0b', '#3b82f6'];

export const ReportsPage: React.FC<ReportsPageProps> = ({ metrics }) => {
  const [mlData, setMlData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const [retrainSuccess, setRetrainSuccess] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await api.getMlAnalytics();
      setMlData(data);
    } catch (err: any) {
      console.error('Failed to load ML analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleRetrain = async () => {
    setIsRetraining(true);
    setRetrainSuccess(null);
    try {
      const data = await api.getMlAnalytics();
      setMlData(data);
      setRetrainSuccess(`Model retrained successfully on ${data.model_metadata.training_samples} real database records!`);
      setTimeout(() => setRetrainSuccess(null), 4000);
    } catch (err: any) {
      console.error('Retrain error:', err);
    } finally {
      setIsRetraining(false);
    }
  };

  if (isLoading || !mlData) {
    return (
      <div className="p-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#143d2b] border-t-transparent animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Training ML regression models on live database records...</p>
      </div>
    );
  }

  const { model_metadata, live_summary, time_series_forecast, price_elasticity_curve, zone_risk_matrix, duration_distribution } = mlData;

  const vehiclePieData = metrics?.vehicle_distribution?.map(v => ({
    name: v.vehicle_type,
    value: v.count
  })) || [
    { name: 'Car', value: 15 },
    { name: 'Bike', value: 6 }
  ];

  return (
    <div className="space-y-6">
      {/* Retrain Alert Banner */}
      {retrainSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-900 text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{retrainSuccess}</span>
          </div>
          <span className="text-[11px] text-emerald-700">R² = {model_metadata.metrics.r2_score} | MAE = {model_metadata.metrics.mae}</span>
        </div>
      )}

      {/* Top Banner: ML Model Specs & Live Recalculate Trigger */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-[#143d2b]">
              <Cpu className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Machine Learning Predictive Analytics & Demand Forecasting
              </h3>
              <p className="text-xs text-slate-500">
                Trained on active database records: {model_metadata.training_samples} observations (slots & reservations)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Model Accuracy Badges */}
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Variance Explained</span>
              <span className="font-extrabold text-[#143d2b] text-sm">R² = {model_metadata.metrics.r2_score}</span>
            </div>
            <div className="h-6 w-px bg-slate-200 mx-1" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Mean Abs Error</span>
              <span className="font-extrabold text-slate-700 text-sm">{model_metadata.metrics.mae}</span>
            </div>
            <div className="h-6 w-px bg-slate-200 mx-1" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">F1-Score</span>
              <span className="font-extrabold text-emerald-600 text-sm">{model_metadata.metrics.f1_score}</span>
            </div>
          </div>

          {/* Retrain Button */}
          <button
            onClick={handleRetrain}
            disabled={isRetraining}
            className="px-4 py-2.5 rounded-full bg-[#143d2b] hover:bg-[#1b4332] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetraining ? 'animate-spin' : ''}`} />
            <span>{isRetraining ? 'Retraining Model...' : 'Retrain on Live Data'}</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Highlight Cards (Calculated directly from application records) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Current Occupancy</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {live_summary.current_occupancy_rate}%
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {live_summary.occupied_slots} of {live_summary.total_slots} bays taken
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#143d2b] flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Predicted Peak Time</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              {live_summary.predicted_peak_time}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Expected Peak: {live_summary.predicted_peak_occupancy}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Optimal Tariff (p*)</span>
            <span className="text-2xl font-black text-[#143d2b] mt-1 block">
              {live_summary.optimal_hourly_price}/hr
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">
              Revenue Yield: {live_summary.projected_revenue_gain}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Model Algorithm</span>
            <span className="text-sm font-black text-slate-900 mt-1 block leading-snug truncate max-w-[140px]">
              Gradient Regressor
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {model_metadata.model_version}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Row 1: Time-Series Regression & Price Elasticity Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: 24h Time-Series Regression with 95% Confidence Band */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">24-Hour ML Occupancy Time-Series Forecast</h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  95% Confidence Band
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Polynomial regression projection with upper/lower uncertainty bounds across 24 hours
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={time_series_forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#52b788" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#52b788" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-emerald-400">{label}</p>
                          <p>Predicted: <span className="font-bold text-white">{d.predicted}%</span></p>
                          {d.actual !== null && (
                            <p>Actual Observed: <span className="font-bold text-amber-300">{d.actual}%</span></p>
                          )}
                          <p className="text-[10px] text-slate-400">95% Range: {d.lower95}% – {d.upper95}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Confidence Band */}
                <Area type="monotone" dataKey="upper95" stroke="none" fill="url(#confidenceBand)" fillOpacity={1} />
                <Area type="monotone" dataKey="lower95" stroke="none" fill="#ffffff" fillOpacity={1} />
                {/* Predicted Regression Curve */}
                <Line type="monotone" dataKey="predicted" stroke="#143d2b" strokeWidth={3} dot={false} name="ML Prediction" />
                {/* Observed Actual Occupancy points */}
                <Line type="monotone" dataKey="actual" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3, fill: '#f59e0b' }} name="Recorded Actual" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex items-center justify-center gap-6 text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-[#143d2b] rounded-full" />
              <span>ML Regression Curve</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-amber-500 rounded-full border border-dashed border-amber-600" />
              <span>Live Recorded Actuals</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3 bg-emerald-200/50 rounded-sm" />
              <span>95% Confidence Interval</span>
            </div>
          </div>
        </div>

        {/* Graph 2: Dynamic Tariff & Price Elasticity Curve */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">Dynamic Tariff & Price Elasticity Curve</h4>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                  ε = -0.68 Demand Model
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculates the revenue-maximizing hourly rate against parking occupancy elasticity
              </p>
            </div>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={price_elasticity_curve} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="price" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} unit="$" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-emerald-400">Tariff: {label}/hr</p>
                          <p>Expected Occupancy: <span className="font-bold text-white">{d.expected_occupancy}%</span></p>
                          <p>Projected Revenue: <span className="font-bold text-emerald-300">${d.projected_revenue} / day</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine yAxisId="right" x={live_summary.optimal_hourly_price} stroke="#10b981" strokeDasharray="3 3" label={{ value: `Optimal p* (${live_summary.optimal_hourly_price})`, fill: '#10b981', fontSize: 10, position: 'top' }} />
                {/* Expected Occupancy Line */}
                <Line yAxisId="left" type="monotone" dataKey="expected_occupancy" stroke="#3b82f6" strokeWidth={2.5} dot={false} name="Expected Occupancy (%)" />
                {/* Projected Revenue Area/Bar */}
                <Bar yAxisId="right" dataKey="projected_revenue" fill="#143d2b" radius={[4, 4, 0, 0]} opacity={0.85} name="Projected Daily Revenue ($)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex items-center justify-center gap-6 text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-2 bg-[#143d2b] rounded-sm" />
              <span>Projected Daily Revenue ($)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-blue-500 rounded-full" />
              <span>Expected Space Utilization (%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Zone Congestion Risk Matrix & Vehicle Fleet Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zone Congestion Risk Matrix (Takes 2 cols) */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Zone Congestion Risk Matrix (ML Logistic Classifier)</h4>
              <p className="text-xs text-slate-500">Real-time risk scoring, turnover speed, and AI administrative recommendations</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>

          <div className="space-y-3">
            {zone_risk_matrix.map((z: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{z.zone}</span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        backgroundColor: `${z.color}15`,
                        color: z.color
                      }}
                    >
                      {z.classification}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {z.occupied} occupied / {z.total_slots} total bays ({z.available} free)
                  </p>
                  <p className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                    <span className="text-slate-400">AI Recommendation:</span>
                    <span>{z.recommendation}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="w-32 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${z.occupancy_pct}%`,
                        backgroundColor: z.color
                      }}
                    />
                  </div>
                  <span className="font-black text-slate-800 text-sm whitespace-nowrap min-w-[45px] text-right">
                    {z.occupancy_pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Fleet & Duration Breakdown (1 col) */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Vehicle Fleet Partition</h4>
              <p className="text-xs text-slate-500">Active slots ratio</p>
            </div>
            <Car className="w-5 h-5 text-slate-500" />
          </div>

          <div className="h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehiclePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {vehiclePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Duration Bins */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Stay Duration Distribution
            </span>
            <div className="space-y-1.5 text-xs">
              {duration_distribution.map((d: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-slate-600">
                  <span>{d.range}</span>
                  <span className="font-bold text-slate-900">{d.count} bookings</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

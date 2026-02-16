import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import axios from 'axios';

interface HistoricalSession {
  id: number;
  session_id: string;
  created_at: string;
  text: string;
  markers: {
    emotional_intensity: number;
    goal_progress: number;
    risk_score: number;
    primary_themes: string[];
  };
}

const ClientHistory = () => {
  const [data, setData] = useState<HistoricalSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking client ID for demo
    const fetchHistory = async () => {
      try {
        const response = await axios.get('http://localhost:8000/client/client_123/history');
        // Reverse for chronological order (API returns newest first)
        setData(response.data.reverse());
      } catch (error) {
        console.error("Failed to load history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="p-8 text-slate-400 animate-pulse">Loading longitudinal data...</div>;

  return (
    <div className="flex-1 overflow-auto p-8 flex flex-col gap-8">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Avg Emotional Intensity</h3>
          <div className="text-3xl font-black text-slate-900">
            {(data.reduce((acc, curr) => acc + curr.markers.emotional_intensity, 0) / data.length || 0).toFixed(1)}
            <span className="text-sm text-slate-400 font-normal ml-1">/ 10</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Goal Trajectory</h3>
          <div className="text-3xl font-black text-emerald-600 flex items-center gap-2">
            <TrendingUp size={24} />
            {(data.reduce((acc, curr) => acc + curr.markers.goal_progress, 0) / data.length || 0).toFixed(1)}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Risk Alerts</h3>
          <div className="text-3xl font-black text-amber-500 flex items-center gap-2">
            <AlertTriangle size={24} />
            {data.filter(d => d.markers.risk_score > 5).length}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[400px]">
        <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
          <Activity size={16} className="text-emerald-500" />
          Clinical Trajectory (Last {data.length} Sessions)
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="created_at" 
              tickFormatter={(date) => new Date(date).toLocaleDateString()} 
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 10]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontSize: '12px', fontWeight: 600 }}
              labelStyle={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Line 
              type="monotone" 
              dataKey="markers.emotional_intensity" 
              name="Emotional Intensity" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="markers.goal_progress" 
              name="Goal Progress" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="markers.risk_score" 
              name="Risk Level" 
              stroke="#f59e0b" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Session List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-700">Recent Encrypted Sessions</h3>
        {data.map((session) => (
          <div key={session.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between hover:border-slate-300 transition-colors cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                {new Date(session.created_at).getDate()}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Session {session.session_id}</div>
                <div className="text-xs text-slate-400">
                  {session.markers.primary_themes.map(t => `#${t}`).join(', ')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Intensity</div>
                <div className="text-sm font-bold text-blue-600">{session.markers.emotional_intensity}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Progress</div>
                <div className="text-sm font-bold text-emerald-600">{session.markers.goal_progress}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientHistory;

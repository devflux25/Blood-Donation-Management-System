import React, { useEffect, useState } from 'react';
import { 
  Users, CheckCircle2, Database, AlertTriangle, 
  HeartHandshake, PlusCircle, ArrowUpRight, Activity
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area 
} from 'recharts';
import apiClient from '../api/client';
import { DashboardStats } from '../types';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/dashboard/stats');
      setStats(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unable to fetch dashboard metrics from MySQL.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700"></div>
        <span className="ml-3 text-sm text-slate-600">Loading database statistics...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-800">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <h3 className="text-base font-semibold">Backend / Database Connection Error</h3>
        </div>
        <p className="mt-2 text-sm text-red-700">{error || 'Failed to load data.'}</p>
        <button 
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-semibold hover:bg-red-800"
        >
          Retry Fetching
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Administration Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time blood stock levels, voluntary donor records, and hospital demand analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => navigate('/donors')}
            className="inline-flex items-center px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Register Donor
          </button>
          <button 
            onClick={() => navigate('/donations')}
            className="inline-flex items-center px-3 py-2 bg-red-700 text-white rounded-lg text-xs font-medium hover:bg-red-800 shadow-sm transition"
          >
            <HeartHandshake className="w-3.5 h-3.5 mr-1.5 text-white" />
            Record Donation
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Registered Donors</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total_donors}</p>
            <p className="text-xs text-emerald-600 mt-1 font-medium flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {stats.eligible_donors} eligible donors
            </p>
          </div>
          <div className="w-12 h-12 bg-red-50 text-red-700 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Available Blood Units</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.available_units}</p>
            <p className="text-xs text-slate-500 mt-1">Across 8 blood groups</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Pending Requests</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending_requests}</p>
            <p className="text-xs text-amber-600 mt-1 font-medium flex items-center">
              <Activity className="w-3 h-3 mr-1" />
              Urgent hospital orders
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Donations This Month</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.donations_this_month}</p>
            <p className="text-xs text-emerald-600 mt-1 font-medium">Verified completed units</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center">
            <HeartHandshake className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Distribution Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Inventory Units by Blood Group</h2>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
              Cold Store Batches
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.inventory_by_group} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="blood_group" tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#FFF', fontSize: '12px' }}
                  itemStyle={{ color: '#F87171' }}
                />
                <Bar dataKey="units" fill="#B91C2C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Donation Trends */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">6-Month Donation Trends</h2>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
              Trend Metrics
            </span>
          </div>
          <div className="h-64">
            {stats.monthly_trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthly_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B91C2C" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#B91C2C" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#FFF', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="donations" stroke="#B91C2C" strokeWidth={2} fillOpacity={1} fill="url(#colorDonations)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No trend history yet. Record donations to populate this graph.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tables Preview: Recent Donations & Hospital Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Donations */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent Completed Donations</h3>
            <button 
              onClick={() => navigate('/donations')}
              className="text-xs font-semibold text-red-700 hover:text-red-800 flex items-center"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.recent_donations.length > 0 ? (
              stats.recent_donations.map((d) => (
                <div key={d.id} className="px-5 py-3 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div>
                    <p className="font-semibold text-slate-800">{d.donor_name}</p>
                    <p className="text-slate-500">{d.donation_code} • {d.donation_date}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 font-bold rounded bg-red-100 text-red-800">
                      {d.blood_group}
                    </span>
                    <p className="text-slate-500 text-[11px] mt-0.5">{d.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">No donations recorded yet.</div>
            )}
          </div>
        </div>

        {/* Latest Requests */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Active Hospital Requests</h3>
            <button 
              onClick={() => navigate('/requests')}
              className="text-xs font-semibold text-red-700 hover:text-red-800 flex items-center"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.latest_requests.length > 0 ? (
              stats.latest_requests.map((r) => (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div>
                    <p className="font-semibold text-slate-800">{r.hospital_name}</p>
                    <p className="text-slate-500">{r.request_code} • Needed {r.required_date}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 font-bold rounded ${
                      r.urgency === 'Critical' ? 'bg-red-100 text-red-700' :
                      r.urgency === 'Urgent' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {r.blood_group} • {r.units_requested} Units
                    </span>
                    <p className="text-slate-500 text-[11px] mt-0.5">{r.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">No hospital requests found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

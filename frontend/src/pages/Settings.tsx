import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { SystemSetting } from '../types';
import { Save, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatApiError } from '../utils/errorHandler';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/settings');
      setSettings(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key: string, value: string) => {
    if (!isAdmin) {
      setError('Only administrators can modify system settings.');
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      await apiClient.put(`/settings/${key}`, { setting_value: value });
      setSuccess(`Setting '${key}' updated successfully in MySQL!`);
      setTimeout(() => setSuccess(null), 3000);
      fetchSettings();
    } catch (err: any) {
      setError(formatApiError(err, 'Failed to update setting.'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Configuration & Operational Rules</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure real low-stock warning thresholds, deferral donation gaps, and shelf life parameters
        </p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-3 rounded-lg flex items-center">
          <Check className="w-4 h-4 mr-2 text-emerald-600" />
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-lg flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl">
        {loading ? (
          <div className="text-center py-6 text-slate-500 text-sm">Loading configuration rules...</div>
        ) : (
          <div className="space-y-6">
            {settings.map((s) => (
              <div key={s.setting_key} className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 last:border-b-0 last:pb-0 gap-3">
                <div>
                  <label className="font-semibold text-sm text-slate-900 block font-mono">
                    {s.setting_key}
                  </label>
                  <span className="text-xs text-slate-500">{s.description}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    defaultValue={s.setting_value}
                    id={`input-${s.setting_key}`}
                    disabled={!isAdmin}
                    className="w-32 border border-slate-300 rounded px-3 py-1.5 text-sm text-right font-medium focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                  {isAdmin && (
                    <button
                      onClick={() => {
                        const input = document.getElementById(`input-${s.setting_key}`) as HTMLInputElement;
                        if (input) handleUpdate(s.setting_key, input.value);
                      }}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs transition"
                      title="Save Setting"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

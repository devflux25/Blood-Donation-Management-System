import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Download, BarChart2, Building, Clock } from 'lucide-react';

export const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'hospitals' | 'expiring'>('inventory');
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [hospitalData, setHospitalData] = useState<any[]>([]);
  const [expiringData, setExpiringData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [activeTab]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'inventory') {
        const res = await apiClient.get('/reports/inventory-breakdown');
        setInventoryData(res.data);
      } else if (activeTab === 'hospitals') {
        const res = await apiClient.get('/reports/hospital-fulfillment');
        setHospitalData(res.data);
      } else if (activeTab === 'expiring') {
        const res = await apiClient.get('/reports/expiring-soon?days=14');
        setExpiringData(res.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeTab === 'inventory') {
      csvContent += "Blood Group,Component,Status,Units,Earliest Expiry\n";
      inventoryData.forEach(row => {
        csvContent += `${row.blood_group},${row.component_type},${row.status},${row.unit_count},${row.earliest_expiry || ''}\n`;
      });
    } else if (activeTab === 'hospitals') {
      csvContent += "Hospital Name,City,Requests,Total Requested,Total Fulfilled,Fulfillment %\n";
      hospitalData.forEach(row => {
        csvContent += `"${row.hospital_name}",${row.city},${row.total_requests},${row.total_requested},${row.total_fulfilled},${row.fulfillment_rate_percent}%\n`;
      });
    } else {
      csvContent += "Batch Number,Blood Group,Component,Days Remaining,Expiry Date,Storage\n";
      expiringData.forEach(row => {
        csvContent += `${row.batch_number},${row.blood_group},${row.component_type},${row.days_remaining},${row.expiry_date},"${row.storage_location}"\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bdms_report_${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Database Analytics & Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            SQL aggregation summaries, clinical fulfillment audits, and CSV reporting exports
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 shadow-sm transition"
        >
          <Download className="w-4 h-4 mr-1.5" />
          Export CSV Report
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'inventory' 
              ? 'border-red-700 text-red-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4 mr-1.5" />
          Inventory Component Breakdown
        </button>
        <button
          onClick={() => setActiveTab('hospitals')}
          className={`flex items-center px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'hospitals' 
              ? 'border-red-700 text-red-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4 mr-1.5" />
          Hospital Demand & Fulfillment
        </button>
        <button
          onClick={() => setActiveTab('expiring')}
          className={`flex items-center px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'expiring' 
              ? 'border-red-700 text-red-700' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 mr-1.5" />
          Expiring Inventory (14 Days)
        </button>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'inventory' && (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Blood Group</th>
                  <th className="px-5 py-3.5">Component Type</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Batch Count</th>
                  <th className="px-5 py-3.5">Earliest Expiry</th>
                  <th className="px-5 py-3.5">Latest Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-500">Loading report...</td></tr>
                ) : (
                  inventoryData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-bold text-red-700">{row.blood_group}</td>
                      <td className="px-5 py-3 text-slate-700">{row.component_type}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800">
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{row.unit_count} Units</td>
                      <td className="px-5 py-3 text-slate-600">{row.earliest_expiry || 'N/A'}</td>
                      <td className="px-5 py-3 text-slate-600">{row.latest_expiry || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'hospitals' && (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Hospital Name</th>
                  <th className="px-5 py-3.5">City</th>
                  <th className="px-5 py-3.5">Total Orders</th>
                  <th className="px-5 py-3.5">Units Requested</th>
                  <th className="px-5 py-3.5">Units Fulfilled</th>
                  <th className="px-5 py-3.5">Fulfillment Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-500">Loading report...</td></tr>
                ) : (
                  hospitalData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-semibold text-slate-900">{row.hospital_name}</td>
                      <td className="px-5 py-3 text-slate-600">{row.city}</td>
                      <td className="px-5 py-3 text-slate-700">{row.total_requests}</td>
                      <td className="px-5 py-3 text-slate-700">{row.total_requested}</td>
                      <td className="px-5 py-3 font-semibold text-emerald-700">{row.total_fulfilled}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-emerald-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(row.fulfillment_rate_percent, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-700">{row.fulfillment_rate_percent}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'expiring' && (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Batch Number</th>
                  <th className="px-5 py-3.5">Blood Group</th>
                  <th className="px-5 py-3.5">Component</th>
                  <th className="px-5 py-3.5">Volume</th>
                  <th className="px-5 py-3.5">Days Remaining</th>
                  <th className="px-5 py-3.5">Expiry Date</th>
                  <th className="px-5 py-3.5">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-500">Loading report...</td></tr>
                ) : expiringData.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-500">No stock batches expiring within 14 days.</td></tr>
                ) : (
                  expiringData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono font-medium text-slate-900">{row.batch_number}</td>
                      <td className="px-5 py-3 font-bold text-red-700">{row.blood_group}</td>
                      <td className="px-5 py-3 text-slate-700">{row.component_type}</td>
                      <td className="px-5 py-3 text-slate-600">{row.volume_ml} mL</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900">
                          {row.days_remaining} Days
                        </span>
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-800">{row.expiry_date}</td>
                      <td className="px-5 py-3 text-slate-500">{row.storage_location}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

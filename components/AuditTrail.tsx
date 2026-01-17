import React, { useState } from 'react';
import { AuditLog } from '../types';
import { Shield, Clock, Search, Database, AlertCircle, Info, PlusCircle, MinusCircle, RefreshCcw } from 'lucide-react';

interface AuditTrailProps {
  logs: AuditLog[];
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'create': return <PlusCircle size={14} className="text-green-500" />;
      case 'delete': return <MinusCircle size={14} className="text-red-500" />;
      case 'update': return <RefreshCcw size={14} className="text-blue-500" />;
      case 'system': return <Database size={14} className="text-indigo-500" />;
      default: return <Info size={14} className="text-slate-400" />;
    }
  };

  const getLogTypeColor = (type: string) => {
    switch(type) {
      case 'create': return 'bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
      case 'delete': return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
      case 'update': return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'system': return 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
      default: return 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">System Audit</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Immutable record of recent business events.</p>
        </div>
        <div className="flex items-center gap-3 bg-indigo-900 text-white px-5 py-2.5 rounded-2xl shadow-xl">
          <Shield size={18} className="text-indigo-400" />
          <span className="text-[10px] font-black uppercase tracking-widest">Protocol: Enterprise Ledger</span>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
        <input 
          type="text" 
          placeholder="Scan activity logs by keyword, entity, or ID..." 
          className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm dark:text-white transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white dark:bg-slate-900/60 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-8 py-6 font-bold text-[10px] uppercase tracking-widest">Timestamp</th>
                <th className="px-8 py-6 font-bold text-[10px] uppercase tracking-widest">Activity Trace</th>
                <th className="px-8 py-6 font-bold text-[10px] uppercase tracking-widest">Entity</th>
                <th className="px-8 py-6 font-bold text-[10px] uppercase tracking-widest">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
                      <Clock size={12} className="opacity-60" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-500 font-medium uppercase tracking-tight">{log.details}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-black text-[10px] uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400">
                      {log.entity}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className={`px-4 py-1.5 border rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${getLogTypeColor(log.type)}`}>
                        {getTypeIcon(log.type)}
                        {log.type}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center">
                    <AlertCircle size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                    <p className="text-slate-400 dark:text-slate-600 font-medium italic">No system events matched your inquiry parameters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
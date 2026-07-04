import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import { FiUsers, FiActivity, FiDatabase, FiTrash2, FiCpu, FiTrendingUp } from 'react-icons/fi';

interface User {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
}

export const AdminDashboardPage: React.FC = () => {
  const { showToast } = useToast();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalImages: 0,
    totalDownloads: 0,
    avgTime: 0.0,
    dbMode: 'Unknown',
  });
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, logsRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/admin/logs'),
      ]);

      setStats({
        totalUsers: statsRes.data.total_users,
        totalImages: statsRes.data.total_images_processed,
        totalDownloads: statsRes.data.total_downloads,
        avgTime: statsRes.data.avg_processing_time_sec,
        dbMode: statsRes.data.db_mode,
      });

      setUsers(usersRes.data);
      setLogs(logsRes.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch admin statistics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [showToast]);

  const handleDeleteUser = async (email: string) => {
    const confirm = window.confirm(`Are you sure you want to delete the user account: ${email}? This action is permanent.`);
    if (!confirm) return;

    try {
      await api.delete(`/api/admin/users/${email}`);
      showToast(`User ${email} deleted successfully.`, 'success');
      // Refresh user listing
      setUsers((prev) => prev.filter((u) => u.email !== email));
      setStats((prev) => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user.', 'error');
    }
  };

  const getLogLevelClass = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return 'text-rose-400 font-bold';
      case 'WARNING':
        return 'text-amber-400 font-bold';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl text-white">System Admin Console</h1>
        <p className="text-slate-400 text-sm mt-1">Monitor server resources, manage user accounts, and view execution streams.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        {/* Card 1 */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Users</span>
            <span className="text-2xl font-black text-white font-display">{stats.totalUsers}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple">
            <FiUsers className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Images Processed</span>
            <span className="text-2xl font-black text-white font-display">{stats.totalImages}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-accent-blue">
            <FiActivity className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Downloads</span>
            <span className="text-2xl font-black text-white font-display">{stats.totalDownloads}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan">
            <FiTrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Avg Process Speed</span>
            <span className="text-2xl font-black text-white font-display">{stats.avgTime}s</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple">
            <FiCpu className="w-5 h-5" />
          </div>
        </div>

        {/* Card 5 */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Database Mode</span>
            <span className="text-sm font-bold text-emerald-400 mt-1 block">{stats.dbMode}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <FiDatabase className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Users Management list */}
        <div className="glass-card p-6 flex flex-col h-[500px]">
          <h3 className="font-display font-bold text-lg text-white mb-4">Registered Researchers</h3>
          
          <div className="overflow-y-auto flex-1 pr-1">
            {loading && users.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-accent-purple border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <table className="min-w-full divide-y divide-white/5 text-xs">
                <thead>
                  <tr className="text-left text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.01]">
                      <td className="py-3 pr-2 font-semibold text-white">{u.full_name}</td>
                      <td className="py-3 pr-2 truncate max-w-[120px]">{u.email}</td>
                      <td className="py-3 pr-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.is_admin ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30' : 'bg-white/5 text-slate-400 border border-white/10'
                        }`}>
                          {u.is_admin ? 'Admin' : 'Scientist'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {!u.is_admin && (
                          <button
                            onClick={() => handleDeleteUser(u.email)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded transition-colors"
                            title="Delete Account"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Real-time System Logs list */}
        <div className="glass-card p-6 flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-bold text-lg text-white">System Operation Logs</h3>
            <button 
              onClick={fetchAdminData}
              className="text-xs font-semibold text-accent-purple hover:underline"
            >
              Refresh Logs
            </button>
          </div>
          
          <div className="bg-black/60 rounded-xl border border-white/5 p-4 font-mono text-[10px] leading-relaxed overflow-y-auto flex-1 space-y-2">
            {loading && logs.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-accent-purple border-t-transparent rounded-full animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-slate-500 text-center py-20">No system execution log logs recorded.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border-b border-white/5 pb-1.5 last:border-b-0">
                  <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                  <span className={getLogLevelClass(log.level)}>[{log.level.toUpperCase()}]</span>{' '}
                  <span className="text-slate-300">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
export default AdminDashboardPage;

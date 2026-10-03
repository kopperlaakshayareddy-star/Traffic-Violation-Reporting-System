import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { fetchStats, fetchViolations } from '@/lib/violationService';
import type { Violation } from '@/lib/types';
import StatCard, { StatCardSkeleton } from '@/components/StatCard';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { Card } from '@/components/StatCard';
import { ROLE_LABELS } from '@/lib/constants';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  ArrowRight,
  Users,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface AdminStats {
  totalUsers: number;
  totalOfficers: number;
  totalCitizens: number;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [recentViolations, setRecentViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    async function load() {
      if (!profile) return;
      try {
        setLoading(true);
        setError(null);

        const reporterId = profile.role === 'citizen' ? profile.id : undefined;
        const [statsData, violationsData] = await Promise.all([
          fetchStats(reporterId),
          fetchViolations({
            page: 1,
            reporterId,
            sortBy: 'created_at',
            sortOrder: 'desc',
          }),
        ]);

        if (cancelled) return;
        setStats(statsData);
        setRecentViolations(violationsData.data.slice(0, 5));

        if (profile.role === 'admin') {
          const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
          const { count: totalOfficers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'officer');
          const { count: totalCitizens } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'citizen');
          if (!cancelled) {
            setAdminStats({
              totalUsers: totalUsers || 0,
              totalOfficers: totalOfficers || 0,
              totalCitizens: totalCitizens || 0,
            });
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  if (!profile) return null;

  const greeting = `Welcome back, ${profile.full_name.split(' ')[0]}`;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle={`${greeting} — You are signed in as ${ROLE_LABELS[profile.role]}`}
        action={
          <Link
            to="/violations/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gov-orange-500 text-white font-semibold text-sm hover:bg-gov-orange-600 transition shadow-sm"
          >
            <PlusCircle size={18} />
            Report Violation
          </Link>
        }
      />

      {error && (
        <div className="p-4 mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading || !stats ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Total Reports" value={stats.total} icon={FileText} color="blue" />
            <StatCard label="Pending" value={stats.pending} icon={Clock} color="orange" />
            <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} color="green" />
            <StatCard label="Rejected" value={stats.rejected} icon={XCircle} color="red" />
          </>
        )}
      </div>

      {/* Admin extra stats */}
      {profile.role === 'admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {loading || !adminStats ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard label="Total Users" value={adminStats.totalUsers} icon={Users} color="gray" />
              <StatCard label="Officers" value={adminStats.totalOfficers} icon={Users} color="blue" />
              <StatCard label="Citizens" value={adminStats.totalCitizens} icon={Users} color="orange" />
            </>
          )}
        </div>
      )}

      {/* Recent reports */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-gov-blue-600" />
            Recent Reports
          </h2>
          <Link
            to={profile.role === 'citizen' ? '/my-reports' : '/violations'}
            className="flex items-center gap-1 text-sm font-medium text-gov-blue-700 hover:underline"
          >
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentViolations.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No reports yet. Start by reporting a violation.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentViolations.map((v) => (
              <Link
                key={v.id}
                to={`/violations/${v.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gov-blue-50 text-gov-blue-700 shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {v.vehicle_number} — {v.violation_type}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {v.location} • {new Date(v.violation_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <StatusBadge status={v.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

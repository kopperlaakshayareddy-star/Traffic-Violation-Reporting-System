import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/lib/types';
import { ROLE_LABELS, ROLE_COLORS, ITEMS_PER_PAGE } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import { Card } from '@/components/StatCard';
import {
  Users,
  Search,
  AlertCircle,
  ChevronDown,
  UserCircle,
} from 'lucide-react';

interface UserWithStats extends Profile {
  report_count: number;
}

export default function ManageUsers() {
  const { profile: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      const profiles = (data || []) as Profile[];

      // Fetch report counts for each user
      const usersWithStats: UserWithStats[] = await Promise.all(
        profiles.map(async (p) => {
          const { count } = await supabase
            .from('violations')
            .select('*', { count: 'exact', head: true })
            .eq('reporter_id', p.id);
          return { ...p, report_count: count || 0 };
        })
      );

      setUsers(usersWithStats);
      setTotal(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, currentPage]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleRoleChange(userId: string, newRole: UserRole) {
    if (userId === currentUser?.id) {
      setError('You cannot change your own role.');
      return;
    }
    try {
      setUpdatingId(userId);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Manage Users"
        subtitle="View and manage user accounts and their roles"
      />

      {error && (
        <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {(['admin', 'officer', 'citizen'] as UserRole[]).map((r) => {
          const count = users.filter((u) => u.role === r).length;
          return (
            <Card key={r} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{ROLE_LABELS[r]}s</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {loading ? '—' : count}
                  </p>
                </div>
                <div className={`flex items-center justify-center w-12 h-12 rounded-lg border ${ROLE_COLORS[r]}`}>
                  <Users size={24} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Search & filter */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition"
              placeholder="Search by name or phone..."
            />
          </div>
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | 'all');
                setCurrentPage(1);
              }}
              className="pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition bg-white appearance-none"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="officer">Traffic Officers</option>
              <option value="citizen">Citizens</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {loading ? 'Loading...' : `${total} user${total !== 1 ? 's' : ''} found`}
      </p>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b border-gray-100 bg-gray-50 animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card className="p-12 text-center">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No users found.</p>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Reports</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gov-blue-100 text-gov-blue-700 font-semibold text-sm shrink-0">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{user.full_name}</p>
                          {user.id === currentUser?.id && (
                            <span className="text-xs text-gov-blue-600 font-medium">(You)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{user.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_COLORS[user.role]}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{user.report_count}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user.id === currentUser?.id ? (
                        <span className="text-xs text-gray-400">Cannot change own role</span>
                      ) : (
                        <select
                          value={user.role}
                          disabled={updatingId === user.id}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition bg-white disabled:opacity-50"
                        >
                          <option value="citizen">Citizen</option>
                          <option value="officer">Officer</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {users.map((user) => (
              <Card key={user.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gov-blue-100 text-gov-blue-700 font-semibold text-sm shrink-0">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{user.full_name}</p>
                      {user.id === currentUser?.id && (
                        <span className="text-xs text-gov-blue-600 font-medium">(You)</span>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_COLORS[user.role]}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-gray-600 mb-3">
                  <p><span className="font-medium text-gray-700">Phone:</span> {user.phone || '—'}</p>
                  <p><span className="font-medium text-gray-700">Reports:</span> {user.report_count}</p>
                  <p><span className="font-medium text-gray-700">Joined:</span> {new Date(user.created_at).toLocaleDateString()}</p>
                </div>
                {user.id !== currentUser?.id && (
                  <div className="pt-3 border-t border-gray-100">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Change Role</label>
                    <select
                      value={user.role}
                      disabled={updatingId === user.id}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition bg-white disabled:opacity-50"
                    >
                      <option value="citizen">Citizen</option>
                      <option value="officer">Officer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}

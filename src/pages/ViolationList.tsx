import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { fetchViolations, type ViolationFilters } from '@/lib/violationService';
import type { Violation, ViolationStatus } from '@/lib/types';
import { VIOLATION_TYPES, VEHICLE_TYPES, STATUS_LABELS, ITEMS_PER_PAGE } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import ImagePreview from '@/components/ImagePreview';
import {
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  PlusCircle,
  Eye,
  AlertCircle,
  X,
} from 'lucide-react';

interface Props {
  myReportsOnly?: boolean;
}

export default function ViolationList({ myReportsOnly = false }: Props) {
  const { profile } = useAuth();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ViolationStatus | 'all'>('all');
  const [violationType, setViolationType] = useState('all');
  const [vehicleType, setVehicleType] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const loadViolations = useCallback(async () => {
    if (!profile) return;
    try {
      setLoading(true);
      setError(null);
      const filters: ViolationFilters = {
        search,
        status,
        violationType,
        vehicleType,
        sortBy,
        sortOrder,
        page: currentPage,
        reporterId: myReportsOnly ? profile.id : undefined,
      };
      const result = await fetchViolations(filters);
      setViolations(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [profile, search, status, violationType, vehicleType, sortBy, sortOrder, currentPage, myReportsOnly]);

  useEffect(() => {
    loadViolations();
  }, [loadViolations]);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    setCurrentPage(1);
    loadViolations();
  }

  function handleFilterChange() {
    setCurrentPage(1);
  }

  function toggleSort() {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }

  function clearFilters() {
    setSearch('');
    setStatus('all');
    setViolationType('all');
    setVehicleType('all');
    setSortBy('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
  }

  const activeFilters =
    (status !== 'all' ? 1 : 0) +
    (violationType !== 'all' ? 1 : 0) +
    (vehicleType !== 'all' ? 1 : 0);

  const title = myReportsOnly ? 'My Reports' : 'All Violation Reports';
  const subtitle = myReportsOnly
    ? 'View and manage reports you have submitted'
    : 'Browse, search, and manage all traffic violation reports';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={title}
        subtitle={subtitle}
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
        <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-3 mb-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition"
              placeholder="Search by vehicle number, location, or description..."
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-gov-blue-700 text-white font-semibold text-sm hover:bg-gov-blue-800 transition"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border font-medium text-sm transition ${
              showFilters || activeFilters > 0
                ? 'border-gov-blue-300 bg-gov-blue-50 text-gov-blue-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} />
            Filters
            {activeFilters > 0 && (
              <span className="flex items-center justify-center w-5 h-5 text-xs rounded-full bg-gov-blue-700 text-white">
                {activeFilters}
              </span>
            )}
          </button>
        </form>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-100 animate-slide-up">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as ViolationStatus | 'all');
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition bg-white"
              >
                <option value="all">All Statuses</option>
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Violation Type</label>
              <select
                value={violationType}
                onChange={(e) => {
                  setViolationType(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition bg-white"
              >
                <option value="all">All Types</option>
                {VIOLATION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={(e) => {
                  setVehicleType(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition bg-white"
              >
                <option value="all">All Vehicles</option>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sort By</label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    handleFilterChange();
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition bg-white"
                >
                  <option value="created_at">Date Created</option>
                  <option value="violation_date">Violation Date</option>
                  <option value="vehicle_number">Vehicle Number</option>
                  <option value="status">Status</option>
                  <option value="violation_type">Violation Type</option>
                </select>
                <button
                  type="button"
                  onClick={toggleSort}
                  className="flex items-center justify-center px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  <ArrowUpDown size={16} className={sortOrder === 'asc' ? 'rotate-180' : ''} />
                </button>
              </div>
            </div>
            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition col-span-full justify-end"
              >
                <X size={14} /> Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {loading ? 'Loading...' : `${total} report${total !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Table / Cards */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b border-gray-100 bg-gray-50 animate-pulse" />
          ))}
        </div>
      ) : violations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <FileText size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm mb-4">No violation reports found.</p>
          <Link
            to="/violations/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gov-blue-700 text-white text-sm font-semibold hover:bg-gov-blue-800 transition"
          >
            <PlusCircle size={18} />
            Report a Violation
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Vehicle</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Violation</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Reporter</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {violations.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {v.image_url && (
                          <ImagePreview
                            src={v.image_url}
                            className="w-10 h-10 shrink-0"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{v.vehicle_number}</p>
                          <p className="text-xs text-gray-500">{v.vehicle_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{v.violation_type}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[160px] truncate">{v.location}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(v.violation_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {v.reporter?.full_name || '—'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/violations/${v.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-gov-blue-700 hover:underline"
                      >
                        <Eye size={16} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {violations.map((v) => (
              <Link
                key={v.id}
                to={`/violations/${v.id}`}
                className="block bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {v.image_url && (
                      <ImagePreview src={v.image_url} className="w-12 h-12 shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{v.vehicle_number}</p>
                      <p className="text-xs text-gray-500">{v.vehicle_type} • {v.violation_type}</p>
                    </div>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <p><span className="font-medium text-gray-700">Location:</span> {v.location}</p>
                  <p><span className="font-medium text-gray-700">Date:</span> {new Date(v.violation_date).toLocaleDateString()}</p>
                  {v.reporter && (
                    <p><span className="font-medium text-gray-700">Reporter:</span> {v.reporter.full_name}</p>
                  )}
                </div>
              </Link>
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

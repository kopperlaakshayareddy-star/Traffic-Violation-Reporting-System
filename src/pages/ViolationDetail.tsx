import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { fetchViolationById, reviewViolation, deleteViolation } from '@/lib/violationService';
import type { Violation, ViolationStatus } from '@/lib/types';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import ImagePreview from '@/components/ImagePreview';
import { Card } from '@/components/StatCard';
import { ROLE_LABELS } from '@/lib/constants';
import {
  ArrowLeft,
  Car,
  Calendar,
  Clock,
  MapPin,
  FileText,
  User,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit2,
  AlertCircle,
  Navigation,
  MessageSquare,
} from 'lucide-react';

export default function ViolationDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [violation, setViolation] = useState<Violation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canReview = profile?.role === 'admin' || profile?.role === 'officer';
  const canEdit = profile?.role === 'admin' || (profile?.role === 'citizen' && violation?.reporter_id === profile?.id);
  const canDelete = profile?.role === 'admin' || (profile?.role === 'citizen' && violation?.reporter_id === profile?.id);

  useEffect(() => {
    if (!id) return;
    const reportId = id;
    async function load() {
      try {
        setLoading(true);
        const data = await fetchViolationById(reportId);
        if (!data) {
          setError('Report not found.');
          return;
        }
        setViolation(data);
        setReviewNotes(data.review_notes || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleReview(newStatus: ViolationStatus) {
    if (!violation || !profile) return;
    try {
      setActionLoading(true);
      const updated = await reviewViolation(violation.id, newStatus, reviewNotes, profile.id);
      setViolation(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!violation) return;
    try {
      setActionLoading(true);
      await deleteViolation(violation.id);
      navigate('/violations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report');
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Report Details" />
        <div className="space-y-4">
          <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error && !violation) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Report Details" />
        <Card className="p-12 text-center">
          <AlertCircle size={40} className="mx-auto text-red-400 mb-3" />
          <p className="text-gray-700 font-medium mb-2">{error}</p>
          <Link to="/violations" className="text-gov-blue-700 font-semibold text-sm hover:underline">
            Back to Reports
          </Link>
        </Card>
      </div>
    );
  }

  if (!violation) return null;

  const infoItems = [
    { icon: Car, label: 'Vehicle Number', value: violation.vehicle_number },
    { icon: Car, label: 'Vehicle Type', value: violation.vehicle_type },
    { icon: FileText, label: 'Violation Type', value: violation.violation_type },
    { icon: Calendar, label: 'Date', value: new Date(violation.violation_date).toLocaleDateString() },
    { icon: Clock, label: 'Time', value: violation.violation_time },
    { icon: MapPin, label: 'Location', value: violation.location },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/violations"
          className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 transition"
        >
          <ArrowLeft size={18} /> Back
        </Link>
      </div>

      <PageHeader
        title={`Report: ${violation.vehicle_number}`}
        subtitle={`${violation.violation_type} — ${violation.location}`}
        action={
          <div className="flex items-center gap-2">
            {canEdit && violation.status === 'pending' && (
              <Link
                to={`/violations/${violation.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition"
              >
                <Edit2 size={16} /> Edit
              </Link>
            )}
            {canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-600 font-semibold text-sm hover:bg-red-50 transition"
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
        }
      />

      {error && (
        <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-gov-blue-600" />
              Violation Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {infoItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-500 shrink-0">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="text-sm font-medium text-gray-900">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {(violation.latitude && violation.longitude) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-500 shrink-0">
                    <Navigation size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">GPS Coordinates</p>
                    <p className="text-sm font-medium text-gray-900">
                      {violation.latitude}, {violation.longitude}
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${violation.latitude},${violation.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gov-blue-700 hover:underline mt-1 inline-block"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText size={20} className="text-gov-blue-600" />
              Description
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">{violation.description}</p>
            {violation.remarks && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2 text-sm">
                  <MessageSquare size={16} className="text-gray-400" />
                  Remarks
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{violation.remarks}</p>
              </div>
            )}
          </Card>

          {violation.image_url && (
            <Card className="p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon size={20} className="text-gov-blue-600" />
                Evidence Image
              </h2>
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={violation.image_url}
                  alt="Violation evidence"
                  className="w-full max-h-[400px] object-contain bg-gray-50"
                />
              </div>
            </Card>
          )}
        </div>

        {/* Right: Meta & Actions */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Status</h2>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Current Status</span>
              <StatusBadge status={violation.status} />
            </div>
            {violation.reviewed_at && (
              <div className="text-xs text-gray-500 space-y-1 pt-3 border-t border-gray-100">
                <p>Reviewed on: {new Date(violation.reviewed_at).toLocaleString()}</p>
                {violation.reviewer && (
                  <p>Reviewed by: {violation.reviewer.full_name}</p>
                )}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} className="text-gov-blue-600" />
              Reporter
            </h2>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm font-medium text-gray-900">{violation.reporter?.full_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Role</p>
                <p className="text-sm font-medium text-gray-900">
                  {violation.reporter ? ROLE_LABELS[violation.reporter.role] : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Reported On</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(violation.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Review panel for officers/admins */}
          {canReview && (
            <Card className="p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Review Actions</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Review Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition resize-none"
                  placeholder="Add notes about this review..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleReview('approved')}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition disabled:opacity-60"
                >
                  <CheckCircle2 size={18} /> Approve
                </button>
                <button
                  onClick={() => handleReview('rejected')}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition disabled:opacity-60"
                >
                  <XCircle size={18} /> Reject
                </button>
              </div>
              {violation.review_notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Previous Review Notes</p>
                  <p className="text-sm text-gray-700">{violation.review_notes}</p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <Card className="p-6 max-w-md w-full animate-slide-up">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Report?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this violation report? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition disabled:opacity-60"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

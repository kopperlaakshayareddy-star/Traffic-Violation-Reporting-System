import { useState, useRef, type FormEvent, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { createViolation, updateViolation, fetchViolationById, uploadViolationImage } from '@/lib/violationService';
import type { ViolationInput } from '@/lib/types';
import { VEHICLE_TYPES, VIOLATION_TYPES } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
import {
  ArrowLeft,
  Car,
  FileText,
  Calendar,
  Clock,
  MapPin,
  Navigation,
  Upload,
  X,
  AlertCircle,
  Image as ImageIcon,
  Save,
  Loader2,
} from 'lucide-react';

interface Props {
  mode: 'create' | 'edit';
}

export default function ViolationForm({ mode }: Props) {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const [form, setForm] = useState<ViolationInput>({
    vehicle_number: '',
    vehicle_type: '',
    violation_type: '',
    description: '',
    violation_date: '',
    violation_time: '',
    location: '',
    latitude: null,
    longitude: null,
    remarks: '',
  });

  useEffect(() => {
    if (mode === 'edit' && id) {
      const reportId = id;
      async function load() {
        try {
          setLoading(true);
          const data = await fetchViolationById(reportId);
          if (!data) {
            setError('Report not found.');
            return;
          }
          setForm({
            vehicle_number: data.vehicle_number,
            vehicle_type: data.vehicle_type,
            violation_type: data.violation_type,
            description: data.description,
            violation_date: data.violation_date,
            violation_time: data.violation_time,
            location: data.location,
            latitude: data.latitude,
            longitude: data.longitude,
            remarks: data.remarks || '',
          });
          setExistingImageUrl(data.image_url);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load report');
        } finally {
          setLoading(false);
        }
      }
      load();
    }
  }, [mode, id]);

  function handleChange<K extends keyof ViolationInput>(key: K, value: ViolationInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5 MB.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleChange('latitude', position.coords.latitude);
        handleChange('longitude', position.coords.longitude);
      },
      () => {
        setError('Unable to retrieve your location. Please check permissions.');
      }
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);

    try {
      setSubmitting(true);

      let imageUrl = existingImageUrl;
      if (imageFile) {
        imageUrl = await uploadViolationImage(imageFile, profile.id);
      }

      const payload: ViolationInput = {
        ...form,
        latitude: form.latitude || null,
        longitude: form.longitude || null,
        image_url: imageUrl,
        remarks: form.remarks || null,
      };

      if (mode === 'create') {
        await createViolation(payload);
        navigate('/violations');
      } else if (mode === 'edit' && id) {
        await updateViolation(id, payload);
        navigate(`/violations/${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save report');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Edit Report" />
        <div className="space-y-4">
          <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const title = mode === 'create' ? 'Report a Traffic Violation' : 'Edit Violation Report';
  const subtitle = mode === 'create'
    ? 'Fill in the details below to submit a new traffic violation report'
    : 'Update the violation report details';

  return (
    <div className="animate-fade-in">
      <Link
        to={mode === 'edit' && id ? `/violations/${id}` : '/violations'}
        className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 transition mb-4"
      >
        <ArrowLeft size={18} /> Back
      </Link>

      <PageHeader title={title} subtitle={subtitle} />

      {error && (
        <div className="flex items-start gap-2 p-3 mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Information */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Car size={20} className="text-gov-blue-600" />
            Vehicle Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Vehicle Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.vehicle_number}
                onChange={(e) => handleChange('vehicle_number', e.target.value.toUpperCase())}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition"
                placeholder="e.g. ABC-1234"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Vehicle Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.vehicle_type}
                onChange={(e) => handleChange('vehicle_type', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition bg-white"
              >
                <option value="">Select type</option>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Violation Details */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-gov-blue-600" />
            Violation Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Violation Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.violation_type}
                onChange={(e) => handleChange('violation_type', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition bg-white"
              >
                <option value="">Select violation type</option>
                {VIOLATION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition resize-none"
                placeholder="Describe what happened in detail..."
              />
            </div>
          </div>
        </div>

        {/* Date, Time & Location */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-gov-blue-600" />
            Date, Time & Location
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Calendar size={14} className="inline mr-1" />
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={form.violation_date}
                onChange={(e) => handleChange('violation_date', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Clock size={14} className="inline mr-1" />
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={form.violation_time}
                onChange={(e) => handleChange('violation_time', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <MapPin size={14} className="inline mr-1" />
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition"
              placeholder="e.g. Main Street, Downtown"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Latitude</label>
              <input
                type="number"
                step="any"
                value={form.latitude ?? ''}
                onChange={(e) => handleChange('latitude', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition"
                placeholder="Auto-filled from GPS"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Longitude</label>
              <input
                type="number"
                step="any"
                value={form.longitude ?? ''}
                onChange={(e) => handleChange('longitude', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition"
                placeholder="Auto-filled from GPS"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={getCurrentLocation}
            className="flex items-center gap-2 text-sm font-medium text-gov-blue-700 hover:underline"
          >
            <Navigation size={16} /> Use my current location
          </button>
        </div>

        {/* Image Upload */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ImageIcon size={20} className="text-gov-blue-600" />
            Evidence Image
          </h2>
          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-48 rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition"
              >
                <X size={16} />
              </button>
            </div>
          ) : existingImageUrl ? (
            <div className="relative inline-block">
              <img
                src={existingImageUrl}
                alt="Current evidence"
                className="max-h-48 rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => {
                  setExistingImageUrl(null);
                  clearImage();
                }}
                className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gov-blue-400 hover:bg-gov-blue-50/50 transition"
            >
              <Upload size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">Click to upload an image</p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5 MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        {/* Remarks */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Additional Remarks</h2>
          <textarea
            value={form.remarks || ''}
            onChange={(e) => handleChange('remarks', e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition resize-none"
            placeholder="Any additional information (optional)..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gov-blue-700 text-white font-semibold text-sm hover:bg-gov-blue-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {mode === 'create' ? 'Submit Report' : 'Save Changes'}
          </button>
          <Link
            to={mode === 'edit' && id ? `/violations/${id}` : '/violations'}
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

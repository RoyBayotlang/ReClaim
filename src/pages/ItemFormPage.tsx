import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Upload,
  Image as ImageIcon,
  DollarSign,
  Package,
  Calendar,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createItem, getItem, updateItem, getNextReference, uploadItemImage } from '../lib/itemsApi';
import { assess, peso, REC_META } from '../lib/assessment';
import { CATEGORIES, Status, STATUS_META } from '../types';

export default function ItemFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  // Form states
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [reference, setReference] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Laptop');
  const [customCategory, setCustomCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseCost, setPurchaseCost] = useState<number>(0);
  const [repairEstimate, setRepairEstimate] = useState<number>(0);
  const [resaleValue, setResaleValue] = useState<number>(0);
  const [status, setStatus] = useState<Status>('unknown');
  const [receivedAt, setReceivedAt] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Financial preview
  const financialAssessment = assess(
    Number(purchaseCost) || 0,
    Number(repairEstimate) || 0,
    Number(resaleValue) || 0
  );
  const recMeta = REC_META[financialAssessment.rec];

  // Load existing item if editing
  useEffect(() => {
    let mounted = true;

    async function init() {
      if (isEdit && id) {
        try {
          setLoading(true);
          const existing = await getItem(id);
          if (!mounted) return;

          setReference(existing.reference || '');
          setName(existing.name || '');
          if (CATEGORIES.includes(existing.category as any)) {
            setCategory(existing.category || 'Other');
          } else if (existing.category) {
            setCategory('Other');
            setCustomCategory(existing.category);
          }
          setBrand(existing.brand || '');
          setModel(existing.model || '');
          setSerialNumber(existing.serial_number || '');
          setPurchaseCost(existing.purchase_cost || 0);
          setRepairEstimate(existing.repair_estimate || 0);
          setResaleValue(existing.resale_value || 0);
          setStatus(existing.status || 'unknown');
          setReceivedAt(existing.received_at || new Date().toISOString().split('T')[0]);
          setNotes(existing.notes || '');
          setImageUrl(existing.image_url || '');
          setImagePreview(existing.image_url || null);
        } catch (err: any) {
          toast.error(err.message || 'Failed to load item');
          navigate('/items');
        } finally {
          if (mounted) setLoading(false);
        }
      } else {
        // Auto-generate next reference code
        try {
          const nextRef = await getNextReference();
          if (mounted) setReference(nextRef);
        } catch {
          if (mounted) setReference('REF-1001');
        }
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, [id, isEdit, navigate]);

  // Handle local image file pick
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WebP)');
      return;
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const url = await uploadItemImage(file);
      setImageUrl(url);
      setImagePreview(url);
      toast.success('Image attached');
    } catch (err: any) {
      toast.error(err.message || 'Failed to process image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (purchaseCost < 0 || resaleValue < 0 || repairEstimate < 0) {
      toast.error('Cost and value figures cannot be negative');
      return;
    }

    const finalCategory = category === 'Other' && customCategory.trim()
      ? customCategory.trim()
      : category;

    setSubmitting(true);

    try {
      if (isEdit && id) {
        await updateItem(id, {
          reference: reference.trim(),
          name: name.trim(),
          category: finalCategory,
          brand: brand.trim() || null,
          model: model.trim() || null,
          serial_number: serialNumber.trim() || null,
          purchase_cost: Number(purchaseCost) || 0,
          repair_estimate: Number(repairEstimate) || 0,
          resale_value: Number(resaleValue) || 0,
          status,
          received_at: receivedAt,
          notes: notes.trim() || null,
          image_url: imageUrl.trim() || null,
        });
        toast.success('Item updated successfully');
        navigate(`/items/${id}`);
      } else {
        const created = await createItem({
          reference: reference.trim(),
          name: name.trim(),
          category: finalCategory,
          brand: brand.trim() || null,
          model: model.trim() || null,
          serial_number: serialNumber.trim() || null,
          purchase_cost: Number(purchaseCost) || 0,
          repair_estimate: Number(repairEstimate) || 0,
          resale_value: Number(resaleValue) || 0,
          status,
          received_at: receivedAt,
          notes: notes.trim() || null,
          image_url: imageUrl.trim() || null,
        });
        toast.success('Item received and saved to inventory');
        navigate(`/items/${created.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving item');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm text-gray-500">Loading item details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={isEdit && id ? `/items/${id}` : '/items'}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isEdit ? `Edit Item: ${reference || name}` : 'Receive New Item'}
            </h1>
            <p className="text-xs text-gray-500">
              {isEdit
                ? 'Update item specifications, financial estimates, and condition'
                : 'Log a new refurbishment or asset recovery candidate into Supabase'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            // Fill with quick sample data for rapid testing
            setName('Dell Latitude 7490');
            setCategory('Laptop');
            setBrand('Dell');
            setModel('7490');
            setSerialNumber(`SN-${Math.floor(100000 + Math.random() * 900000)}`);
            setPurchaseCost(5500);
            setRepairEstimate(1800);
            setResaleValue(13000);
            setStatus('inspection');
            setNotes('Trade-in batch unit. Light scuffs on lid, functional display.');
            toast.success('Sample values populated');
          }}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
        >
          <Sparkles size={14} />
          Fill Sample
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Identification & Core Details */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Package size={18} className="text-emerald-600" />
                <h2 className="text-sm font-semibold text-gray-900">Item Identification</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Reference ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. REF-1001"
                    className="w-full px-3 py-2 text-sm font-mono bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Unique tracking reference</p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Lenovo ThinkPad T480 Core i5"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {category === 'Other' && (
                    <input
                      type="text"
                      placeholder="Specify category..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="mt-2 w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Brand / Make</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Lenovo, Apple, Dell"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Model Number</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. T480, A2111"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. PF1A2B3C or IMEI"
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Financial Estimates & Costs */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <DollarSign size={18} className="text-emerald-600" />
                <h2 className="text-sm font-semibold text-gray-900">Financial Estimates</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Purchase Cost (₱)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                      ₱
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={purchaseCost === 0 ? '' : purchaseCost}
                      onChange={(e) => setPurchaseCost(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Acquisition price</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Repair Estimate (₱)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                      ₱
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={repairEstimate === 0 ? '' : repairEstimate}
                      onChange={(e) => setRepairEstimate(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Parts & labor estimate</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Est. Resale Value (₱)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                      ₱
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={resaleValue === 0 ? '' : resaleValue}
                      onChange={(e) => setResaleValue(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Target marketplace value</p>
                </div>
              </div>
            </div>

            {/* Intake Details & Notes */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Calendar size={18} className="text-emerald-600" />
                <h2 className="text-sm font-semibold text-gray-900">Intake Details & Notes</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date Received
                  </label>
                  <input
                    type="date"
                    value={receivedAt}
                    onChange={(e) => setReceivedAt(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Pipeline Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Status)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  >
                    {Object.entries(STATUS_META).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.icon} {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Condition & Intake Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe cosmetic condition, missing accessories, initial findings, or intake source..."
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Sidebar / Assessment Preview & Image (1 Col) */}
          <div className="space-y-6">
            {/* Live Financial Assessment Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center justify-between">
                <span>Assessment Preview</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${recMeta.cls}`}>
                  {recMeta.label}
                </span>
              </h3>

              <div className="bg-gray-50 rounded-lg p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Total Investment:</span>
                  <span className="font-semibold text-gray-900">{peso(financialAssessment.investment)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Target Resale:</span>
                  <span className="font-semibold text-gray-900">{peso(Number(resaleValue) || 0)}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between">
                  <span className="font-medium text-gray-700">Projected Profit:</span>
                  <span
                    className={`font-bold ${
                      financialAssessment.profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {peso(financialAssessment.profit)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Projected ROI:</span>
                  <span
                    className={`font-bold ${
                      financialAssessment.roi >= 25
                        ? 'text-emerald-600'
                        : financialAssessment.roi >= 10
                        ? 'text-amber-600'
                        : 'text-red-500'
                    }`}
                  >
                    {financialAssessment.roi.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 flex items-start gap-1.5 leading-relaxed">
                <AlertCircle size={14} className="shrink-0 text-gray-400 mt-0.5" />
                <span>
                  Thresholds: &ge;25% ROI recommends refurbishment. 10–24% requires manual review. Below 10% suggests parts recovery or disposal.
                </span>
              </div>
            </div>

            {/* Product Image Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <ImageIcon size={18} className="text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-900">Product Image (Optional)</h3>
              </div>

              {/* Preview */}
              {imagePreview ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-video flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => setImagePreview(null)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('');
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs px-2 py-1 rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center bg-gray-50/50">
                  <ImageIcon size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-xs text-gray-500 mb-3">Upload photo or provide direct URL</p>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                    {uploadingImage ? (
                      <Loader2 size={14} className="animate-spin text-emerald-600" />
                    ) : (
                      <Upload size={14} />
                    )}
                    Choose File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              )}

              {/* Or Direct Image URL input */}
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1">
                  Or enter image URL:
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreview(e.target.value || null);
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Submit & Cancel Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving Item...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {isEdit ? 'Update Item' : 'Save & Receive Item'}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate(isEdit && id ? `/items/${id}` : '/items')}
                disabled={submitting}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

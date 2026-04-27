import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Flag, Image as ImageIcon, Layers3, Plus } from 'lucide-react';

const AdminCollections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: ''
  });

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const res = await api.get('/store/collections');
      const collectionData = Array.isArray(res.data) ? res.data : [];
      const sorted = [...collectionData].sort((a, b) => Number(a.id) - Number(b.id));
      setCollections(sorted);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const loadingToast = toast.loading('Adding collection...');
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim()
      };

      const response = await api.post('/store/collections', payload);
      const createdCollection = response.data;

      setCollections((prev) => {
        const next = [createdCollection, ...prev];
        next.sort((a, b) => Number(a.id) - Number(b.id));
        return next;
      });

      setFormData({ name: '', description: '', imageUrl: '' });
      setShowModal(false);
      toast.success('Collection added successfully', { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to add collection', { id: loadingToast });
    }
  };

  const previewImage = useMemo(() => formData.imageUrl.trim(), [formData.imageUrl]);

  return (
    <div className="text-white w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="kinetic-heading text-3xl md:text-4xl tracking-wider text-white uppercase mb-1">
            Manage <span className="text-brand-primary">Collections</span>
          </h2>
          <p className="text-text-secondary font-inter text-sm">Add clubs and country collections like Argentina with image and description.</p>
        </div>

        <button
          className="flex items-center justify-center gap-2 bg-brand-primary text-black font-bold font-inter px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:shadow-[0_0_30px_rgba(0,255,102,0.5)] hover:scale-105 transition-all w-full sm:w-auto"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} strokeWidth={3} /> Add Collection
        </button>
      </div>

      <div className="bg-surface-low/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden min-h-100 flex flex-col">
        {loading ? (
          <div className="grow flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-4 border-surface-high border-t-brand-primary rounded-full animate-spin"></div>
            <p className="text-text-secondary font-inter text-sm animate-pulse">Loading collections...</p>
          </div>
        ) : collections.length === 0 ? (
          <div className="grow flex flex-col items-center justify-center h-64 gap-4 text-text-secondary">
            <Layers3 size={48} className="opacity-50" />
            <p className="font-inter">No collections found. Add your first club or country collection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto grow">
            <table className="w-full text-left font-inter whitespace-nowrap">
              <thead>
                <tr className="border-b border-white/5 bg-surface-base/30">
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Image</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Description</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Slug</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-widest">ID</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((collection) => (
                  <tr key={collection.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="w-16 h-16 rounded-lg p-1 border border-white/5 overflow-hidden shadow-inner bg-surface-deep">
                        <img
                          src={collection.logoUrl || collection.logo_url || 'https://via.placeholder.com/320x320?text=Collection'}
                          alt={collection.collectionName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">{collection.collectionName}</td>
                    <td className="px-6 py-4 text-text-secondary text-sm max-w-xs truncate">{collection.description || 'No description'}</td>
                    <td className="px-6 py-4 text-text-secondary text-sm">{collection.slug || 'n/a'}</td>
                    <td className="px-6 py-4 text-text-secondary text-sm">#{collection.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-100 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-surface-low/95 backdrop-blur-2xl p-8 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl my-8 animate-in zoom-in-95 duration-300 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4"></div>

            <div className="relative z-10">
              <h3 className="kinetic-heading text-2xl mb-6 text-white tracking-wider flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary border border-brand-primary/20">
                  <Flag size={24} />
                </div>
                New Collection
              </h3>

              <form onSubmit={handleSubmit} className="space-y-5 font-inter">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Collection Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Argentina"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-surface-deep/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-brand-primary focus:bg-surface-deep border border-white/5 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Image URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={formData.imageUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full bg-surface-deep/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-brand-primary focus:bg-surface-deep border border-white/5 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Description</label>
                  <textarea
                    placeholder="Short summary for this club/country collection"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-surface-deep/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-brand-primary focus:bg-surface-deep border border-white/5 transition-all text-sm h-24 resize-none custom-scrollbar"
                  ></textarea>
                </div>

                <div className="bg-surface-deep/40 border border-white/5 rounded-xl p-3">
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Image Preview</p>
                  {previewImage ? (
                    <img src={previewImage} alt="Collection preview" className="w-full h-36 rounded-lg object-cover border border-white/10" />
                  ) : (
                    <div className="w-full h-36 rounded-lg border border-white/10 bg-surface-deep flex items-center justify-center text-text-secondary">
                      <ImageIcon size={24} className="opacity-70" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    className="w-full sm:w-auto font-bold text-text-secondary hover:text-white px-6 py-3 rounded-xl bg-surface-deep hover:bg-white/10 transition-colors"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-brand-primary text-black font-bold px-8 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,255,102,0.4)] hover:scale-[1.02] transition-all"
                  >
                    Save Collection
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCollections;

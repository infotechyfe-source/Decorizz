import React, { useContext, useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AuthContext } from '../../context/AuthContext';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Save, HelpCircle } from "lucide-react";

export default function AdminFAQs() {
  const { accessToken } = useContext(AuthContext);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ question: '', answer: '', order: 0 });

  const fetchFaqs = async () => {
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/faqs`);
      const data = await res.json();
      setItems(data.faqs || []);
    } catch (e) {
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFaqs(); }, []);

  const createFaq = async () => {
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/faqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || 'Create failed');
      toast.success('FAQ created');
      setForm({ question: '', answer: '', order: 0 });
      fetchFaqs();
    } catch { toast.error('Create failed'); }
  };

  const updateFaq = async (id: string, updates: any) => {
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/faqs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || 'Update failed');
      toast.success('Updated');
      setItems(items.map(i => i.id === id ? data.faq : i));
    } catch { toast.error('Update failed'); }
  };

  const deleteFaq = async (id: string) => {
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/faqs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || 'Delete failed');
      toast.success('Deleted');
      setItems(items.filter(i => i.id !== id));
    } catch { toast.error('Delete failed'); }
  };

  return (
    <AdminLayout title="Manage FAQs">
      {/* ADD FAQ FORM */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-teal-600" /> Add New Question
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-4">
            <input
              value={form.question}
              onChange={e => setForm({ ...form, question: e.target.value })}
              placeholder="Question (e.g. How long is delivery?)"
              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-900 bg-slate-50"
            />
          </div>

          <div className="md:col-span-3">
            <input
              value={form.answer}
              onChange={e => setForm({ ...form, answer: e.target.value })}
              placeholder="Answer"
              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-900 bg-slate-50"
            />
          </div>

          <div>
            <input
              type="number"
              value={form.order}
              onChange={e => setForm({ ...form, order: Number(e.target.value) })}
              placeholder="Order"
              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-900 bg-slate-50"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={createFaq} className="bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-teal-700 transition shadow-sm">
            Create FAQ
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-10 w-10 border-b-2 border-teal-600 rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No FAQs</h3>
          <p className="text-slate-500">Add common questions to help your customers.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition group hover:shadow-md">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-mono">#{item.order}</span>
                  <input
                    defaultValue={item.question}
                    onBlur={(e) => updateFaq(item.id, { question: e.target.value })}
                    className="flex-1 font-bold text-slate-900 border-none bg-transparent focus:bg-slate-50 focus:ring-2 ring-teal-500 rounded px-2 py-1 -ml-2"
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <textarea
                    defaultValue={item.answer}
                    onBlur={(e) => updateFaq(item.id, { answer: e.target.value })}
                    rows={2}
                    className="w-full bg-transparent border-none focus:ring-0 text-slate-700 resize-none p-0"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2 mr-auto">
                    <label className="text-xs text-slate-400">Sort Order:</label>
                    <input
                      type="number"
                      defaultValue={item.order || 0}
                      onBlur={(e) => updateFaq(item.id, { order: Number(e.target.value) })}
                      className="w-16 text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1"
                    />
                  </div>
                  <button onClick={() => deleteFaq(item.id)} className="text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 text-sm font-medium flex items-center gap-2 transition">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

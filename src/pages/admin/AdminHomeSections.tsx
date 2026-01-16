import React, { useEffect, useMemo, useState, useContext } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { AuthContext } from "../../context/AuthContext";
import { projectId } from "../../utils/supabase/info";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";

type Product = { id: string; name: string; image: string; price?: number; category?: string; };

const SECTIONS = [
  { key: "best", title: "Best Sellers" },
  { key: "premium", title: "Premium Collection" },
  { key: "new", title: "New Arrivals" },
  { key: "budget", title: "Budget Finds" },
] as const;

export default function AdminHomeSections() {
  const { accessToken } = useContext(AuthContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [flags, setFlags] = useState<Record<string, Set<string>>>({ best: new Set(), premium: new Set(), new: new Set(), budget: new Set() });
  const [active, setActive] = useState<typeof SECTIONS[number]>(SECTIONS[0]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [prodRes, bestRes, premRes, newRes, budRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products`),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/home-section/best`),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/home-section/premium`),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/home-section/new`),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/home-section/budget`),
      ]);
      const prodData = await prodRes.json();
      setProducts(prodData.products || []);
      const toSet = (arr: any[]) => new Set((arr || []).map((p) => p.id));
      setFlags({
        best: toSet((await bestRes.json()).products || []),
        premium: toSet((await premRes.json()).products || []),
        new: toSet((await newRes.json()).products || []),
        budget: toSet((await budRes.json()).products || []),
      });
    } finally { setLoading(false); }
  };

  const toggleFlag = async (section: string, id: string, flag: boolean) => {
    try {
      setUpdating(id + section);
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/home-section/${section}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ flag }),
      });
      const s = new Set(flags[section]);
      flag ? s.add(id) : s.delete(id);
      setFlags({ ...flags, [section]: s });
    } finally { setUpdating(null); }
  };

  const flaggedIds = useMemo(() => flags[active.key], [flags, active.key]);
  const sortedProducts = useMemo(() => {
    const arr = [...products];
    return arr.sort((a, b) => Number(flaggedIds.has(b.id)) - Number(flaggedIds.has(a.id)));
  }, [products, flaggedIds]);

  return (
    <AdminLayout title="Home Page Sections">
      <div className="flex items-center gap-3 mb-6">
        {SECTIONS.map((sec) => (
          <button key={sec.key} onClick={() => setActive(sec)} className={`px-4 py-2 rounded-lg border ${active.key === sec.key ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-700 border-slate-200'}`}>{sec.title}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-10 w-10 border-b-2 border-teal-600 rounded-full animate-spin" /></div>
      ) : (
        <>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-slate-600">Selected: {flaggedIds.size}/15</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedProducts.slice(0, 60).map((p) => {
            const isFlagged = flaggedIds.has(p.id);
            return (
              <div key={p.id} className={`bg-white rounded-xl shadow-sm overflow-hidden ${isFlagged ? 'border-2 border-teal-600' : 'border border-slate-200'}`}>
                <div className="w-full" style={{ aspectRatio: '4/5' }}>
                  <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-slate-900 font-semibold text-sm">{p.name}</p>
                  </div>
                  <button onClick={() => toggleFlag(active.key, p.id, !isFlagged)} disabled={updating === p.id + active.key || (!isFlagged && flaggedIds.size >= 15)} className={`px-3 py-1 rounded-lg text-sm font-semibold ${isFlagged ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>{isFlagged ? 'Remove' : 'Add'}</button>
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}
    </AdminLayout>
  );
}

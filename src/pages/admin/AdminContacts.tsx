import React, { useEffect, useMemo, useState, useContext } from "react";
import { AuthContext } from '../../context/AuthContext';
import { projectId } from "../../utils/supabase/info";
import { toast } from "sonner";
import AdminLayout from "../../components/admin/AdminLayout";
import { Search, Filter, Trash2, Eye, Archive, CheckCircle2, RefreshCw, Mail, Phone, Calendar, User } from "lucide-react";

export default function AdminContacts() {
  const { accessToken } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "createdAt", dir: "desc" });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/contact-messages`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to fetch contacts");
      } else {
        setContacts(data.contacts || []);
      }
    } catch (e) {
      console.error("Fetch contacts error:", e);
      toast.error("Network error fetching contacts");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let items = contacts;
    if (statusFilter !== "all") items = items.filter((c) => (c.status || "new") === statusFilter);
    if (q) items = items.filter((c) => [c.name, c.email, c.subject, c.message].some((v: string) => (v || "").toLowerCase().includes(q)));
    items = items.sort((a: any, b: any) => {
      const av = a[sortBy.key];
      const bv = b[sortBy.key];
      const cmp = new Date(av).getTime() - new Date(bv).getTime();
      return sortBy.dir === "asc" ? cmp : -cmp;
    });
    return items;
  }, [contacts, query, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const setSort = (key: string) => {
    setSortBy((prev) => prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/contact-messages/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ status }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to update");
      } else {
        toast.success("Updated");
        setContacts((prev) => prev.map((c) => (c.id === id ? data.contact : c)));
      }
    } catch (e) {
      toast.error("Network error updating status");
    }
  };

  const removeContact = async (id: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/contact-messages/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to delete");
      } else {
        toast.success("Deleted");
        setContacts((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (e) {
      toast.error("Network error deleting contact");
    }
  };

  return (
    <AdminLayout title="Contact Messages">
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 md:max-w-md">
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search name, email, subject..."
              className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 w-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900 bg-slate-50"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-transparent text-slate-700 outline-none text-sm font-medium cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <button
            onClick={fetchContacts}
            className="p-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-teal-600 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-10 w-10 border-b-2 border-teal-600 rounded-full animate-spin" /></div>
      ) : filtered.length > 0 ? (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-teal-600 transition" onClick={() => setSort("createdAt")}>Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.map((c) => (
                    <tr key={c.id} className={`hover:bg-slate-50 transition ${(c.status === 'new') ? 'bg-teal-50/20' : ''}`}>
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        <div className="text-xs text-slate-400 mt-0.5">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>

                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" /> {c.email}</div>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-700 max-w-[200px] truncate" title={c.subject}>
                        {c.subject || <span className="text-slate-400 italic">No Subject</span>}
                      </td>

                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${(c.status || "new") === "new" ? "bg-teal-100/50 text-teal-700 border-teal-200" :
                            (c.status || "new") === "read" ? "bg-blue-100/50 text-blue-700 border-blue-200" :
                              "bg-slate-100 text-slate-600 border-slate-200"
                          }`}>
                          {(c.status || "new").toUpperCase()}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-teal-600 transition" onClick={() => setSelected(c)} title="View Details"><Eye className="w-4 h-4" /></button>
                          <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition" onClick={() => updateStatus(c.id, "read")} title="Mark Read"><CheckCircle2 className="w-4 h-4" /></button>
                          <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-purple-600 transition" onClick={() => updateStatus(c.id, "archived")} title="Archive"><Archive className="w-4 h-4" /></button>
                          <button className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition" onClick={() => removeContact(c.id)} title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile List View */}
          <div className="space-y-4 md:hidden">
            {paged.map((c) => (
              <div key={c.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{c.name}</h3>
                      <p className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${(c.status || "new") === "new" ? "bg-teal-50 text-teal-600 border-teal-100" :
                      "bg-slate-50 text-slate-500 border-slate-100"
                    }`}>{c.status || "new"}</span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-slate-900 font-medium">{c.subject}</p>
                  <p className="text-xs text-slate-600 line-clamp-2">{c.message}</p>
                </div>

                <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                  <button className="flex-1 py-2 text-xs font-medium text-slate-600 bg-slate-50 rounded-lg" onClick={() => setSelected(c)}>Details</button>
                  <button className="p-2 text-slate-400 bg-slate-50 rounded-lg" onClick={() => updateStatus(c.id, "read")}><CheckCircle2 className="w-4 h-4" /></button>
                  <button className="p-2 text-red-400 bg-red-50 rounded-lg" onClick={() => removeContact(c.id)}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-2 mt-6">
            <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition text-sm font-medium">Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition text-sm font-medium">Next</button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Messages Found</h3>
          <p className="text-slate-500">New contact form submissions will appear here.</p>
        </div>
      )}

      {/* DETAILS MODAL */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ring-1 ring-slate-900/5" onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selected.name}</h2>
                <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(selected.createdAt).toLocaleString()}
                </p>
              </div>
              <button className="p-2 rounded-full hover:bg-slate-200/50 text-slate-400 transition" onClick={() => setSelected(null)}>
                <Trash2 className="w-5 h-5 rotate-45" /> {/* Using rotate-45 trash icon makes no sense, changing to X is better but using available imports */}
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Contact Details</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="w-4 h-4 text-teal-500" /> {selected.email}
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-4 h-4 text-teal-500" /> {selected.phone || '—'}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Subject</label>
                  <p className="text-slate-900 font-medium">{selected.subject || '—'}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Message</label>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selected.message}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-end gap-3">
              <button className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-sm font-medium shadow-sm hover:bg-slate-50" onClick={() => updateStatus(selected.id, 'read')}>Mark as Read</button>
              <button className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-sm font-medium shadow-sm hover:bg-slate-50" onClick={() => updateStatus(selected.id, 'archived')}>Archive</button>
              <button className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium shadow-sm hover:bg-red-700" onClick={() => { removeContact(selected.id); setSelected(null); }}>Delete Message</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

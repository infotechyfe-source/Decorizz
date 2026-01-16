import React, { useEffect, useState, useContext } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { AuthContext } from '../../context/AuthContext';
import { projectId } from "../../utils/supabase/info";
import { Search, User, Mail, Calendar } from "lucide-react";

export default function AdminUsers() {
  const { accessToken, isLoading } = useContext(AuthContext);

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [initLoading, setInitLoading] = useState(false);

  useEffect(() => {
    if (isLoading || !accessToken) return;
    fetchUsers();
  }, [isLoading, accessToken]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/users`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load users');
      setUsers(data.users || []);
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  const initDefaultUsers = async () => {
    try {
      setInitLoading(true);
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/auth/init-admin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      await res.json();
      await fetchUsers();
    } catch (e) {
      console.error('Init admin error:', e);
    } finally {
      setInitLoading(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Manage Users">
      {/* Search Bar */}
      <div className="bg-white shadow-sm rounded-xl p-4 mb-6 flex items-center gap-3 border border-slate-200 ring-1 ring-slate-100">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full outline-none text-slate-900 placeholder-slate-400 bg-transparent"
        />
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 border-b-2 border-teal-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="inline-flex bg-slate-100 p-4 rounded-full mb-4">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 text-lg">No users found.</p>
          <div className="mt-6">
            <button onClick={initDefaultUsers} className="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold" disabled={initLoading}>
              {initLoading ? 'Initializing...' : 'Initialize Default Users'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Joined At</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 transition"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                          <User className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-slate-900">{user.name || "Unnamed User"}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        {user.email}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                          : "-"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

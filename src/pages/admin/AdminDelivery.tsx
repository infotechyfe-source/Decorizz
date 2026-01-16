import React, { useState, useEffect, useContext } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AuthContext } from '../../context/AuthContext';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { Truck, CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDelivery() {
  const { accessToken } = useContext(AuthContext);

  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/deliveries`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const data = await response.json();
      setDeliveries(data.deliveries || []);
    } catch (error) {
      console.error('Fetch deliveries error:', error);
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, status: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/deliveries/${deliveryId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (response.ok) {
        toast.success('Delivery status updated');
        fetchDeliveries();
      } else {
        toast.error('Failed to update delivery');
      }
    } catch (error) {
      console.error('Update delivery error:', error);
      toast.error('Failed to update delivery');
    }
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch =
      delivery.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.orderId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const completedCount = deliveries.filter((p) => p.status === 'completed').length;
  const pendingCount = deliveries.filter((p) => p.status === 'pending').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-600" />;
      default: return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <AdminLayout title="Delivery Management">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Total Deliveries</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{deliveries.length}</p>
          </div>
          <div className="flex items-center gap-2 text-teal-600 text-sm font-medium">
            <Truck className="w-4 h-4" /> All Shipments
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Delivered</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{completedCount}</p>
          </div>
          <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> Successful
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
          </div>
          <div className="flex items-center gap-2 text-yellow-700 text-sm font-medium">
            <Clock className="w-4 h-4" /> In Transit
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by ID, Order ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative w-full md:w-64">
          <Filter className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
          <select
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 appearance-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Deliveries Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 border-b-2 rounded-full animate-spin border-teal-600" />
        </div>
      ) : filteredDeliveries.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No deliveries found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Delivery ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 font-mono">
                      {delivery.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                      {delivery.orderId ? '#' + delivery.orderId.slice(0, 6) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 capitalize">
                      {delivery.deliveryMethod || 'Standard'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(delivery.status)}`}>
                        {getStatusIcon(delivery.status)}
                        <span className="capitalize">{delivery.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(delivery.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-sm"
                        value={delivery.status}
                        onChange={(e) => updateDeliveryStatus(delivery.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                      </select>
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

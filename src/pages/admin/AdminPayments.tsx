import React, { useState, useEffect, useContext } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AuthContext } from '../../context/AuthContext';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { IndianRupee, CreditCard, CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPayments() {
  const { accessToken } = useContext(AuthContext);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/payments`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const data = await response.json();
      setPayments(data.payments || []);
    } catch (error) {
      console.error('Fetch payments error:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId: string, status: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/payments/${paymentId}`,
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
        toast.success('Payment status updated');
        fetchPayments();
      } else {
        toast.error('Failed to update payment');
      }
    } catch (error) {
      console.error('Update payment error:', error);
      toast.error('Failed to update payment');
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.paymentId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const completedAmount = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingAmount = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <AdminLayout title="Payment Management">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Total Revenue</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">₹{totalAmount.toFixed(2)}</p>
          </div>
          <div className="flex items-center gap-2 text-teal-600 text-sm font-medium">
            <IndianRupee className="w-4 h-4" /> All Transactions
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Completed</p>
            <p className="text-3xl font-bold text-green-600 mt-1">₹{completedAmount.toFixed(2)}</p>
          </div>
          <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> Successful
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 mt-1">₹{pendingAmount.toFixed(2)}</p>
          </div>
          <div className="flex items-center gap-2 text-yellow-700 text-sm font-medium">
            <Clock className="w-4 h-4" /> Processing
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by Payment ID, Order ID..."
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

      {/* Payments Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 border-b-2 rounded-full animate-spin border-teal-600" />
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No payments found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Payment ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 font-mono">
                      {payment.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                      {payment.orderId ? '#' + payment.orderId.slice(0, 6) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      ₹{payment.amount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 capitalize">
                      {payment.paymentMethod}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        <span className="capitalize">{payment.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-sm"
                        value={payment.status}
                        onChange={(e) => updatePaymentStatus(payment.id, e.target.value)}
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

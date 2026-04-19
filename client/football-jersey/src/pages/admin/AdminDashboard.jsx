import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, revenue: 0 });
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      setStats(res.data.stats);
      
      if (res.data.chartData) {
        setChartData({
          labels: res.data.chartData.labels,
          datasets: [
            {
              label: 'Revenue (₹)',
              data: res.data.chartData.sales,
              borderColor: '#00FF66', // Brand Primary Color mapped
              backgroundColor: 'rgba(0, 255, 102, 0.1)',
              borderWidth: 2,
              pointBackgroundColor: '#181A1B',
              pointBorderColor: '#00FF66',
              fill: true,
              tension: 0.4
            },
          ],
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#181A1B',
        titleColor: '#fff',
        bodyColor: '#00FF66',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#a1a1aa' } // text-text-secondary
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#a1a1aa' }
      }
    }
  };

  if (loading) {
    return <div className="text-white">Loading dashboard...</div>;
  }

  return (
    <div className="text-white">
      <h2 className="kinetic-heading text-2xl tracking-widest text-brand-primary mb-6">Dashboard Overview</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Products', value: stats.products || 0 },
          { label: 'Total Orders', value: stats.orders || 0 },
          { label: 'Total Users', value: stats.users || 0 },
          { label: 'Revenue', value: `₹${(Number(stats.revenue) || 0).toLocaleString()}` },
        ].map((stat, i) => (
          <div key={i} className="bg-surface-low border border-white/10 p-6 rounded-lg text-center shadow-lg hover:border-brand-primary/50 transition">
            <p className="text-text-secondary font-inter mb-2 text-sm">{stat.label}</p>
            <h3 className="text-3xl font-bold kinetic-heading drop-shadow-[0_0_10px_rgba(0,255,102,0.3)]">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-surface-low border border-white/10 p-6 rounded-lg shadow-lg">
        <h3 className="kinetic-heading text-xl mb-4">Revenue Overview (Recent)</h3>
        <div className="h-80 w-full">
          {chartData ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="h-full flex items-center justify-center text-text-secondary">No chart data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

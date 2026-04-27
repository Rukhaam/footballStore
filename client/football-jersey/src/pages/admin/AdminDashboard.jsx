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
import { Package, ShoppingBag, Users, TrendingUp } from 'lucide-react';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
              borderColor: '#00FF66', // Brand Primary Color
              backgroundColor: 'rgba(0, 255, 102, 0.08)', // Very subtle fill
              borderWidth: 3,
              pointBackgroundColor: '#00FF66',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 0, // Hides points until hover for a slicker line
              pointHoverRadius: 6,
              fill: true,
              tension: 0.4 // Smooth curves
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
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(24, 26, 27, 0.9)',
        titleColor: '#a1a1aa',
        titleFont: { family: 'Inter', size: 12 },
        bodyColor: '#00FF66',
        bodyFont: { family: 'Inter', size: 14, weight: 'bold' },
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => `₹${context.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        grid: { 
          display: false, 
          drawBorder: false 
        },
        ticks: { 
          color: '#71717a',
          font: { family: 'Inter' },
          padding: 10
        } 
      },
      y: {
        border: { display: false },
        grid: { 
          color: 'rgba(255,255,255,0.03)',
          drawBorder: false,
          tickLength: 0,
          borderDash: [5, 5] // Aesthetic dashed grid lines
        },
        ticks: { 
          color: '#71717a',
          font: { family: 'Inter' },
          padding: 10,
          callback: (value) => `₹${value}`
        }
      }
    }
  };

  const statCards = [
    { label: 'Total Products', value: stats.products || 0, icon: Package, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Total Orders', value: stats.orders || 0, icon: ShoppingBag, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Total Users', value: stats.users || 0, icon: Users, color: 'text-pink-400', bg: 'bg-pink-400/10' },
    { label: 'Total Revenue', value: `₹${(Number(stats.revenue) || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-10 h-10 border-4 border-surface-high border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="text-white w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="kinetic-heading text-3xl md:text-4xl tracking-wider text-white uppercase mb-1">
            Dashboard <span className="text-brand-primary">Overview</span>
          </h2>
          <p className="text-text-secondary font-inter text-sm">Monitor your store's performance and analytics.</p>
        </div>
      </div>
      
      {/* STATS GRID - Glassmorphic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div 
              key={i} 
              className="group relative overflow-hidden bg-surface-low/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:border-white/10 transition-all duration-500"
            >
              {/* Subtle hover glow */}
              <div className="absolute -inset-px bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              <div className="flex items-start justify-between relative z-10">
                <div className="flex flex-col gap-4">
                  <div className={`p-3 rounded-2xl w-fit ${stat.bg} ${stat.color} border border-white/5`}>
                    <Icon size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black font-inter tracking-tight text-white mb-1 drop-shadow-md">
                      {stat.value}
                    </h3>
                    <p className="text-text-secondary font-inter text-xs uppercase tracking-widest font-bold">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CHART SECTION - Glassmorphic Container */}
      <div className="bg-surface-low/40 backdrop-blur-xl border border-white/5 p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative overflow-hidden">
        {/* Ambient background glow for the chart */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="kinetic-heading text-xl uppercase tracking-widest text-white">Revenue Timeline</h3>
              <p className="text-text-secondary font-inter text-sm mt-1">Daily sales performance</p>
            </div>
            <div className="px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold font-inter uppercase tracking-widest">
              Live Data
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            {chartData ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-secondary gap-3">
                <TrendingUp size={32} className="opacity-50" />
                <span className="font-inter text-sm">No sales data available yet.</span>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
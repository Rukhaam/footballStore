import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Package, FolderTree, Flag, ShoppingBag, Ticket } from 'lucide-react';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);  

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Categories', path: '/admin/categories', icon: FolderTree },
    { name: 'Collections', path: '/admin/collections', icon: Flag },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Coupons', path: '/admin/coupons', icon: Ticket },
  ];

  return (
    <div className="flex h-screen bg-[#050505] text-white font-inter overflow-hidden relative">
      
      {/* MOBILE OVERLAY */}
      {/* Clicking this dark overlay closes the sidebar on mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 flex-shrink-0 border-r border-white/10 bg-[#0a0a0a] transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col pt-6 pb-4 overflow-y-auto custom-scrollbar">
          
          <div className="flex items-center justify-between px-6 mb-10">
            <span className="kinetic-heading text-2xl tracking-wider text-white">
              KINETIC <span className="text-brand-primary">ADMIN</span>
            </span>
            {/* Close button for mobile inside sidebar */}
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-text-secondary hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
          
          <nav className="flex-1 px-4 space-y-2">
            <p className="px-2 text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Management</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)} // Auto-close on mobile when a link is clicked
                  end={item.path === '/admin'}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                        : 'text-text-secondary hover:bg-white/5 hover:text-white border border-transparent'
                    }`
                  }
                >
                  <Icon size={18} className="opacity-80 group-hover:opacity-100" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
          
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface-base">
        
        {/* Mobile Header - Contains the Hamburger Menu */}
        <header className="md:hidden flex items-center justify-between px-4 h-16 border-b border-white/10 bg-[#0a0a0a] z-30 shrink-0">
          <span className="kinetic-heading text-lg tracking-wider text-white">
            KINETIC <span className="text-brand-primary">ADMIN</span>
          </span>
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="p-2 rounded-md text-text-secondary hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white/5"
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};

export default AdminLayout;
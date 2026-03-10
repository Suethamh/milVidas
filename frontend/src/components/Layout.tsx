import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { BookOpen, LayoutDashboard, Library, Search, Heart, BarChart3, Menu, X, BookCheck } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/biblioteca', label: 'Biblioteca', icon: Library },
  { to: '/buscar', label: 'Buscar Livros', icon: Search },
  { to: '/wishlist', label: 'Lista de Desejos', icon: Heart },
  { to: '/proximas', label: 'Proximas Leituras', icon: BookOpen },
  { to: '/ja-lidos', label: 'Ja Lidos', icon: BookCheck },
  { to: '/estatisticas', label: 'Estatisticas', icon: BarChart3 },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Mobile/Tablet Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-xl border-b border-border flex items-center px-3 sm:px-4 z-30">
        <button onClick={() => setSidebarOpen(true)} className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
          <Menu size={22} className="text-text" />
        </button>
        <div className="flex items-center gap-2 ml-2 sm:ml-3">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <BookOpen className="text-white" size={16} />
          </div>
          <span className="text-lg font-bold text-primary">MilVidas</span>
        </div>
      </header>

      {/* Backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed h-full z-50 bg-white/90 lg:bg-white/20 backdrop-blur-xl border-r border-border lg:border-white/20 flex flex-col
        transition-transform duration-300 ease-in-out
        w-60
        lg:translate-x-0 lg:z-10
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary lg:bg-white/25 flex items-center justify-center">
              <BookOpen className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold text-primary lg:text-white">MilVidas</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-gray-100 cursor-pointer">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 flex flex-col gap-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-bg lg:bg-white/25 text-primary lg:text-white lg:font-semibold'
                    : 'text-text-secondary lg:text-white/70 hover:bg-gray-50 lg:hover:bg-white/15 hover:text-text lg:hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border lg:border-white/20">
          <p className="text-xs text-text-secondary lg:text-white/50 text-center">MilVidas v1.0</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-60 pt-16 lg:pt-8 px-3 pb-4 md:p-6 lg:p-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

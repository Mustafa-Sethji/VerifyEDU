import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Bell, Search, User, Sparkles, Check, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ title = 'Dashboard' }) => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-20 px-8 flex items-center justify-between">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-['Outfit']">{title}</h1>
        {/* <p className="text-xs text-gray-500">Welcome back, {user?.name || 'User'} 👋</p> */}
      </div>

      {/* Action Items */}
      <div className="flex items-center gap-4">
        
        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-purple-500/50 transition-all relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-600 text-gray-900 font-bold text-[10px] flex items-center justify-center border-2 border-[#0B0F19]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-gray-50 border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-green-600 hover:text-green-600 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-gray-800/50">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3.5 hover:bg-gray-50/50 transition-all cursor-pointer ${
                        !n.isRead ? 'bg-green-50/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-xs font-semibold text-gray-700">{n.title}</p>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                      <span className="text-[10px] text-gray-500 mt-1 block">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Quick Link */}
        <div
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 pl-2 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-600 to-emerald-600 p-0.5 group-hover:shadow-lg group-hover:shadow-purple-500/30 transition-all">
            <div className="w-full h-full bg-gray-50 rounded-[10px] flex items-center justify-center font-bold text-green-600">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'purple', trend, subtitle }) => {
  const colorStyles = {
    purple: 'from-green-600 to-emerald-600 shadow-purple-500/20 text-green-600',
    blue: 'from-emerald-600 to-cyan-600 shadow-blue-500/20 text-green-600',
    emerald: 'from-emerald-600 to-teal-600 shadow-emerald-500/20 text-emerald-400',
    amber: 'from-amber-600 to-orange-600 shadow-amber-500/20 text-amber-400',
  };

  return (
    <div className="glass-card p-6 rounded-2xl glass-card-hover border border-gray-200/80 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-extrabold text-gray-900 mt-2 tracking-tight font-['Outfit']">
            {value}
          </h3>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md mt-2 border border-emerald-800/40">
              {trend}
            </span>
          )}
        </div>

        {Icon && (
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
              colorStyles[color] || colorStyles.purple
            } p-0.5 flex items-center justify-center shadow-lg`}
          >
            <div className="w-full h-full bg-gray-50/90 rounded-[14px] flex items-center justify-center">
              <Icon className="w-7 h-7" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

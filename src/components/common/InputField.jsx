import React from 'react';

export const InputField = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = "text", 
  required = false, 
  icon: Icon 
}) => (
  <div>
    <label className="block text-slate-300 text-sm font-medium mb-2">
      {Icon && <Icon size={16} className="inline mr-1" />}
      {label} {required && '*'}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
    />
  </div>
);
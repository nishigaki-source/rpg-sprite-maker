import React from 'react';

export const SubColorSelector = ({ value, options, onChange }) => (
  <div className="flex flex-wrap gap-1 mt-1 pl-2 border-l-2 border-gray-200">
    {options.map((color, idx) => (
      <button
        key={idx}
        onClick={() => onChange(color)}
        className={`w-4 h-4 rounded-full border border-gray-300 ${value === color ? 'border-black ring-1 ring-blue-200' : ''}`}
        style={{ backgroundColor: color }}
      />
    ))}
  </div>
);

export const Selector = ({ label, value, options, onChange, type = 'index', subSelector = null, category = '', disabled = false }) => {
  return (
      <div className={`mb-4 transition-opacity ${disabled ? 'opacity-30 pointer-events-none' : ''}`}>
      <div className="flex justify-between items-center mb-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      </div>
      <div className="flex flex-col gap-2">
          {type === 'color' ? (
          <div className="flex flex-wrap gap-2">
              {options.map((color, idx) => (
              <button
                  key={idx}
                  onClick={() => onChange(color)}
                  className={`w-6 h-6 rounded-full border border-gray-300 transition-transform hover:scale-110 ${value === color ? 'border-2 border-black scale-110 shadow-md ring-2 ring-blue-100' : ''}`}
                  style={{ backgroundColor: color }}
                  title={color}
                  disabled={disabled}
              />
              ))}
          </div>
          ) : (
          <select
              value={value}
              onChange={(e) => onChange(parseInt(e.target.value))}
              disabled={disabled}
              className="w-full p-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
          >
              {options.map((opt, idx) => (
                <option key={idx} value={idx}>
                  {opt}
                </option>
              ))}
          </select>
          )}
          {subSelector}
      </div>
      </div>
  );
};
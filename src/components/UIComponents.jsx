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

export const Selector = ({
  label,
  value,
  options,
  onChange,
  type = 'index',
  subSelector = null,
  category = '',
  disabled = false,
}) => {
  const isObjectOptions = Array.isArray(options) && options.length > 0 && typeof options[0] === 'object' && options[0] !== null;

  const getOptionValue = (opt, idx) => (isObjectOptions ? opt.value : idx);
  const getOptionLabel = (opt) => (isObjectOptions ? opt.label : opt);

  const handleSelectChange = (e) => {
    const raw = e.target.value;
    if (type === 'value') {
      onChange(raw);
      return;
    }
    // default: numeric index
    onChange(parseInt(raw, 10));
  };

  const handleBoolChange = (e) => {
    onChange(!!e.target.checked);
  };

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
      ) : type === 'boolean' ? (
        <label className="inline-flex items-center gap-2 select-none">
          <input
            type="checkbox"
            checked={!!value}
            onChange={handleBoolChange}
            disabled={disabled}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700">{label}</span>
        </label>
      ) : (
        <select
          value={value}
          onChange={handleSelectChange}
          disabled={disabled}
          className="w-full p-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
        >
          {options.map((opt, idx) => (
            <option key={idx} value={getOptionValue(opt, idx)}>
              {getOptionLabel(opt)}
            </option>
          ))}
        </select>
      )}
      {subSelector}
    </div>
  </div>
  );
};
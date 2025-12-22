import React from "react";

type Props = {
  id: string;
  type: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
};

export const LoginInput = ({
  id,
  type,
  label,
  value,
  onChange,
  placeholder,
  className = "",
}: Props) => {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-xs font-bold text-gray-500 mb-2 tracking-wide"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-md bg-white/60 border border-transparent text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-300 transition-all shadow-sm"
        required
      />
    </div>
  );
};

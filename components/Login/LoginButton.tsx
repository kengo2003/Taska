import React from 'react';

type Props = {
  isLoading: boolean;
};

export const LoginButton = ({ isLoading }: Props) => {
  return (
    <div className="flex justify-center">
      <button
        type="submit"
        disabled={isLoading}
        className="bg-gradient-to-r from-[#22d3ee] to-[#0ea5e9] hover:from-[#06b6d4] hover:to-[#0284c7] text-white font-bold py-2 px-10 rounded-md shadow-md transform transition hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? '処理中...' : 'ログイン'}
      </button>
    </div>
  );
};
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LoginInput } from '@/components/Login/LoginInput';
import { LoginButton } from '@/components/Login/LoginButton';

export default function LoginBase() {
  const router = useRouter(); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // デモ用の待機時間
      await new Promise(resolve => setTimeout(resolve, 800));

      // --- ログイン判定ロジック ---
      if (email === 'test@test.com' && password === 'test') {
        // ログイン成功 -> ホームへ遷移
        router.push('/'); 
      } else {
        throw new Error('IDまたはパスワードが間違っています');
      }
      
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
      alert('ログインに失敗しました\nIDまたはパスワードを確認してください');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-white via-[#EBF5FF] to-[#A6D6F3]">
      
      {/* ロゴエリア */}
      <div className="mb-12 relative w-64 h-20">
        <Image 
          src="/TaskaLogo.png" 
          alt="Taska Logo" 
          fill 
          className="object-contain"
          priority
        />
      </div>

      {/* 入力フォームエリア */}
      <form onSubmit={handleLogin} className="w-full max-w-sm px-8">
        
        <LoginInput
          id="email"
          type="email"
          label="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="xxx@hcs.ac.jp"
          className="mb-6"
        />

        <LoginInput
          id="password"
          type="password"
          label="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="xxxxxxxx"
          className="mb-10"
        />

        <LoginButton isLoading={isLoading} />

      </form>
    </div>
  );
}
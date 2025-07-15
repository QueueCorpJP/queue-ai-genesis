
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAdmin();

  useEffect(() => {
    // 管理者が認証済みの場合はダッシュボードにリダイレクト
    if (user?.isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    } else {
      // 未認証の場合はログインページにリダイレクト
      navigate('/admin/login', { replace: true });
    }
  }, [user, navigate]);

  // リダイレクト中の表示
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-navy-800 mb-4">管理者ページ</h1>
        <p className="text-gray-600">リダイレクト中...</p>
      </div>
    </div>
  );
};

export default Admin;


import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';

const Admin = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAdmin();

  useEffect(() => {
    // ローディング中は何もしな
    if (isLoading) return;
    
    // 管理者が認証済みの場合はダッシュボードにリダイレクト
    if (user?.isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    } else {
      // 未認証の場合はログインページにリダイレクト
      navigate('/admin/login', { replace: true });
    }
  }, [user, isLoading, navigate]);

  // 認証状態確認中またはリダイレクト中
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-navy-800 mb-4">管理者ページ</h1>
        <p className="text-gray-600">
          {isLoading ? '認証状態を確認中...' : 'リダイレクト中...'}
        </p>
      </div>
    </div>
  );
};
//g
export default Admin;

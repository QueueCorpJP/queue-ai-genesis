
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminHeaderProps {
  onLogout: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onLogout }) => {
  return (
    <header className="bg-navy-800 text-white py-4 shadow-md">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Queue管理ダッシュボード</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-navy-700">
              <Home className="mr-2 h-4 w-4" />
              サイトへ戻る
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:text-white hover:bg-navy-700"
            onClick={onLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            ログアウト
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;

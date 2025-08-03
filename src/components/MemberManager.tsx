import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  UserPlus, 
  Users, 
  Crown, 
  Briefcase, 
  Shield, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  UserCheck,
  UserX,
  Clock,
  Activity
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAdmin } from '@/contexts/AdminContext';

interface Member {
  id: string;
  email: string;
  name: string;
  role: 'employee' | 'executive';
  department?: string;
  position?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
  login_count: number;
  created_by_name?: string;
  total_activities: number;
  last_activity_at?: string;
}

interface MemberStats {
  total_members: number;
  total_executives: number;
  total_employees: number;
  active_members: number;
  inactive_members: number;
  recently_active_members: number;
  new_members_this_month: number;
}

interface CreateMemberForm {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
  role: 'employee' | 'executive';
  department: string;
  position: string;
  phone: string;
}

const MemberManager: React.FC = () => {
  const { user } = useAdmin();
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState<CreateMemberForm>({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    department: '',
    position: '',
    phone: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'employee' | 'executive'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // 役員権限チェック
  const isExecutive = user?.email === 'queue@queue-tech.jp';

  useEffect(() => {
    if (isExecutive) {
      fetchMembers();
      fetchStats();
    }
  }, [isExecutive]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('member_activity_summary')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('メンバー情報の取得に失敗しました');
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('member_stats')
        .select('*')
        .single();

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
      role: 'employee',
      department: '',
      position: '',
      phone: ''
    });
    setEditingMember(null);
  };

  const handleCreateMember = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error('パスワードが一致しません');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('パスワードは8文字以上で入力してください');
      return;
    }

    try {
      // パスワードハッシュ化とメンバー作成
      const { data, error } = await supabase.rpc('hash_password', {
        plain_password: formData.password
      });

      if (error) throw error;

      const hashedPassword = data;

      const { error: insertError } = await supabase
        .from('members')
        .insert({
          email: formData.email,
          password_hash: hashedPassword,
          name: formData.name,
          role: formData.role,
          department: formData.department || null,
          position: formData.position || null,
          phone: formData.phone || null,
          created_by: user?.id // 現在ログイン中の役員のID
        });

      if (insertError) throw insertError;

      // アクティビティログ記録
      await supabase
        .from('member_activity_logs')
        .insert({
          member_id: (await supabase.from('members').select('id').eq('email', formData.email).single()).data?.id,
          action: 'created',
          details: {
            role: formData.role,
            department: formData.department,
            position: formData.position
          },
          performed_by: user?.id
        });

      toast.success('メンバーを作成しました');
      setCreateDialogOpen(false);
      resetForm();
      fetchMembers();
      fetchStats();
    } catch (error: any) {
      console.error('Error creating member:', error);
      if (error.code === '23505') {
        toast.error('このメールアドレスは既に使用されています');
      } else {
        toast.error('メンバーの作成に失敗しました');
      }
    }
  };

  const handleToggleStatus = async (member: Member) => {
    try {
      const newStatus = !member.is_active;
      
      const { error } = await supabase
        .from('members')
        .update({ is_active: newStatus })
        .eq('id', member.id);

      if (error) throw error;

      // アクティビティログ記録
      await supabase
        .from('member_activity_logs')
        .insert({
          member_id: member.id,
          action: newStatus ? 'reactivated' : 'deactivated',
          details: {
            previous_status: member.is_active,
            new_status: newStatus
          },
          performed_by: user?.id
        });

      toast.success(`メンバーを${newStatus ? '有効' : '無効'}にしました`);
      fetchMembers();
      fetchStats();
    } catch (error) {
      console.error('Error toggling member status:', error);
      toast.error('ステータスの変更に失敗しました');
    }
  };

  const handleDeleteMember = async (member: Member) => {
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', member.id);

      if (error) throw error;

      toast.success('メンバーを削除しました');
      fetchMembers();
      fetchStats();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('メンバーの削除に失敗しました');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未ログイン';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role: string) => {
    return role === 'executive' ? (
      <Badge variant="default" className="bg-purple-100 text-purple-800">
        <Crown className="w-3 h-3 mr-1" />
        役員
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
        <Briefcase className="w-3 h-3 mr-1" />
        社員
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <UserCheck className="w-3 h-3 mr-1" />
        有効
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-800">
        <UserX className="w-3 h-3 mr-1" />
        無効
      </Badge>
    );
  };

  // フィルタリング
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && member.is_active) ||
                         (statusFilter === 'inactive' && !member.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (!isExecutive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-red-500" />
            アクセス権限エラー
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            この機能は役員アカウント（queue@queue-tech.jp）でのみご利用いただけます。
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">読み込み中...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 統計カード */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総メンバー数</p>
                  <div className="text-2xl font-bold">{stats.total_members}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Crown className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">役員</p>
                  <div className="text-2xl font-bold">{stats.total_executives}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Briefcase className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">社員</p>
                  <div className="text-2xl font-bold">{stats.total_employees}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">アクティブ</p>
                  <div className="text-2xl font-bold">{stats.active_members}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* メンバー管理 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                メンバー管理
              </CardTitle>
              <CardDescription>
                社員および役員アカウントの作成・管理
              </CardDescription>
            </div>
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  メンバー作成
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>新しいメンバーを作成</DialogTitle>
                  <DialogDescription>
                    社員または役員アカウントを作成します
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">名前 *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="山田太郎"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">メールアドレス *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="example@queue-tech.jp"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">パスワード *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="8文字以上"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">パスワード確認 *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="同じパスワードを入力"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">アカウント種別 *</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as 'employee' | 'executive' }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">
                          <div className="flex items-center">
                            <Briefcase className="w-4 h-4 mr-2" />
                            社員アカウント
                          </div>
                        </SelectItem>
                        <SelectItem value="executive">
                          <div className="flex items-center">
                            <Crown className="w-4 h-4 mr-2" />
                            役員アカウント
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department">部署</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                        placeholder="開発部"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">役職</Label>
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                        placeholder="エンジニア"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">電話番号</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="090-1234-5678"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetForm(); }}>
                    キャンセル
                  </Button>
                  <Button onClick={handleCreateMember}>
                    作成
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {/* フィルター */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="名前、メール、部署で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全ての役職</SelectItem>
                <SelectItem value="executive">役員</SelectItem>
                <SelectItem value="employee">社員</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全てのステータス</SelectItem>
                <SelectItem value="active">有効</SelectItem>
                <SelectItem value="inactive">無効</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* メンバーテーブル */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>メール</TableHead>
                  <TableHead>役職</TableHead>
                  <TableHead>部署・役職</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>最終ログイン</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {member.department && <div>{member.department}</div>}
                        {member.position && <div className="text-gray-500">{member.position}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(member.is_active)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(member.last_login_at)}</div>
                        <div className="text-gray-500">
                          ログイン {member.login_count}回
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(member)}
                        >
                          {member.is_active ? (
                            <>
                              <UserX className="w-4 h-4 mr-1" />
                              無効化
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-1" />
                              有効化
                            </>
                          )}
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>メンバーを削除しますか？</AlertDialogTitle>
                              <AlertDialogDescription>
                                {member.name}（{member.email}）を削除します。
                                この操作は取り消すことができません。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteMember(member)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                削除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              条件に一致するメンバーが見つかりません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberManager; 
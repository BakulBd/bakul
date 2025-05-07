'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import { User, Profile } from '@/types/supabase';

export default function AdminUsersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const supabase = createClientComponentClient();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').order('name', { ascending: true });
    if (!error) setUsers(data as Profile[] || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const fetchUserAndProfiles = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = '/login';
        return;
      }
      
      setUser(data.user as User);
      const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      setProfile(myProfile as Profile);
      
      if (myProfile?.role === 'admin') {
        fetchUsers();
      } else {
        setLoading(false);
      }
    };

    fetchUserAndProfiles();
  }, [supabase, fetchUsers]);

  async function handleRoleChange(id: string, newRole: 'admin' | 'user') {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    if (error) {
      setToast({ message: error.message, type: 'error' });
    } else {
      setToast({ message: 'Role updated!', type: 'success' });
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setToast(null), 3000);
      fetchUsers();
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (profile?.role !== 'admin') return <div className="text-center py-12 text-red-500">Access denied. You need admin privileges to view this page.</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow p-6 mt-8">
      {toast && (
        <div className={`mb-4 px-4 py-2 rounded text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.message}</div>
      )}
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      {users.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No users found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-lg overflow-hidden">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b dark:border-gray-700">
                  <td className="px-4 py-2 flex items-center gap-2">
                    {u.avatar_url ? (
                      <div className="relative w-8 h-8">
                        <Image 
                          src={u.avatar_url} 
                          alt={`${u.name}'s avatar`} 
                          fill 
                          className="rounded-full object-cover" 
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300">
                        {u.name?.[0] || '?'}
                      </div>
                    )}
                    <span>{u.name || '-'}</span>
                  </td>
                  <td className="px-4 py-2">{u.email || u.id}</td>
                  <td className="px-4 py-2">{u.role}</td>
                  <td className="px-4 py-2">
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value as 'admin' | 'user')}
                      className="px-2 py-1 rounded border dark:bg-gray-800"
                      disabled={u.id === user?.id}
                      aria-label={`Change role for ${u.name || 'user'}`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
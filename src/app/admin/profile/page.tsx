'use client';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import { User, Profile } from '@/types/supabase';

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = '/login';
        return;
      }
      
      setUser(data.user as User);
      // If no profile, create one
      let { data: profileData } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      if (!profileData) {
        const { data: newProfile } = await supabase.from('profiles').insert([{ 
          id: data.user.id, 
          name: '', 
          avatar_url: '', 
          role: 'user',
          email: data.user.email
        }]).select().single();
        profileData = newProfile;
      }
      setProfile(profileData as Profile);
      setLoading(false);
    };

    fetchProfile();
  }, [supabase]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !user) return;

    setSaving(true);
    const { error } = await supabase.from('profiles').update({ 
      name: profile.name, 
      avatar_url: profile.avatar_url 
    }).eq('id', user.id);
    
    setSaving(false);
    if (error) {
      setToast({ message: error.message, type: 'error' });
    } else {
      setToast({ message: 'Profile updated!', type: 'success' });
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setToast(null), 3000);
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-lg shadow p-8 mt-8">
      {toast && (
        <div className={`mb-4 px-4 py-2 rounded text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.message}</div>
      )}
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex flex-col items-center gap-2 mb-4">
          <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-3xl font-bold text-indigo-600 dark:text-indigo-300 overflow-hidden">
            {profile?.avatar_url ? (
              <div className="relative w-20 h-20">
                <Image 
                  src={profile.avatar_url} 
                  alt="User avatar" 
                  fill
                  className="object-cover" 
                />
              </div>
            ) : (
              profile?.name?.[0] || user?.email?.[0]
            )}
          </div>
        </div>
        <label className="block font-semibold">Name</label>
        <input
          className="w-full px-3 py-2 rounded border dark:bg-gray-800"
          value={profile?.name || ''}
          onChange={e => setProfile(profile ? { ...profile, name: e.target.value } : null)}
          placeholder="Your Name"
        />
        <label className="block font-semibold">Avatar URL</label>
        <input
          className="w-full px-3 py-2 rounded border dark:bg-gray-800"
          value={profile?.avatar_url || ''}
          onChange={e => setProfile(profile ? { ...profile, avatar_url: e.target.value } : null)}
          placeholder="Avatar Image URL"
        />
        <label className="block font-semibold">Role</label>
        <input
          className="w-full px-3 py-2 rounded border dark:bg-gray-800 text-gray-400"
          value={profile?.role || 'user'}
          disabled
        />
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition mt-4"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
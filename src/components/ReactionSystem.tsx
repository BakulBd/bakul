'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ReactionType, Reaction } from '@/types/supabase';

interface ReactionSystemProps {
  postId: string;
}

const reactionEmojis: Record<ReactionType, string> = {
  like: '👍',
  love: '❤️',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😠'
};

const reactionLabels: Record<ReactionType, string> = {
  like: 'Like',
  love: 'Love',
  laugh: 'Laugh',
  wow: 'Wow',
  sad: 'Sad',
  angry: 'Angry'
};

export default function ReactionSystem({ postId }: ReactionSystemProps) {
  const [reactions, setReactions] = useState<Record<ReactionType, number>>({
    like: 0,
    love: 0,
    laugh: 0,
    wow: 0,
    sad: 0,
    angry: 0
  });
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  // Get user's IP address for tracking reactions
  const getUserIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  useEffect(() => {
    fetchReactions();
    checkUserReaction();
  }, [postId]);

  const fetchReactions = async () => {
    try {
      const { data, error } = await supabase
        .from('reactions')
        .select('reaction_type')
        .eq('post_id', postId);

      if (error) throw error;

      const reactionCounts: Record<ReactionType, number> = {
        like: 0,
        love: 0,
        laugh: 0,
        wow: 0,
        sad: 0,
        angry: 0
      };

      data?.forEach((reaction: Reaction) => {
        reactionCounts[reaction.reaction_type]++;
      });

      setReactions(reactionCounts);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const checkUserReaction = async () => {
    try {
      const userIP = await getUserIP();
      const { data, error } = await supabase
        .from('reactions')
        .select('reaction_type')
        .eq('post_id', postId)
        .eq('user_ip', userIP)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setUserReaction(data.reaction_type as ReactionType);
      }
    } catch (error) {
      console.error('Error checking user reaction:', error);
    }
  };

  const handleReaction = async (reactionType: ReactionType) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const userIP = await getUserIP();

      if (userReaction === reactionType) {
        // Remove reaction
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_ip', userIP)
          .eq('reaction_type', reactionType);

        if (error) throw error;

        setUserReaction(null);
        setReactions(prev => ({
          ...prev,
          [reactionType]: Math.max(0, prev[reactionType] - 1)
        }));
      } else {
        // Remove existing reaction if any
        if (userReaction) {
          await supabase
            .from('reactions')
            .delete()
            .eq('post_id', postId)
            .eq('user_ip', userIP);

          setReactions(prev => ({
            ...prev,
            [userReaction]: Math.max(0, prev[userReaction] - 1)
          }));
        }

        // Add new reaction
        const { error } = await supabase
          .from('reactions')
          .insert({
            post_id: postId,
            user_ip: userIP,
            reaction_type: reactionType
          });

        if (error) throw error;

        setUserReaction(reactionType);
        setReactions(prev => ({
          ...prev,
          [reactionType]: prev[reactionType] + 1
        }));
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Reactions
        </h3>
        {totalReactions > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {(Object.keys(reactionEmojis) as ReactionType[]).map((type) => (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            disabled={loading}
            className={`group relative flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200 ${
              userReaction === type
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-105'
                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-800'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className="text-2xl mb-1 group-hover:scale-110 transition-transform duration-200">
              {reactionEmojis[type]}
            </span>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">
              {reactionLabels[type]}
            </span>
            {reactions[type] > 0 && (
              <span className="absolute -top-2 -right-2 bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {reactions[type]}
              </span>
            )}
          </button>
        ))}
      </div>

      {totalReactions > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(reactionEmojis) as ReactionType[])
              .filter(type => reactions[type] > 0)
              .map((type) => (
                <div
                  key={type}
                  className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1"
                >
                  <span className="text-sm">{reactionEmojis[type]}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {reactions[type]}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
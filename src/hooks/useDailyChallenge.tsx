
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getTodaysChallenge, 
  getUserChallengeAttempt, 
  getUserStats,
  type DailyChallenge,
  type UserChallenge,
  type UserStats
} from '@/utils/dailyChallengeService';

export function useDailyChallenge() {
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [userAttempt, setUserAttempt] = useState<UserChallenge | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChallenge = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Load today's challenge
        const dailyChallenge = await getTodaysChallenge();
        setChallenge(dailyChallenge);
        
        if (dailyChallenge) {
          // Load user's attempt if any
          const attempt = await getUserChallengeAttempt(user.id, dailyChallenge.id);
          setUserAttempt(attempt);
          
          // Load user stats
          const stats = await getUserStats(user.id);
          setUserStats(stats);
        }
      } catch (err) {
        console.error('Error loading challenge:', err);
        setError('Failed to load daily challenge data');
      } finally {
        setIsLoading(false);
      }
    };

    loadChallenge();
  }, [user]);

  const refreshData = async () => {
    if (!user || !challenge) return;
    
    try {
      // Refresh user attempt
      const attempt = await getUserChallengeAttempt(user.id, challenge.id);
      setUserAttempt(attempt);
      
      // Refresh user stats
      const stats = await getUserStats(user.id);
      setUserStats(stats);
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  return {
    challenge,
    userAttempt,
    userStats,
    isLoading,
    error,
    refreshData
  };
}

export default useDailyChallenge;


import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Trophy, Code, Clock, CheckCircle } from 'lucide-react';
import useDailyChallenge from '@/hooks/useDailyChallenge';

const DailyChallengeCard: React.FC = () => {
  const navigate = useNavigate();
  const { challenge, userAttempt, userStats, isLoading } = useDailyChallenge();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Coding Challenge</CardTitle>
          <CardDescription>Loading today's challenge...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!challenge) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Coding Challenge</CardTitle>
          <CardDescription>No challenge available today</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Check back later for a new coding challenge.</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => navigate('/daily-challenge')}>View Details</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Daily Coding Challenge</CardTitle>
            <CardDescription>
              {new Date(challenge.date).toLocaleDateString()}
            </CardDescription>
          </div>
          {challenge.difficulty && (
            <Badge className={getDifficultyColor(challenge.difficulty)}>
              {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="font-semibold text-lg mb-2">{challenge.title}</h3>
        <div className="flex flex-wrap gap-4 mt-4">
          {userStats && (
            <>
              <div className="flex items-center">
                <Trophy className="text-amber-500 h-4 w-4 mr-1" />
                <span className="text-sm">{userStats.total_solved} solved</span>
              </div>
              <div className="flex items-center">
                <Clock className="text-blue-500 h-4 w-4 mr-1" />
                <span className="text-sm">{userStats.current_streak} day streak</span>
              </div>
            </>
          )}
          {userAttempt && (
            <div className="flex items-center">
              {userAttempt.is_solved ? (
                <CheckCircle className="text-green-500 h-4 w-4 mr-1" />
              ) : (
                <Code className="text-primary h-4 w-4 mr-1" />
              )}
              <span className="text-sm">
                {userAttempt.is_solved ? 'Completed today' : `${userAttempt.attempts} attempts`}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => navigate('/daily-challenge')} className="w-full">
          {userAttempt?.is_solved ? 'View Solution' : 'Solve Challenge'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DailyChallengeCard;

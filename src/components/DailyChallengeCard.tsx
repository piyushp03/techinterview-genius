
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Code, Calendar, Star, Trophy, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import useDailyChallenge from '@/hooks/useDailyChallenge';

const DailyChallengeCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { challenge, userAttempt, userStats, isLoading, error } = useDailyChallenge();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Coding Challenge</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Coding Challenge</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Unable to load today's challenge</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => navigate('/daily-challenge')}>
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (!challenge) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Coding Challenge</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No challenge available today</p>
        </CardContent>
      </Card>
    );
  }
  
  const renderDifficultyBadge = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-amber-100 text-amber-800',
      hard: 'bg-red-100 text-red-800',
    };
    
    return (
      <Badge className={colors[difficulty as keyof typeof colors]}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </Badge>
    );
  };
  
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code className="h-10 w-10 text-violet-500" />
            <div>
              <CardTitle>Daily Coding Challenge</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                {challenge?.difficulty && renderDifficultyBadge(challenge.difficulty)}
              </div>
            </div>
          </div>
          
          {userStats && (
            <div className="flex flex-col items-end">
              <div className="flex items-center text-amber-500">
                <Star className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">{userStats.current_streak} day streak</span>
              </div>
              <div className="flex items-center text-blue-500 mt-1">
                <Trophy className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">{userStats.total_solved} solved</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <h3 className="font-medium">{challenge.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {challenge.description.replace(/<[^>]*>/g, '')}
          </p>
          
          {userAttempt && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {userAttempt.attempts} {userAttempt.attempts === 1 ? 'attempt' : 'attempts'}
                </span>
              </div>
              
              {userAttempt.is_solved ? (
                <Badge className="bg-green-100 text-green-800">
                  Solved
                </Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-800">
                  In progress
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button onClick={() => navigate('/daily-challenge')} className="w-full" variant="default">
          {userAttempt ? (userAttempt.is_solved ? 'View Solution' : 'Continue Challenge') : 'Start Challenge'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DailyChallengeCard;

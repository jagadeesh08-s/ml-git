import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Settings,
  LogOut,
  Trophy,
  BookOpen,
  Zap,
  ChevronDown,
  Crown,
  Star,
  Target
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const UserMenu: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated || !user) {
    return null;
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'educator':
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'researcher':
        return <Zap className="w-4 h-4 text-purple-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'educator':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'researcher':
        return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getLevelProgress = () => {
    const currentLevelXP = user.stats.level * 1000; // 1000 XP per level
    const nextLevelXP = (user.stats.level + 1) * 1000;
    const progress = ((user.stats.experience - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-auto px-3 hover:bg-accent/50">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="hidden md:flex flex-col items-start">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {user.name}
                </span>
                {getRoleIcon(user.role)}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-xs px-2 py-0 ${getRoleColor(user.role)}`}
                >
                  {user.role}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3" />
                  Lv.{user.stats.level}
                </div>
              </div>
            </div>

            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80 p-0" align="end">
        <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">
                  {user.name}
                </h3>
                {getRoleIcon(user.role)}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {user.email}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className={`text-xs px-2 py-0 ${getRoleColor(user.role)}`}
                >
                  {user.role}
                </Badge>
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Level {user.stats.level}</span>
              <span className="font-medium text-foreground">
                {user.stats.experience.toLocaleString()} XP
              </span>
            </div>
            <Progress value={getLevelProgress()} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              {((user.stats.level + 1) * 1000 - user.stats.experience).toLocaleString()} XP to next level
            </div>
          </div>
        </div>

        <div className="p-2">
          <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide px-2 py-1">
            Account
          </DropdownMenuLabel>

          <DropdownMenuItem className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile Settings</span>
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Preferences</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide px-2 py-1">
            Learning
          </DropdownMenuLabel>

          <DropdownMenuItem className="cursor-pointer">
            <Trophy className="mr-2 h-4 w-4" />
            <div className="flex items-center justify-between w-full">
              <span>Achievements</span>
              <Badge variant="secondary" className="text-xs">
                {user.stats.achievements.length}
              </Badge>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer">
            <Target className="mr-2 h-4 w-4" />
            <div className="flex items-center justify-between w-full">
              <span>Progress</span>
              <Badge variant="secondary" className="text-xs">
                {user.stats.tutorialsCompleted}
              </Badge>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer">
            <BookOpen className="mr-2 h-4 w-4" />
            <div className="flex items-center justify-between w-full">
              <span>My Circuits</span>
              <Badge variant="secondary" className="text-xs">
                {user.stats.circuitsCreated}
              </Badge>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Github, User, History, MessageSquare, FileText, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    closeMenu();
  };

  const getInitials = (name?: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { path: '/new-interview', label: 'New Interview', icon: <User className="h-5 w-5" /> },
    { path: '/questions', label: 'Custom Questions', icon: <MessageSquare className="h-5 w-5" /> },
    { path: '/resume', label: 'Resume Analysis', icon: <FileText className="h-5 w-5" /> },
    { path: '/history', label: 'History', icon: <History className="h-5 w-5" /> },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-lg bg-background/80 border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                TechInterview.AI
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {isAuthenticated && navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`text-sm font-medium hover:text-primary transition-colors flex items-center gap-1
                  ${location.pathname === item.path ? 'text-primary' : ''}`}
              >
                {item.label}
              </Link>
            ))}
            <Link 
              to="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              <Github className="h-5 w-5" />
            </Link>
            <ThemeToggle />
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.name} />
                      <AvatarFallback>{getInitials(user?.user_metadata?.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">
                        {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer flex w-full items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer flex w-full items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate('/auth')} className="btn-primary">
                Sign In
              </Button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden flex items-center p-2 rounded-md"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-30 bg-background/95 backdrop-blur-sm pt-16 md:hidden animate-fade-in">
          <nav className="container flex flex-col gap-4 p-6">
            {isAuthenticated && navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="py-3 text-base font-medium hover:text-primary flex items-center gap-2"
                onClick={closeMenu}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
            <Link
              to="https://github.com"
              className="py-3 text-base font-medium hover:text-primary flex items-center gap-2"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
            >
              <Github className="h-5 w-5" />
              GitHub
            </Link>
            <div className="py-3 flex items-center justify-between">
              <span className="text-base font-medium">Theme</span>
              <ThemeToggle />
            </div>
            <div className="pt-4 mt-4 border-t">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="py-3 text-base font-medium hover:text-primary flex items-center gap-2"
                    onClick={closeMenu}
                  >
                    <User className="h-5 w-5" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full py-3 text-base font-medium text-red-500 hover:text-red-600 flex items-center gap-2"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign out
                  </button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    navigate('/auth');
                    closeMenu();
                  }}
                  className="w-full btn-primary"
                >
                  Sign In
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

export default Navbar;

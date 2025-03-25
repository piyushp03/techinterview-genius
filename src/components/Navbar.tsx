
import { useState } from 'react';
import { Menu, X, Github, Settings, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import AuthModal from '@/components/AuthModal';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const openAuthModal = () => {
    setIsAuthModalOpen(true);
    closeMenu();
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-lg bg-background/80 border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-2">
              <span className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                TechInterview.AI
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-primary transition-colors">
              <Github className="h-5 w-5" />
            </a>
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="relative group">
                <Button variant="ghost" className="gap-2">
                  <User className="h-5 w-5" />
                  <span className="text-sm">{user?.name || 'User'}</span>
                </Button>
                <div className="absolute right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-in-out z-50">
                  <div className="py-1 bg-popover border rounded-md shadow-lg">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-accent"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Button onClick={openAuthModal} className="btn-primary">
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
            <a
              href="#features"
              className="py-3 text-base font-medium hover:text-primary"
              onClick={closeMenu}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="py-3 text-base font-medium hover:text-primary"
              onClick={closeMenu}
            >
              How It Works
            </a>
            <a
              href="https://github.com"
              className="py-3 text-base font-medium hover:text-primary flex items-center gap-2"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
            >
              <Github className="h-5 w-5" />
              GitHub
            </a>
            <div className="py-3 flex items-center justify-between">
              <span className="text-base font-medium">Theme</span>
              <ThemeToggle />
            </div>
            <div className="pt-4 mt-4 border-t">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 py-3">
                    <User className="h-5 w-5" />
                    <span className="font-medium">{user?.name || 'User'}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full py-3 text-base font-medium text-red-500 hover:text-red-600 flex items-center"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Button
                  onClick={openAuthModal}
                  className="w-full btn-primary"
                >
                  Sign In
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </>
  );
};

export default Navbar;

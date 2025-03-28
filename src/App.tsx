
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

function App() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}

export default App;

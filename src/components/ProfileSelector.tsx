
import { useState } from 'react';
import { Code, Database, Server, BarChart, Layers, Smartphone } from 'lucide-react';
import { useInterview, InterviewRole } from '@/context/InterviewContext';

const roles = [
  { id: 'frontend', name: 'Frontend', icon: Code, description: 'React, Vue, Angular, CSS, etc.' },
  { id: 'backend', name: 'Backend', icon: Database, description: 'Node.js, Python, Java, databases, etc.' },
  { id: 'fullstack', name: 'Full Stack', icon: Layers, description: 'End-to-end web development' },
  { id: 'devops', name: 'DevOps', icon: Server, description: 'CI/CD, Cloud, Docker, Kubernetes' },
  { id: 'data', name: 'Data Science', icon: BarChart, description: 'ML, AI, data analysis, statistics' },
  { id: 'mobile', name: 'Mobile', icon: Smartphone, description: 'iOS, Android, React Native, Flutter' },
];

const ProfileSelector = () => {
  const { selectedRole, setRole } = useInterview();
  const [expanded, setExpanded] = useState(false);

  const handleSelect = (role: InterviewRole) => {
    setRole(role);
    setExpanded(false);
  };

  // Find the currently selected role object
  const currentRole = roles.find(role => role.id === selectedRole);

  return (
    <div className="relative">
      <div 
        className={`glass-card p-4 cursor-pointer ${expanded ? 'ring-2 ring-primary' : 'hover:shadow-xl'} transition-all duration-300`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {currentRole && <currentRole.icon className="h-5 w-5 text-primary" />}
          <div>
            <h3 className="font-medium">{currentRole?.name || 'Select Role'}</h3>
            <p className="text-sm text-muted-foreground">{currentRole?.description}</p>
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="absolute left-0 right-0 mt-2 z-10 glass-card animate-fade-in">
          <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedRole === role.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-primary/5'
                }`}
                onClick={() => handleSelect(role.id as InterviewRole)}
              >
                <role.icon className="h-5 w-5" />
                <div>
                  <h4 className="font-medium">{role.name}</h4>
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSelector;

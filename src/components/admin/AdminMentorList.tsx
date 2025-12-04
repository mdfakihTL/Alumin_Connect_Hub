import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Shield, Mail, Phone, Award } from 'lucide-react';

interface AlumniUser {
  id: string;
  name: string;
  email: string;
  graduationYear: string;
  major: string;
  isMentor: boolean;
  universityId: string;
}

const AdminMentorList = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<AlumniUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load users and filter mentors
    const users = JSON.parse(localStorage.getItem(`alumni_users_${user?.universityId}`) || '[]');
    const mentorUsers = users.filter((u: AlumniUser) => u.isMentor);
    
    // Add some dummy mentors if none exist
    if (mentorUsers.length === 0) {
      const dummyMentors: AlumniUser[] = [
        {
          id: 'm1',
          name: 'Dr. Sarah Williams',
          email: 'sarah.w@example.com',
          graduationYear: '2010',
          major: 'Computer Science',
          isMentor: true,
          universityId: user?.universityId || '',
        },
        {
          id: 'm2',
          name: 'Michael Chen',
          email: 'michael.c@example.com',
          graduationYear: '2012',
          major: 'Engineering',
          isMentor: true,
          universityId: user?.universityId || '',
        },
        {
          id: 'm3',
          name: 'Emily Rodriguez',
          email: 'emily.r@example.com',
          graduationYear: '2015',
          major: 'Business Administration',
          isMentor: true,
          universityId: user?.universityId || '',
        },
        {
          id: 'm4',
          name: 'David Kim',
          email: 'david.k@example.com',
          graduationYear: '2013',
          major: 'Data Science',
          isMentor: true,
          universityId: user?.universityId || '',
        },
        {
          id: 'm5',
          name: 'Jessica Martinez',
          email: 'jessica.m@example.com',
          graduationYear: '2011',
          major: 'Marketing',
          isMentor: true,
          universityId: user?.universityId || '',
        },
      ];
      setMentors(dummyMentors);
    } else {
      setMentors(mentorUsers);
    }
  }, [user?.universityId]);

  const filteredMentors = mentors.filter(mentor =>
    mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mentor.major.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mentor.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Active Mentors</h2>
            <p className="text-sm text-muted-foreground">
              Alumni who are available to mentor current students and other alumni
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {mentors.length} Mentors
          </Badge>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search mentors by name, major, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Mentors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMentors.length === 0 ? (
          <Card className="p-8 text-center col-span-full">
            <p className="text-muted-foreground">No mentors found</p>
          </Card>
        ) : (
          filteredMentors.map(mentor => (
            <Card key={mentor.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {mentor.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1 truncate">{mentor.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{mentor.major}</p>
                  <Badge variant="outline" className="mt-2">
                    <Award className="w-3 h-3 mr-1" />
                    Class of {mentor.graduationYear}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{mentor.email}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  View Profile
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminMentorList;


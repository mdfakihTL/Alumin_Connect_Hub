import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Building2, Activity, Calendar } from 'lucide-react';

interface UniversityStats {
  id: string;
  name: string;
  alumni: number;
  mentors: number;
  posts: number;
  events: number;
  groups: number;
}

interface SuperAdminAnalyticsProps {
  detailed?: boolean;
}

const SuperAdminAnalytics = ({ detailed = false }: SuperAdminAnalyticsProps) => {
  const [stats, setStats] = useState<UniversityStats[]>([]);
  const [totals, setTotals] = useState({
    totalAlumni: 0,
    totalMentors: 0,
    totalPosts: 0,
    totalEvents: 0,
  });

  useEffect(() => {
    const universities = JSON.parse(localStorage.getItem('alumni_universities') || '[]');
    const universityStats: UniversityStats[] = [];
    let totalAlumni = 0;
    let totalMentors = 0;
    let totalPosts = 0;
    let totalEvents = 0;

    universities.forEach((uni: any) => {
      const users = JSON.parse(localStorage.getItem(`alumni_users_${uni.id}`) || '[]');
      const mentors = users.filter((u: any) => u.isMentor);
      const posts = JSON.parse(localStorage.getItem(`admin_posts_${uni.id}`) || '[]');

      totalAlumni += users.length;
      totalMentors += mentors.length;
      totalPosts += posts.length;

      universityStats.push({
        id: uni.id,
        name: uni.name,
        alumni: users.length,
        mentors: mentors.length,
        posts: posts.length,
        events: 0,
        groups: 0,
      });
    });

    setStats(universityStats);
    setTotals({ totalAlumni, totalMentors, totalPosts, totalEvents });
  }, []);

  if (!detailed) {
    return (
      <Card className="p-4">
        <h2 className="text-lg font-bold mb-4">System Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Total Alumni</p>
            <p className="text-2xl font-bold">{totals.totalAlumni}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Total Mentors</p>
            <p className="text-2xl font-bold">{totals.totalMentors}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Total Posts</p>
            <p className="text-2xl font-bold">{totals.totalPosts}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Universities</p>
            <p className="text-2xl font-bold">{stats.length}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Global Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Comprehensive statistics across all universities
            </p>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Total Alumni</p>
            <p className="text-2xl font-bold">{totals.totalAlumni}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Total Mentors</p>
            <p className="text-2xl font-bold">{totals.totalMentors}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Total Posts</p>
            <p className="text-2xl font-bold">{totals.totalPosts}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Universities</p>
            <p className="text-2xl font-bold">{stats.length}</p>
          </Card>
        </div>
      </Card>

      {/* Per-University Stats */}
      <Card className="p-4">
        <h3 className="text-lg font-bold mb-4">University Breakdown</h3>
        <div className="space-y-3">
          {stats.map(stat => (
            <Card key={stat.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{stat.name}</h4>
                <Badge variant="outline">{stat.id}</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Alumni</p>
                  <p className="text-lg font-bold">{stat.alumni}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mentors</p>
                  <p className="text-lg font-bold">{stat.mentors}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Posts</p>
                  <p className="text-lg font-bold">{stat.posts}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Engagement</p>
                  <p className="text-lg font-bold">{stat.alumni > 0 ? Math.round((stat.posts / stat.alumni) * 100) : 0}%</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SuperAdminAnalytics;


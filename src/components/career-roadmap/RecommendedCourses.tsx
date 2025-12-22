/**
 * RecommendedCourses Component
 * 
 * Displays recommended courses from TeamLease EdTech based on the career roadmap.
 * In future, this will fetch courses from UMS (University Management System).
 */

import { useState, useMemo } from 'react';
import { 
  GraduationCap, Clock, Users, Star, ExternalLink, ChevronRight,
  Award, BookOpen, TrendingUp, Building2, Sparkles
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// TeamLease EdTech Courses Database (will be replaced by UMS API in future)
const TEAMLEASE_COURSES = [
  // Technology & IT
  {
    id: 'tle-1',
    title: 'Data Science & Machine Learning Professional',
    provider: 'TeamLease EdTech',
    category: 'Technology',
    duration: '6 months',
    level: 'Advanced',
    rating: 4.8,
    students: 15000,
    price: '₹45,000',
    skills: ['Python', 'Machine Learning', 'Deep Learning', 'SQL', 'Statistics'],
    description: 'Comprehensive program covering data analysis, ML algorithms, and real-world projects.',
    link: 'https://www.teamleaseedtech.com/data-science',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop',
    tags: ['Data Science', 'AI', 'Machine Learning', 'Analytics'],
    certificate: true,
  },
  {
    id: 'tle-2',
    title: 'Full Stack Web Development Bootcamp',
    provider: 'TeamLease EdTech',
    category: 'Technology',
    duration: '4 months',
    level: 'Intermediate',
    rating: 4.7,
    students: 25000,
    price: '₹35,000',
    skills: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'REST APIs'],
    description: 'Build production-ready web applications with modern tech stack.',
    link: 'https://www.teamleaseedtech.com/fullstack',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=200&fit=crop',
    tags: ['Web Development', 'JavaScript', 'Frontend', 'Backend'],
    certificate: true,
  },
  {
    id: 'tle-3',
    title: 'Cloud Computing & AWS Certification',
    provider: 'TeamLease EdTech',
    category: 'Technology',
    duration: '3 months',
    level: 'Intermediate',
    rating: 4.6,
    students: 12000,
    price: '₹30,000',
    skills: ['AWS', 'Cloud Architecture', 'DevOps', 'Docker', 'Kubernetes'],
    description: 'Master cloud infrastructure and prepare for AWS certifications.',
    link: 'https://www.teamleaseedtech.com/cloud',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=200&fit=crop',
    tags: ['Cloud', 'AWS', 'DevOps', 'Infrastructure'],
    certificate: true,
  },
  // Management & Business
  {
    id: 'tle-4',
    title: 'Executive MBA in Digital Transformation',
    provider: 'TeamLease EdTech',
    category: 'Management',
    duration: '12 months',
    level: 'Executive',
    rating: 4.9,
    students: 8000,
    price: '₹1,50,000',
    skills: ['Digital Strategy', 'Leadership', 'Business Analytics', 'Change Management'],
    description: 'Transform your leadership capabilities for the digital age.',
    link: 'https://www.teamleaseedtech.com/emba',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop',
    tags: ['MBA', 'Leadership', 'Digital', 'Strategy'],
    certificate: true,
  },
  {
    id: 'tle-5',
    title: 'Product Management Certification',
    provider: 'TeamLease EdTech',
    category: 'Management',
    duration: '4 months',
    level: 'Intermediate',
    rating: 4.8,
    students: 18000,
    price: '₹40,000',
    skills: ['Product Strategy', 'Agile', 'User Research', 'Roadmapping', 'Analytics'],
    description: 'Learn to build and manage successful products from ideation to launch.',
    link: 'https://www.teamleaseedtech.com/product-management',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
    tags: ['Product', 'Management', 'Agile', 'Strategy'],
    certificate: true,
  },
  {
    id: 'tle-6',
    title: 'Project Management Professional (PMP) Prep',
    provider: 'TeamLease EdTech',
    category: 'Management',
    duration: '2 months',
    level: 'Advanced',
    rating: 4.7,
    students: 22000,
    price: '₹25,000',
    skills: ['Project Planning', 'Risk Management', 'Stakeholder Management', 'Agile'],
    description: 'Comprehensive preparation for PMP certification with real projects.',
    link: 'https://www.teamleaseedtech.com/pmp',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=200&fit=crop',
    tags: ['PMP', 'Project Management', 'Leadership', 'Certification'],
    certificate: true,
  },
  // Finance
  {
    id: 'tle-7',
    title: 'Financial Analysis & Modeling',
    provider: 'TeamLease EdTech',
    category: 'Finance',
    duration: '3 months',
    level: 'Intermediate',
    rating: 4.6,
    students: 14000,
    price: '₹35,000',
    skills: ['Financial Modeling', 'Excel', 'Valuation', 'Investment Analysis'],
    description: 'Master financial modeling techniques used by top investment banks.',
    link: 'https://www.teamleaseedtech.com/financial-modeling',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop',
    tags: ['Finance', 'Excel', 'Investment', 'Analysis'],
    certificate: true,
  },
  // Marketing
  {
    id: 'tle-8',
    title: 'Digital Marketing Mastery',
    provider: 'TeamLease EdTech',
    category: 'Marketing',
    duration: '4 months',
    level: 'Beginner',
    rating: 4.7,
    students: 30000,
    price: '₹28,000',
    skills: ['SEO', 'Social Media', 'Google Ads', 'Content Marketing', 'Analytics'],
    description: 'Complete digital marketing program with hands-on campaigns.',
    link: 'https://www.teamleaseedtech.com/digital-marketing',
    image: 'https://images.unsplash.com/photo-1432888622747-4eb9a8f5a70d?w=400&h=200&fit=crop',
    tags: ['Marketing', 'Digital', 'SEO', 'Social Media'],
    certificate: true,
  },
  // HR & People
  {
    id: 'tle-9',
    title: 'HR Analytics & People Management',
    provider: 'TeamLease EdTech',
    category: 'HR',
    duration: '3 months',
    level: 'Intermediate',
    rating: 4.5,
    students: 9000,
    price: '₹32,000',
    skills: ['HR Analytics', 'Talent Management', 'People Analytics', 'HRIS'],
    description: 'Data-driven approach to human resource management.',
    link: 'https://www.teamleaseedtech.com/hr-analytics',
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=200&fit=crop',
    tags: ['HR', 'Analytics', 'People', 'Management'],
    certificate: true,
  },
  // Design
  {
    id: 'tle-10',
    title: 'UX/UI Design Professional',
    provider: 'TeamLease EdTech',
    category: 'Design',
    duration: '5 months',
    level: 'Intermediate',
    rating: 4.8,
    students: 16000,
    price: '₹38,000',
    skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Usability Testing'],
    description: 'Create user-centered designs for digital products.',
    link: 'https://www.teamleaseedtech.com/ux-design',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=200&fit=crop',
    tags: ['UX', 'UI', 'Design', 'Figma', 'Product'],
    certificate: true,
  },
];

interface RecommendedCoursesProps {
  skills?: string[];
  careerGoal?: string;
  maxCourses?: number;
  className?: string;
}

export const RecommendedCourses = ({ 
  skills = [], 
  careerGoal = '',
  maxCourses = 4,
  className = ''
}: RecommendedCoursesProps) => {
  const [showAll, setShowAll] = useState(false);

  // Match courses based on skills and career goal
  const matchedCourses = useMemo(() => {
    const searchTerms = [...skills, careerGoal].map(s => s.toLowerCase());
    
    // Score each course based on relevance
    const scoredCourses = TEAMLEASE_COURSES.map(course => {
      let score = 0;
      
      // Check skills match
      course.skills.forEach(skill => {
        if (searchTerms.some(term => skill.toLowerCase().includes(term) || term.includes(skill.toLowerCase()))) {
          score += 10;
        }
      });
      
      // Check tags match
      course.tags.forEach(tag => {
        if (searchTerms.some(term => tag.toLowerCase().includes(term) || term.includes(tag.toLowerCase()))) {
          score += 5;
        }
      });
      
      // Check title and description
      if (searchTerms.some(term => course.title.toLowerCase().includes(term))) {
        score += 15;
      }
      if (searchTerms.some(term => course.description.toLowerCase().includes(term))) {
        score += 3;
      }
      
      // Boost by rating
      score += course.rating * 2;
      
      return { ...course, score };
    });

    // Sort by score and return top matches
    return scoredCourses
      .filter(c => c.score > 0 || skills.length === 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, showAll ? 10 : maxCourses);
  }, [skills, careerGoal, showAll, maxCourses]);

  // If no skills provided, show featured courses
  const displayCourses = matchedCourses.length > 0 
    ? matchedCourses 
    : TEAMLEASE_COURSES.slice(0, maxCourses);

  const handleCourseClick = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className={`p-5 sm:p-6 bg-gradient-to-br from-blue-500/5 via-card to-indigo-500/5 border-2 border-blue-500/20 rounded-xl ${className}`}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              Recommended Courses
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Matched
              </Badge>
            </h3>
            <p className="text-sm text-muted-foreground">
              Courses from TeamLease EdTech to accelerate your journey
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Building2 className="w-4 h-4" />
          TeamLease EdTech
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {displayCourses.map((course) => (
          <div
            key={course.id}
            onClick={() => handleCourseClick(course.link)}
            className="group relative bg-card rounded-xl border border-border overflow-hidden cursor-pointer hover:border-blue-500/50 hover:shadow-lg transition-all duration-300"
          >
            {/* Image */}
            <div className="relative h-28 overflow-hidden">
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-xs">
                {course.category}
              </Badge>
              {course.certificate && (
                <Badge className="absolute top-2 right-2 bg-green-600 text-white text-xs">
                  <Award className="w-3 h-3 mr-1" />
                  Certificate
                </Badge>
              )}
              <div className="absolute bottom-2 left-2 right-2">
                <h4 className="text-white font-semibold text-sm line-clamp-2 drop-shadow-lg">
                  {course.title}
                </h4>
              </div>
            </div>

            {/* Details */}
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium">{course.rating}</span>
                  <span className="text-xs text-muted-foreground">({course.students.toLocaleString()})</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {course.level}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {course.duration}
                </div>
                <span className="font-semibold text-primary">{course.price}</span>
              </div>

              {/* Skills Preview */}
              <div className="flex flex-wrap gap-1 mt-2">
                {course.skills.slice(0, 3).map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {skill}
                  </Badge>
                ))}
                {course.skills.length > 3 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    +{course.skills.length - 3}
                  </Badge>
                )}
              </div>

              {/* View Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-3 gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                View Course
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Show More */}
      {matchedCourses.length > maxCourses && !showAll && (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => setShowAll(true)}
        >
          View More Courses
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <span>Courses matched to your career goals</span>
        </div>
        <a 
          href="https://www.teamleaseedtech.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-primary"
        >
          Browse all courses
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </Card>
  );
};

export default RecommendedCourses;


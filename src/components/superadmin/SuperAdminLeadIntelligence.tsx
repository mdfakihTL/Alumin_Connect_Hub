import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig 
} from '@/components/ui/chart';
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  Flame, Thermometer, Snowflake, TrendingUp, Users, Target,
  MousePointerClick, GraduationCap, Award, Building2,
  Search, Filter, Download, RefreshCcw, ChevronRight, Mail,
  Sparkles, BarChart3, PieChart as PieChartIcon,
  Activity, Star, Crown, BookOpen, Briefcase, DollarSign,
  Clock, Percent, Brain, Zap, CheckCircle, AlertCircle,
  FileText, School
} from 'lucide-react';

import {
  courseIntelligenceApi,
  type CourseAnalytics,
  type CourseLead,
  type CourseRecommendation,
  getCourseTypeLabel,
  getCourseTypeColor,
} from '@/api/courseIntelligence';

import { leadIntelligenceApi, type University } from '@/api/leadIntelligence';

// Chart configurations
const leadChartConfig = {
  hot: { label: 'Hot Leads', color: 'hsl(0 84% 60%)' },
  warm: { label: 'Warm Leads', color: 'hsl(38 92% 50%)' },
  cold: { label: 'Cold Leads', color: 'hsl(200 80% 50%)' },
} satisfies ChartConfig;

const courseTypeChartConfig = {
  ug: { label: 'Undergraduate', color: 'hsl(217 91% 60%)' },
  pg: { label: 'Postgraduate', color: 'hsl(270 70% 60%)' },
  executive: { label: 'Executive', color: 'hsl(38 92% 50%)' },
  certificate: { label: 'Certificate', color: 'hsl(142 71% 45%)' },
  bootcamp: { label: 'Bootcamp', color: 'hsl(187 85% 43%)' },
} satisfies ChartConfig;

// Helper components
const LeadTemperatureBadge = ({ temperature }: { temperature: 'hot' | 'warm' | 'cold' }) => {
  const config = {
    hot: { icon: Flame, color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Hot' },
    warm: { icon: Thermometer, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', label: 'Warm' },
    cold: { icon: Snowflake, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: 'Cold' },
  };
  const { icon: Icon, color, label } = config[temperature];
  
  return (
    <Badge variant="outline" className={`${color} gap-1 font-medium text-xs`}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
};

const CourseTypeBadge = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    ug: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    pg: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    executive: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    certificate: 'bg-green-500/10 text-green-600 border-green-500/20',
    bootcamp: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  };
  
  const labels: Record<string, string> = {
    ug: 'UG',
    pg: 'PG',
    executive: 'Executive',
    certificate: 'Certificate',
    bootcamp: 'Bootcamp',
  };
  
  return (
    <Badge variant="outline" className={colors[type] || 'bg-gray-500/10 text-gray-600'}>
      {labels[type] || type}
    </Badge>
  );
};

const ScoreBar = ({ score, label, color }: { score: number; label: string; color: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{score.toFixed(0)}</span>
    </div>
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all ${color}`} 
        style={{ width: `${Math.min(100, score)}%` }}
      />
    </div>
  </div>
);

const SuperAdminLeadIntelligence = () => {
  const { toast } = useToast();
  
  // State
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [activeCourseType, setActiveCourseType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingData, setIsGeneratingData] = useState(false);
  
  // Analytics state
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  
  // Leads state
  const [leads, setLeads] = useState<CourseLead[]>([]);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [leadsPage, setLeadsPage] = useState(1);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [temperatureFilter, setTemperatureFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
  
  // Modal state
  const [selectedLead, setSelectedLead] = useState<CourseLead | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([]);

  // Load analytics
  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const universityId = selectedUniversity === 'all' ? undefined : selectedUniversity;
      
      const [analyticsData, universitiesData] = await Promise.all([
        courseIntelligenceApi.getAnalytics({ university_id: universityId }),
        leadIntelligenceApi.getUniversities(),
      ]);
      
      setAnalytics(analyticsData);
      setUniversities(universitiesData);
      
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // Use demo data
      loadDemoData();
    } finally {
      setIsLoading(false);
    }
  };

  // Load leads
  const loadLeads = async () => {
    try {
      const universityId = selectedUniversity === 'all' ? undefined : selectedUniversity;
      const courseType = activeCourseType === 'all' ? undefined : activeCourseType;
      const temperature = temperatureFilter === 'all' ? undefined : temperatureFilter;
      
      const response = await courseIntelligenceApi.getAllLeads({
        university_id: universityId,
        course_type: courseType,
        temperature,
        search: searchQuery || undefined,
        page: leadsPage,
        page_size: 12,
      });
      
      setLeads(response.leads);
      setLeadsTotal(response.total);
    } catch (error) {
      console.error('Failed to load leads:', error);
      // Use demo leads
      setLeads(generateDemoLeads());
      setLeadsTotal(50);
    }
  };

  // Demo data
  const loadDemoData = () => {
    setAnalytics({
      total_leads: 847,
      hot_leads: 156,
      warm_leads: 342,
      cold_leads: 349,
      by_course_type: {
        ug: { total: 124, hot: 18, warm: 52, cold: 54 },
        pg: { total: 312, hot: 78, warm: 134, cold: 100 },
        executive: { total: 156, hot: 42, warm: 68, cold: 46 },
        certificate: { total: 187, hot: 15, warm: 72, cold: 100 },
        bootcamp: { total: 68, hot: 3, warm: 16, cold: 49 },
      },
      top_courses: [
        { course_id: '1', course_name: 'Master of Business Administration (MBA)', course_type: 'pg', total_leads: 156, hot_leads: 42, avg_score: 68.5 },
        { course_id: '2', course_name: 'MS Data Science', course_type: 'pg', total_leads: 98, hot_leads: 28, avg_score: 62.3 },
        { course_id: '3', course_name: 'Executive MBA', course_type: 'executive', total_leads: 87, hot_leads: 35, avg_score: 71.2 },
        { course_id: '4', course_name: 'ML Certificate', course_type: 'certificate', total_leads: 76, hot_leads: 12, avg_score: 48.7 },
        { course_id: '5', course_name: 'Web Dev Bootcamp', course_type: 'bootcamp', total_leads: 54, hot_leads: 8, avg_score: 45.2 },
      ],
      avg_purchase_probability: 0.42,
    });
    
    setUniversities([
      { id: '1', name: 'Massachusetts Institute of Technology' },
      { id: '2', name: 'Stanford University' },
      { id: '3', name: 'Harvard University' },
    ]);
  };

  const generateDemoLeads = (): CourseLead[] => {
    const names = ['Sarah Chen', 'Michael Johnson', 'Emily Williams', 'David Brown', 'Jessica Garcia', 'James Miller', 'Amanda Davis', 'Robert Rodriguez'];
    const courses = [
      { name: 'MBA', type: 'pg' },
      { name: 'MS Data Science', type: 'pg' },
      { name: 'Executive MBA', type: 'executive' },
      { name: 'ML Certificate', type: 'certificate' },
      { name: 'Web Dev Bootcamp', type: 'bootcamp' },
      { name: "Bachelor's Completion", type: 'ug' },
    ];
    
    return names.map((name, i) => {
      const course = courses[i % courses.length];
      const score = Math.random() * 60 + 30;
      const temp = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';
      
      return {
        lead_id: `lead_${i}`,
        user_id: `user_${i}`,
        user_name: name,
        user_email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
        education_level: i % 3 === 0 ? 'ug' : 'pg',
        years_experience: Math.floor(Math.random() * 12) + 1,
        course_id: `course_${i}`,
        course_name: course.name,
        course_type: course.type,
        overall_score: score,
        interest_score: Math.random() * 40 + 40,
        fit_score: Math.random() * 40 + 40,
        intent_score: Math.random() * 40 + 30,
        lead_temperature: temp as 'hot' | 'warm' | 'cold',
        purchase_probability: score / 100 * 0.8,
        ad_clicks: Math.floor(Math.random() * 15),
        recommendation_reasons: [
          'Matches your experience level',
          'Aligns with your career goals',
          'Popular among similar profiles',
        ],
        last_interaction_at: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
      };
    });
  };

  // Effects
  useEffect(() => {
    loadAnalytics();
  }, [selectedUniversity]);

  useEffect(() => {
    if (activeTab === 'leads' || activeTab === 'ug' || activeTab === 'pg' || activeTab === 'executive') {
      loadLeads();
    }
  }, [activeTab, activeCourseType, temperatureFilter, searchQuery, leadsPage, selectedUniversity]);

  // Handlers
  const handleGenerateSeedData = async () => {
    setIsGeneratingData(true);
    try {
      const result = await courseIntelligenceApi.generateSeedData();
      toast({
        title: 'Seed Data Generated',
        description: `Created ${result.counts.leads} leads, ${result.counts.courses} courses`,
      });
      await loadAnalytics();
      await loadLeads();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate seed data',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingData(false);
    }
  };

  const handleExportLeads = async () => {
    try {
      const blob = await courseIntelligenceApi.exportLeadsCSV({
        course_type: activeCourseType === 'all' ? undefined : activeCourseType,
        temperature: temperatureFilter === 'all' ? undefined : temperatureFilter,
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `course-leads-${activeCourseType}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: 'Export Successful', description: 'Leads exported to CSV.' });
    } catch (error) {
      toast({ title: 'Export Failed', variant: 'destructive' });
    }
  };

  const handleViewLead = async (lead: CourseLead) => {
    setSelectedLead(lead);
    setIsLeadModalOpen(true);
    
    // Load recommendations
    try {
      const recs = await courseIntelligenceApi.getUserRecommendations(lead.user_id, 5);
      setRecommendations(recs);
    } catch {
      setRecommendations([]);
    }
  };

  // Chart data
  const leadDistributionData = analytics ? [
    { name: 'Hot', value: analytics.hot_leads, fill: 'hsl(0 84% 60%)' },
    { name: 'Warm', value: analytics.warm_leads, fill: 'hsl(38 92% 50%)' },
    { name: 'Cold', value: analytics.cold_leads, fill: 'hsl(200 80% 50%)' },
  ] : [];

  const courseTypeData = analytics ? Object.entries(analytics.by_course_type).map(([type, stats]) => ({
    name: getCourseTypeLabel(type).split(' ')[0],
    type,
    total: stats.total,
    hot: stats.hot,
    warm: stats.warm,
    cold: stats.cold,
  })) : [];

  const radarData = analytics ? [
    { subject: 'UG', A: analytics.by_course_type.ug?.total || 0 },
    { subject: 'PG', A: analytics.by_course_type.pg?.total || 0 },
    { subject: 'Executive', A: analytics.by_course_type.executive?.total || 0 },
    { subject: 'Certificate', A: analytics.by_course_type.certificate?.total || 0 },
    { subject: 'Bootcamp', A: analytics.by_course_type.bootcamp?.total || 0 },
  ] : [];

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 bg-card rounded-xl border" />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading course intelligence...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-violet-500/5 via-primary/5 to-cyan-500/5 border-0 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-primary to-cyan-500 flex items-center justify-center shadow-lg">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-violet-600 via-primary to-cyan-600 bg-clip-text text-transparent">
                Course Lead Intelligence
              </h1>
              <p className="text-muted-foreground mt-1">
                AI-powered lead scoring for UG, PG & Executive courses
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
              <SelectTrigger className="w-[180px]">
                <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="University" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Universities</SelectItem>
                {universities.map(uni => (
                  <SelectItem key={uni.id} value={uni.id}>
                    {uni.name.length > 20 ? uni.name.substring(0, 20) + '...' : uni.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={handleGenerateSeedData}
              disabled={isGeneratingData}
            >
              {isGeneratingData ? (
                <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Generate Data
            </Button>
            
            <Button variant="outline" onClick={handleExportLeads}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Leads */}
          <Card className="p-4 border-l-4 border-l-primary hover:shadow-lg transition-all cursor-pointer" onClick={() => setActiveTab('leads')}>
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-primary" />
              <Badge variant="secondary" className="text-[10px]">Total</Badge>
            </div>
            <p className="text-3xl font-bold">{analytics.total_leads}</p>
            <p className="text-xs text-muted-foreground mt-1">All Course Leads</p>
          </Card>

          {/* Hot Leads */}
          <Card 
            className="p-4 border-l-4 border-l-red-500 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => { setTemperatureFilter('hot'); setActiveTab('leads'); }}
          >
            <div className="flex items-center justify-between mb-2">
              <Flame className="w-5 h-5 text-red-500" />
              <span className="text-xs text-red-600 font-semibold">
                {((analytics.hot_leads / analytics.total_leads) * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-3xl font-bold text-red-600">{analytics.hot_leads}</p>
            <p className="text-xs text-muted-foreground mt-1">Ready to Convert</p>
          </Card>

          {/* PG Leads */}
          <Card 
            className="p-4 border-l-4 border-l-purple-500 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => { setActiveCourseType('pg'); setActiveTab('pg'); }}
          >
            <div className="flex items-center justify-between mb-2">
              <GraduationCap className="w-5 h-5 text-purple-500" />
              <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px]">PG</Badge>
            </div>
            <p className="text-3xl font-bold text-purple-600">{analytics.by_course_type.pg?.total || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">MBA, Masters</p>
          </Card>

          {/* UG Leads */}
          <Card 
            className="p-4 border-l-4 border-l-blue-500 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => { setActiveCourseType('ug'); setActiveTab('ug'); }}
          >
            <div className="flex items-center justify-between mb-2">
              <School className="w-5 h-5 text-blue-500" />
              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">UG</Badge>
            </div>
            <p className="text-3xl font-bold text-blue-600">{analytics.by_course_type.ug?.total || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Bachelor's</p>
          </Card>

          {/* Executive Leads */}
          <Card 
            className="p-4 border-l-4 border-l-amber-500 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => { setActiveCourseType('executive'); setActiveTab('executive'); }}
          >
            <div className="flex items-center justify-between mb-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">Exec</Badge>
            </div>
            <p className="text-3xl font-bold text-amber-600">{analytics.by_course_type.executive?.total || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Senior Leaders</p>
          </Card>

          {/* Avg Probability */}
          <Card className="p-4 border-l-4 border-l-green-500 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <Percent className="w-5 h-5 text-green-500" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600">
              {(analytics.avg_purchase_probability * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Avg. Conversion</p>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full sm:w-auto flex flex-wrap gap-1 h-auto p-1 bg-muted/50">
          <TabsTrigger value="overview" className="flex items-center gap-2 text-xs sm:text-sm">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="pg" className="flex items-center gap-2 text-xs sm:text-sm">
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">PG Courses</span>
            <span className="sm:hidden">PG</span>
          </TabsTrigger>
          <TabsTrigger value="ug" className="flex items-center gap-2 text-xs sm:text-sm">
            <School className="w-4 h-4" />
            <span className="hidden sm:inline">UG Courses</span>
            <span className="sm:hidden">UG</span>
          </TabsTrigger>
          <TabsTrigger value="executive" className="flex items-center gap-2 text-xs sm:text-sm">
            <Crown className="w-4 h-4" />
            <span className="hidden sm:inline">Executive</span>
            <span className="sm:hidden">Exec</span>
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2 text-xs sm:text-sm">
            <Users className="w-4 h-4" />
            All Leads
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Lead Distribution */}
            <Card className="p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <PieChartIcon className="w-5 h-5 text-primary" />
                Lead Temperature Distribution
              </h3>
              <ChartContainer config={leadChartConfig} className="h-[250px] w-full">
                <PieChart>
                  <Pie
                    data={leadDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {leadDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            </Card>

            {/* Course Type Comparison */}
            <Card className="p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                Leads by Course Type
              </h3>
              <ChartContainer config={courseTypeChartConfig} className="h-[250px] w-full">
                <BarChart data={courseTypeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="hot" stackId="a" fill="hsl(0 84% 60%)" name="Hot" />
                  <Bar dataKey="warm" stackId="a" fill="hsl(38 92% 50%)" name="Warm" />
                  <Bar dataKey="cold" stackId="a" fill="hsl(200 80% 50%)" name="Cold" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </Card>

            {/* Course Interest Radar */}
            <Card className="p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-primary" />
                Course Type Interest
              </h3>
              <ChartContainer config={courseTypeChartConfig} className="h-[250px] w-full">
                <RadarChart data={radarData}>
                  <PolarGrid className="stroke-muted" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis />
                  <Radar
                    name="Leads"
                    dataKey="A"
                    stroke="hsl(270 70% 60%)"
                    fill="hsl(270 70% 60%)"
                    fillOpacity={0.5}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </RadarChart>
              </ChartContainer>
            </Card>
          </div>

          {/* Top Courses Table */}
          {analytics && (
            <Card className="p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-primary" />
                Top Performing Courses
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Course</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Type</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Total Leads</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Hot Leads</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Avg Score</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.top_courses.map((course, idx) => (
                      <tr key={course.course_id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm ${
                              idx === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                              idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
                              idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                              'bg-muted-foreground/30'
                            }`}>
                              {idx + 1}
                            </div>
                            <span className="font-medium text-sm">{course.course_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <CourseTypeBadge type={course.course_type} />
                        </td>
                        <td className="py-3 px-2 text-center font-semibold">{course.total_leads}</td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-red-600 font-semibold">{course.hot_leads}</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="font-semibold">{course.avg_score.toFixed(1)}</span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-green-600 font-semibold">
                            {((course.hot_leads / course.total_leads) * 100).toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* PG Courses Tab */}
        <TabsContent value="pg" className="space-y-4">
          <Card className="p-4 bg-gradient-to-r from-purple-500/5 to-violet-500/5 border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-700">Postgraduate Course Leads</h3>
                <p className="text-sm text-muted-foreground">MBA, Masters, Graduate Programs - For UG graduates seeking career advancement</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-bold text-purple-600">{analytics?.by_course_type.pg?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total PG Leads</p>
              </div>
            </div>
          </Card>
          {renderLeadsList('pg')}
        </TabsContent>

        {/* UG Courses Tab */}
        <TabsContent value="ug" className="space-y-4">
          <Card className="p-4 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <School className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-700">Undergraduate Course Leads</h3>
                <p className="text-sm text-muted-foreground">Bachelor's completions, Bridge programs - For career changers & degree completers</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-bold text-blue-600">{analytics?.by_course_type.ug?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total UG Leads</p>
              </div>
            </div>
          </Card>
          {renderLeadsList('ug')}
        </TabsContent>

        {/* Executive Tab */}
        <TabsContent value="executive" className="space-y-4">
          <Card className="p-4 bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-700">Executive Education Leads</h3>
                <p className="text-sm text-muted-foreground">EMBA, Leadership Programs - For senior professionals with 8+ years experience</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-bold text-amber-600">{analytics?.by_course_type.executive?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total Executive Leads</p>
              </div>
            </div>
          </Card>
          {renderLeadsList('executive')}
        </TabsContent>

        {/* All Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          {renderLeadsList('all')}
        </TabsContent>
      </Tabs>

      {/* Lead Detail Modal */}
      <Dialog open={isLeadModalOpen} onOpenChange={setIsLeadModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedLead && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg text-white ${
                    selectedLead.lead_temperature === 'hot' ? 'bg-gradient-to-br from-red-500 to-orange-500' :
                    selectedLead.lead_temperature === 'warm' ? 'bg-gradient-to-br from-amber-500 to-yellow-500' :
                    'bg-gradient-to-br from-blue-500 to-cyan-500'
                  }`}>
                    {selectedLead.user_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <DialogTitle className="text-xl">{selectedLead.user_name}</DialogTitle>
                      <LeadTemperatureBadge temperature={selectedLead.lead_temperature} />
                      <CourseTypeBadge type={selectedLead.course_type} />
                    </div>
                    <p className="text-muted-foreground text-sm">{selectedLead.user_email}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Course Interest */}
                <Card className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Interested Course</span>
                    </div>
                    <Badge>{getCourseTypeLabel(selectedLead.course_type)}</Badge>
                  </div>
                  <p className="font-medium text-lg">{selectedLead.course_name}</p>
                </Card>

                {/* Score Breakdown */}
                <Card className="p-4">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Lead Score Breakdown
                  </h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-4xl font-bold text-primary">{selectedLead.overall_score.toFixed(0)}</p>
                      <p className="text-sm text-muted-foreground">Overall Score</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-green-500/10">
                      <p className="text-4xl font-bold text-green-600">{(selectedLead.purchase_probability * 100).toFixed(0)}%</p>
                      <p className="text-sm text-muted-foreground">Purchase Probability</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <ScoreBar score={selectedLead.interest_score} label="Interest Score (Ad Engagement)" color="bg-orange-500" />
                    <ScoreBar score={selectedLead.fit_score} label="Fit Score (Profile Match)" color="bg-blue-500" />
                    <ScoreBar score={selectedLead.intent_score} label="Intent Score (Recent Activity)" color="bg-green-500" />
                  </div>
                </Card>

                {/* User Profile */}
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Profile
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Education Level</p>
                      <p className="font-medium">{selectedLead.education_level === 'ug' ? 'Undergraduate' : 'Postgraduate'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Experience</p>
                      <p className="font-medium">{selectedLead.years_experience} years</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ad Clicks</p>
                      <p className="font-medium">{selectedLead.ad_clicks}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Active</p>
                      <p className="font-medium">
                        {selectedLead.last_interaction_at 
                          ? new Date(selectedLead.last_interaction_at).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Why This Course */}
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Why This Course?
                  </h4>
                  <div className="space-y-2">
                    {selectedLead.recommendation_reasons.map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{reason}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Other Recommendations */}
                {recommendations.length > 0 && (
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Star className="w-5 h-5 text-violet-500" />
                      Other Course Recommendations
                    </h4>
                    <div className="space-y-2">
                      {recommendations.filter(r => r.course_id !== selectedLead.course_id).slice(0, 3).map((rec, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{rec.course_name}</span>
                            <CourseTypeBadge type={rec.course_type} />
                          </div>
                          <span className="text-sm text-green-600 font-medium">
                            {(rec.confidence_score * 100).toFixed(0)}% match
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button className="flex-1 gap-2" asChild>
                    <a href={`mailto:${selectedLead.user_email}`}>
                      <Mail className="w-4 h-4" />
                      Contact Lead
                    </a>
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2">
                    <FileText className="w-4 h-4" />
                    Send Brochure
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  // Helper function to render leads list
  function renderLeadsList(courseType: string) {
    const filteredLeads = courseType === 'all' 
      ? leads 
      : leads.filter(l => l.course_type === courseType);

    return (
      <>
        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={temperatureFilter} onValueChange={(v: any) => setTemperatureFilter(v)}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leads</SelectItem>
                <SelectItem value="hot">🔥 Hot Leads</SelectItem>
                <SelectItem value="warm">🌡️ Warm Leads</SelectItem>
                <SelectItem value="cold">❄️ Cold Leads</SelectItem>
              </SelectContent>
            </Select>
            {courseType === 'all' && (
              <Select value={activeCourseType} onValueChange={setActiveCourseType}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <BookOpen className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="ug">UG Courses</SelectItem>
                  <SelectItem value="pg">PG Courses</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="bootcamp">Bootcamp</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </Card>

        {/* Lead Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(courseType === 'all' ? leads : leads.filter(l => l.course_type === courseType)).map(lead => (
            <Card 
              key={lead.lead_id} 
              className="p-4 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => handleViewLead(lead)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white ${
                    lead.lead_temperature === 'hot' ? 'bg-gradient-to-br from-red-500 to-orange-500' :
                    lead.lead_temperature === 'warm' ? 'bg-gradient-to-br from-amber-500 to-yellow-500' :
                    'bg-gradient-to-br from-blue-500 to-cyan-500'
                  }`}>
                    {lead.user_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{lead.user_name}</h4>
                    <p className="text-xs text-muted-foreground">{lead.education_level?.toUpperCase()} • {lead.years_experience}y exp</p>
                  </div>
                </div>
                <LeadTemperatureBadge temperature={lead.lead_temperature} />
              </div>
              
              <div className="mb-3 p-2 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Interested in:</span>
                  <CourseTypeBadge type={lead.course_type} />
                </div>
                <p className="font-medium text-sm mt-1 truncate">{lead.course_name}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">{lead.overall_score.toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">Score</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{(lead.purchase_probability * 100).toFixed(0)}%</p>
                  <p className="text-[10px] text-muted-foreground">Probability</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-orange-500">{lead.ad_clicks}</p>
                  <p className="text-[10px] text-muted-foreground">Ad Clicks</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {lead.last_interaction_at ? new Date(lead.last_interaction_at).toLocaleDateString() : 'No activity'}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Card>
          ))}
        </div>

        {leads.length === 0 && (
          <Card className="p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No Leads Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || temperatureFilter !== 'all' 
                ? 'Try adjusting your filters'
                : 'Click "Generate Data" to create sample leads'}
            </p>
            <Button onClick={handleGenerateSeedData} disabled={isGeneratingData}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Sample Data
            </Button>
          </Card>
        )}

        {leadsTotal > 12 && (
          <div className="text-center">
            <Button variant="outline" className="gap-2" onClick={() => setLeadsPage(p => p + 1)}>
              Load More ({leadsTotal - leads.length} remaining)
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </>
    );
  }
};

export default SuperAdminLeadIntelligence;

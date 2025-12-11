import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  Brain, MessageCircle, Calendar, Users, TrendingUp, FileText, 
  MapPin, Shield, Zap, Network, Target, Award, Globe, Sparkles 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import ParticleBackground from "@/components/ParticleBackground";

const features = [
  {
    icon: Brain,
    title: "AI Career Roadmap",
    description: "Get personalized career guidance powered by AI. Discover paths taken by successful alumni and connect with mentors in your field.",
    gradient: "gradient-accent",
    details: [
      "Personalized career recommendations based on your profile",
      "AI-powered path analysis from successful alumni",
      "Mentor matching based on career goals",
      "Skill gap analysis and development plans"
    ]
  },
  {
    icon: MessageCircle,
    title: "Connect & Chat",
    description: "Real-time messaging with fellow alumni and students. Build meaningful relationships that last beyond graduation.",
    gradient: "gradient-primary",
    details: [
      "Real-time messaging and video calls",
      "Group conversations and channels",
      "File sharing and collaboration",
      "Message history and search"
    ]
  },
  {
    icon: Calendar,
    title: "Events & Meetups",
    description: "Discover and register for alumni events, workshops, and networking sessions. Never miss an opportunity to connect.",
    gradient: "gradient-secondary",
    details: [
      "Event discovery and recommendations",
      "One-click registration and reminders",
      "Virtual and in-person event support",
      "Event networking and connections"
    ]
  },
  {
    icon: Users,
    title: "Groups & Communities",
    description: "Join interest-based groups, create communities, and engage with alumni who share your passions and goals.",
    gradient: "gradient-accent",
    details: [
      "Interest-based group discovery",
      "Create and manage your own communities",
      "Group discussions and announcements",
      "Community events and activities"
    ]
  },
  {
    icon: TrendingUp,
    title: "Career Insights",
    description: "Explore where alumni work, what they do, and how they got there. Get inspired by real success stories.",
    gradient: "gradient-primary",
    details: [
      "Alumni career path visualization",
      "Industry and company insights",
      "Salary trends and benchmarks",
      "Success stories and case studies"
    ]
  },
  {
    icon: FileText,
    title: "Document Services",
    description: "Request transcripts, recommendations, and other university documents seamlessly through the portal.",
    gradient: "gradient-secondary",
    details: [
      "Digital transcript requests",
      "Recommendation letter management",
      "Document verification and tracking",
      "Secure document delivery"
    ]
  },
  {
    icon: MapPin,
    title: "Global Alumni Network",
    description: "Connect with alumni across the globe. See where your university community is making an impact worldwide.",
    gradient: "gradient-accent",
    details: [
      "Interactive world map of alumni locations",
      "Location-based networking",
      "Regional alumni chapters",
      "Global event coordination"
    ]
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is protected with enterprise-grade security. Control your privacy settings and share what you want.",
    gradient: "gradient-primary",
    details: [
      "End-to-end encryption",
      "Privacy controls and settings",
      "GDPR compliant",
      "Regular security audits"
    ]
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built for performance. Experience blazing-fast load times and smooth interactions across all devices.",
    gradient: "gradient-secondary",
    details: [
      "Optimized performance",
      "Progressive Web App (PWA) support",
      "Offline functionality",
      "Cross-platform compatibility"
    ]
  }
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0], index: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  const Icon = feature.icon;
  
  return (
    <Card
      ref={ref}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative overflow-hidden p-6 sm:p-8 border-border/50 hover:border-primary/50 transition-all duration-700 shadow-custom-sm hover:shadow-custom-lg bg-card transform ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-10'
      } ${isHovered ? 'sm:scale-105' : ''}`}
      style={{
        transitionDelay: `${index * 100}ms`,
      }}
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 ${feature.gradient} opacity-0 group-hover:opacity-10 transition-smooth`} />
      
      {/* Animated background gradient */}
      <div className={`absolute inset-0 ${feature.gradient} opacity-0 group-hover:opacity-5 transition-smooth blur-3xl`} />
      
      <div className="relative z-10">
        {/* Icon */}
        <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl ${feature.gradient} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-smooth shadow-lg`}>
          <Icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white group-hover:scale-110 transition-smooth" />
        </div>

        {/* Content */}
        <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3 group-hover:text-primary transition-smooth">
          {feature.title}
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3 sm:mb-4">
          {feature.description}
        </p>

        {/* Details list */}
        <ul className="space-y-1.5 sm:space-y-2">
          {feature.details.map((detail, idx) => (
            <li 
              key={idx}
              className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300"
              style={{ transitionDelay: `${idx * 50}ms` }}
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-accent mt-0.5 flex-shrink-0" />
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${feature.gradient} scale-x-0 group-hover:scale-x-100 transition-smooth origin-left`} />
      
      {/* Shine effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </Card>
  );
};

const FeaturesPage = () => {
  const navigate = useNavigate();
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation(0.1);
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation(0.2);

  const stats = [
    { label: "Active Alumni", value: "50K+", icon: Users },
    { label: "Events Hosted", value: "500+", icon: Calendar },
    { label: "Countries", value: "100+", icon: Globe },
    { label: "Success Rate", value: "95%", icon: Award },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-[50vh] sm:min-h-[60vh] md:min-h-[70vh] flex items-center overflow-hidden pt-16 sm:pt-20">
        <ParticleBackground />
        <div className="absolute inset-0 gradient-hero opacity-90 z-0" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20 py-8 sm:py-12">
          <div 
            ref={heroRef}
            className={`max-w-4xl mx-auto text-center transition-all duration-700 ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4 sm:mb-6">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
              <span className="text-xs sm:text-sm font-medium text-white">Platform Features</span>
            </div>
            
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2">
              Everything You Need to
              <span className="block bg-gradient-to-r from-accent via-secondary to-accent bg-clip-text text-transparent">
                Succeed Together
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Discover powerful features designed to connect, engage, and empower your alumni community.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            ref={statsRef}
            className={`grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 transition-all duration-700 ${
              statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index}
                  className="text-center p-4 sm:p-6 rounded-xl bg-background border border-border hover:border-primary/50 transition-smooth group"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-smooth">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground leading-tight">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute top-10 left-10 w-48 h-48 sm:w-64 sm:h-64 bg-accent/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-64 h-64 sm:w-80 sm:h-80 bg-secondary/20 rounded-full blur-3xl animate-float-delayed" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
              Ready to Experience These Features?
            </h2>
            <p className="text-base sm:text-lg text-white/90 mb-6 sm:mb-8 px-4">
              Join thousands of alumni who are already connecting, growing, and succeeding together.
            </p>
            <Button 
              size="lg" 
              className="w-full sm:w-auto gradient-secondary text-white hover:opacity-90 transition-smooth shadow-custom-lg px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-xl hover:scale-105"
              onClick={() => navigate('/login')}
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FeaturesPage;


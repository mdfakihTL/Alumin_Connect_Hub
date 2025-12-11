import { Brain, MessageCircle, Calendar, Users, TrendingUp, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useEffect, useRef, useState } from "react";

const features = [
  {
    icon: Brain,
    title: "AI Career Roadmap",
    description: "Get personalized career guidance powered by AI. Discover paths taken by successful alumni and connect with mentors in your field.",
    gradient: "gradient-accent",
  },
  {
    icon: MessageCircle,
    title: "Connect & Chat",
    description: "Real-time messaging with fellow alumni and students. Build meaningful relationships that last beyond graduation.",
    gradient: "gradient-primary",
  },
  {
    icon: Calendar,
    title: "Events & Meetups",
    description: "Discover and register for alumni events, workshops, and networking sessions. Never miss an opportunity to connect.",
    gradient: "gradient-secondary",
  },
  {
    icon: Users,
    title: "Groups & Communities",
    description: "Join interest-based groups, create communities, and engage with alumni who share your passions and goals.",
    gradient: "gradient-accent",
  },
  {
    icon: TrendingUp,
    title: "Career Insights",
    description: "Explore where alumni work, what they do, and how they got there. Get inspired by real success stories.",
    gradient: "gradient-primary",
  },
  {
    icon: FileText,
    title: "Document Services",
    description: "Request transcripts, recommendations, and other university documents seamlessly through the portal.",
    gradient: "gradient-secondary",
  },
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0], index: number }) => {
  const [isVisible, setIsVisible] = useState(false);
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
      className={`group relative overflow-hidden p-6 sm:p-8 border-border/50 hover:border-primary/50 transition-smooth shadow-custom-sm hover:shadow-custom-md bg-card transform transition-all duration-700 ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-10'
      }`}
      style={{
        transitionDelay: `${index * 100}ms`,
      }}
    >
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 ${feature.gradient} opacity-0 group-hover:opacity-5 transition-smooth`} />
      
      {/* Animated background gradient */}
      <div className={`absolute inset-0 ${feature.gradient} opacity-0 group-hover:opacity-10 transition-smooth blur-2xl`} />
      
      <div className="relative z-10">
        {/* Icon */}
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${feature.gradient} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-smooth shadow-lg`}>
          <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-smooth" />
        </div>

        {/* Content */}
        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3 group-hover:text-primary transition-smooth">
          {feature.title}
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {feature.description}
        </p>
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${feature.gradient} scale-x-0 group-hover:scale-x-100 transition-smooth origin-left`} />
      
      {/* Shine effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </Card>
  );
};

const Features = () => {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section id="features-section" className="py-16 sm:py-20 md:py-32 bg-background scroll-mt-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div 
          ref={ref}
          className={`text-center max-w-3xl mx-auto mb-12 sm:mb-16 transition-all duration-700 ${
            isVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
            Everything You Need to
            <span className="text-primary font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Thrive</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground px-4">
            From AI-powered career guidance to seamless networking, we've built the complete alumni experience.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
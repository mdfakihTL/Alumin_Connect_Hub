import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Shield, Users, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useEffect, useState } from "react";

const CTASection = () => {
  const navigate = useNavigate();
  const { ref, isVisible } = useScrollAnimation(0.2);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="py-16 sm:py-20 md:py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-hero opacity-95" />
      
      {/* Animated gradient orbs with parallax */}
      <div 
        className="absolute top-10 left-10 w-48 h-48 sm:w-64 sm:h-64 bg-accent/20 rounded-full blur-3xl animate-float"
        style={{
          transform: `translate(${mousePosition.x * 0.3}px, ${mousePosition.y * 0.3}px)`,
        }}
      />
      <div 
        className="absolute bottom-10 right-10 w-64 h-64 sm:w-80 sm:h-80 bg-secondary/20 rounded-full blur-3xl animate-float-delayed"
        style={{
          transform: `translate(${mousePosition.x * -0.2}px, ${mousePosition.y * -0.2}px)`,
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />

      {/* Animated grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite',
        }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div 
          ref={ref}
          className={`max-w-4xl mx-auto text-center transition-all duration-700 ${
            isVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4 sm:mb-6 animate-fade-in-up">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-accent animate-sparkle" />
            <span className="text-xs sm:text-sm font-medium text-white">Join Your Alumni Network</span>
          </div>

          {/* Headline */}
          <h2 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight px-4"
            style={{
              transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`,
            }}
          >
            Ready to Connect with<br className="hidden sm:block" />
            <span className="sm:inline block bg-gradient-to-r from-accent via-secondary to-accent bg-clip-text text-transparent">
              Your Alumni Community?
            </span>
          </h2>

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-4">
            Whether you're a current student planning your career or an alumnus looking to give back, 
            AlumniHub is your gateway to meaningful connections.
          </p>

          {/* CTA Button */}
          <div className="mb-8 sm:mb-10">
            <Button 
              size="lg" 
              className="gradient-secondary text-white hover:opacity-90 transition-smooth shadow-custom-lg group px-8 sm:px-10 py-6 sm:py-7 text-lg sm:text-xl font-semibold rounded-xl hover:scale-105 hover:shadow-glow"
              onClick={() => navigate('/login')}
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-smooth" />
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-8 sm:mt-12 flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8 text-white/70 text-xs sm:text-sm px-4">
            <div className="flex items-center gap-2 group hover:text-white transition-smooth">
              <div className="w-2 h-2 rounded-full bg-accent group-hover:scale-150 transition-smooth" />
              <span>100% Secure</span>
            </div>
            <div className="flex items-center gap-2 group hover:text-white transition-smooth">
              <div className="w-2 h-2 rounded-full bg-secondary group-hover:scale-150 transition-smooth" />
              <span>Free to Join</span>
            </div>
            <div className="flex items-center gap-2 group hover:text-white transition-smooth">
              <div className="w-2 h-2 rounded-full bg-primary group-hover:scale-150 transition-smooth" />
              <span>Verified Alumni</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
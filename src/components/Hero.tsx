import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Sparkles, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import heroImage from "@/assets/hero-network.jpg";
import ParticleBackground from "./ParticleBackground";

const Hero = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const scrollToFeatures = () => {
    navigate('/features');
  };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* 3D Particle Background */}
      <ParticleBackground />
      
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-hero opacity-90 z-0" />
      
      {/* Hero image overlay */}
      <div 
        className="absolute inset-0 opacity-18 mix-blend-overlay z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Animated gradient orbs with parallax */}
      <div 
        className="absolute top-20 right-10 w-72 h-72 bg-accent/15 rounded-full blur-3xl animate-float z-0"
        style={{
          transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
        }}
      />
      <div 
        className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/15 rounded-full blur-3xl animate-float-delayed z-0"
        style={{
          transform: `translate(${mousePosition.x * -0.3}px, ${mousePosition.y * -0.3}px)`,
        }}
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl animate-pulse-slow z-0"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div 
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4 sm:mb-6 animate-fade-in-up"
            style={{
              transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`,
            }}
          >
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-accent animate-sparkle" />
            <span className="text-xs sm:text-sm font-medium text-white">Powered by AI</span>
          </div>

          {/* Headline */}
          <h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight animate-fade-in-up-delay-1"
            style={{
              transform: `translate(${mousePosition.x * 0.15}px, ${mousePosition.y * 0.15}px)`,
            }}
          >
            Connect. Grow.<br />
            <span 
              className="font-extrabold bg-gradient-to-r from-accent via-secondary to-accent bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(41,171,177,0.5)]"
              style={{
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 3s ease infinite',
              }}
            >
              Succeed Together.
            </span>
          </h1>

          {/* Subheadline */}
          <p 
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4 animate-fade-in-up-delay-2"
            style={{
              transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`,
            }}
          >
            Your university's alumni network at your fingertips. Build meaningful connections, 
            discover career paths, and grow with AI-powered guidance.
          </p>

          {/* CTA Buttons */}
          <div 
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 animate-fade-in-up-delay-3"
            style={{
              transform: `translate(${mousePosition.x * 0.05}px, ${mousePosition.y * 0.05}px)`,
            }}
          >
            <Button 
              size="lg" 
              className="w-full sm:w-auto gradient-secondary text-white hover:opacity-90 transition-smooth shadow-custom-lg group px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-xl hover:scale-105 hover:shadow-glow"
              onClick={() => navigate('/login')}
            >
              Get Started
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-smooth" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 transition-smooth px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-xl hover:scale-105"
              onClick={scrollToFeatures}
            >
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div 
            className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-8 mt-12 sm:mt-16 max-w-2xl mx-auto px-4 animate-fade-in-up-delay-4"
          >
            <div className="text-center group cursor-default">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur-sm mx-auto mb-2 sm:mb-3 group-hover:scale-110 group-hover:bg-white/20 transition-smooth">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1 group-hover:scale-110 transition-smooth">50K+</div>
              <div className="text-xs sm:text-sm text-white/70">Alumni</div>
            </div>
            <div className="text-center group cursor-default">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur-sm mx-auto mb-2 sm:mb-3 group-hover:scale-110 group-hover:bg-white/20 transition-smooth">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1 group-hover:scale-110 transition-smooth">500+</div>
              <div className="text-xs sm:text-sm text-white/70">Events</div>
            </div>
            <div className="text-center group cursor-default">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur-sm mx-auto mb-2 sm:mb-3 group-hover:scale-110 group-hover:bg-white/20 transition-smooth">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1 group-hover:scale-110 transition-smooth">AI</div>
              <div className="text-xs sm:text-sm text-white/70">Powered</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
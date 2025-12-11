import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  GraduationCap, Target, Users, TrendingUp, Award, Globe, 
  Lightbulb, Heart, Zap, Shield, Sparkles, ArrowRight 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import ParticleBackground from "@/components/ParticleBackground";

const AboutPage = () => {
  const navigate = useNavigate();
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation(0.1);
  const { ref: missionRef, isVisible: missionVisible } = useScrollAnimation(0.2);
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation(0.2);
  const { ref: valuesRef, isVisible: valuesVisible } = useScrollAnimation(0.2);

  const stats = [
    { value: "6,00,000+", label: "Students Impacted", icon: Users },
    { value: "60+", label: "Universities", icon: GraduationCap },
    { value: "900+", label: "Corporates", icon: TrendingUp },
    { value: "100%", label: "Dedicated", icon: Heart },
  ];

  const values = [
    {
      icon: Target,
      title: "Mission-Driven",
      description: "Building an ecosystem that makes Every Learner Employable through innovative solutions.",
      gradient: "gradient-primary"
    },
    {
      icon: Lightbulb,
      title: "Innovation First",
      description: "Cutting-edge technology platform with advanced pedagogy and content solutions.",
      gradient: "gradient-accent"
    },
    {
      icon: Users,
      title: "Partnership Focused",
      description: "Working closely with Higher Education Institutes and Employers to deliver value.",
      gradient: "gradient-secondary"
    },
    {
      icon: Award,
      title: "Excellence",
      description: "Delivering the right ROI, learning outcomes, and service levels to all stakeholders.",
      gradient: "gradient-primary"
    }
  ];

  const services = [
    {
      title: "For Educators",
      items: [
        "Online Program Management",
        "Content Solutions",
        "Apprenticeship/Internship Linked Degrees",
        "Assessment Solutions",
        "Accreditation Platform",
        "Learning Management System"
      ],
      gradient: "gradient-primary"
    },
    {
      title: "For Companies",
      items: [
        "Hire-Train-Deploy Programs",
        "Induction Training Programs",
        "Work Linked Learning Programs",
        "Training Solutions",
        "Just In Time Hybrid Training",
        "Long Term Master Programs",
        "Certifications And Accreditations",
        "Psychometric Assessments"
      ],
      gradient: "gradient-secondary"
    }
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
              <span className="text-xs sm:text-sm font-medium text-white">About TeamLease EdTech</span>
            </div>
            
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2">
              Making India
              <span className="block bg-gradient-to-r from-accent via-secondary to-accent bg-clip-text text-transparent">
                Employable
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              TeamLease EdTech is on a mission to build an ecosystem that makes Every Learner Employable. 
              Connecting the dots between Education, Employability, and Continued Employability across India & Bharat.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Button 
                size="lg" 
                className="w-full sm:w-auto gradient-secondary text-white hover:opacity-90 transition-smooth shadow-custom-lg px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-xl hover:scale-105"
                onClick={() => window.open('https://www.teamleaseedtech.com/', '_blank')}
              >
                Visit Our Website
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 transition-smooth px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-xl hover:scale-105"
                onClick={() => navigate('/login')}
              >
                Get Started
              </Button>
            </div>
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

      {/* Mission Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div 
            ref={missionRef}
            className={`max-w-4xl mx-auto transition-all duration-700 ${
              missionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 px-4">
                Our Mission
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed px-4">
                All across India & Bharat, from Classrooms to Boardrooms, through Upskilling and Training, 
                TeamLease EdTech impacts every learner on the platform and improves Employability, Productivity, 
                Resilience and Return On Investment.
              </p>
            </div>

            <Card className="p-6 sm:p-8 md:p-12 bg-card border-border/50">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">For Higher Education Institutes</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      We enable Higher Education Institutes to provide the right ROI, learning outcomes, and level 
                      of service to their students through our experienced team, cutting-edge technology platform, 
                      and innovative pedagogy and content.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-secondary flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">For Employers</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      We help Employers improve productivity and competitiveness through professional development 
                      programs, training solutions, and workforce development initiatives.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-32 bg-card/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 px-4">
              Our Core Values
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground px-4">
              The principles that guide everything we do
            </p>
          </div>

          <div 
            ref={valuesRef}
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 transition-all duration-700 ${
              valuesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card
                  key={index}
                  className="p-5 sm:p-6 border-border/50 hover:border-primary/50 transition-smooth group hover:shadow-custom-md"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${value.gradient} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-smooth`}>
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">{value.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 px-4">
              Our Solutions
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground px-4">
              Comprehensive services for Educators and Companies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {services.map((service, index) => (
              <Card
                key={index}
                className="p-6 sm:p-8 border-border/50 hover:border-primary/50 transition-smooth group hover:shadow-custom-lg"
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl ${service.gradient} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-smooth`}>
                  {index === 0 ? (
                    <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                  ) : (
                    <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">{service.title}</h3>
                <ul className="space-y-2 sm:space-y-3">
                  {service.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-muted-foreground">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
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
              Join Us in Making India Employable
            </h2>
            <p className="text-base sm:text-lg text-white/90 mb-6 sm:mb-8 px-4">
              Be part of a movement that's transforming education and employability across India & Bharat.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Button 
                size="lg" 
                className="w-full sm:w-auto gradient-secondary text-white hover:opacity-90 transition-smooth shadow-custom-lg px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-xl hover:scale-105"
                onClick={() => navigate('/login')}
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 transition-smooth px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-xl hover:scale-105"
                onClick={() => window.open('https://www.teamleaseedtech.com/', '_blank')}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;


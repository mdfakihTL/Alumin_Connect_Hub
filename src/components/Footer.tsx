import { GraduationCap, Linkedin, Twitter, Facebook, Instagram } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Footer = () => {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <footer 
      ref={ref}
      className={`bg-card border-t border-border py-6 sm:py-8 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8">
          {/* Brand - Compact */}
          <div className="flex-1 max-w-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground">AlumniHub</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Connecting university communities worldwide.
            </p>
            <div className="flex gap-2">
              <a 
                href="#" 
                className="w-8 h-8 rounded-lg bg-muted hover:bg-primary transition-smooth flex items-center justify-center group"
              >
                <Linkedin className="w-4 h-4 text-muted-foreground group-hover:text-white transition-smooth" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 rounded-lg bg-muted hover:bg-primary transition-smooth flex items-center justify-center group"
              >
                <Twitter className="w-4 h-4 text-muted-foreground group-hover:text-white transition-smooth" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 rounded-lg bg-muted hover:bg-primary transition-smooth flex items-center justify-center group"
              >
                <Facebook className="w-4 h-4 text-muted-foreground group-hover:text-white transition-smooth" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 rounded-lg bg-muted hover:bg-primary transition-smooth flex items-center justify-center group"
              >
                <Instagram className="w-4 h-4 text-muted-foreground group-hover:text-white transition-smooth" />
              </a>
            </div>
          </div>

          {/* Company - Horizontal on desktop */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 items-center">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-smooth">About Us</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-smooth">Careers</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-smooth">Contact</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-smooth">Privacy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-smooth">Terms</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-smooth">Support</a>
          </div>

          {/* Copyright - Inline */}
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            © 2025 AlumniHub
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
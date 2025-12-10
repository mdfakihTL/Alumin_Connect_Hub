import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // PWA detection for both desktop and mobile
    // This ensures consistent login routing regardless of platform
    const detectPWA = (): boolean => {
      // Primary method: Check display mode (works for both desktop and mobile PWAs)
      // This is the most reliable indicator for installed PWAs
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
      }

      // Secondary method: iOS Safari standalone mode
      // iOS Safari uses navigator.standalone when added to home screen
      if ((window.navigator as any).standalone === true) {
        return true;
      }

      // Tertiary method: Android app referrer
      // Android PWAs launched from home screen have this referrer
      if (document.referrer.includes('android-app://')) {
        return true;
      }

      // Additional check: Fullscreen or minimal-ui display modes
      // Some desktop PWAs may use these modes
      if (window.matchMedia('(display-mode: fullscreen)').matches ||
          window.matchMedia('(display-mode: minimal-ui)').matches) {
        return true;
      }

      return false;
    };

    const isPWA = detectPWA();

    // If running as PWA (desktop or mobile), redirect to login immediately
    // This ensures consistent behavior: PWAs always open to login page
    if (isPWA) {
      console.log('PWA detected - redirecting to login');
      // Use replace to avoid adding to history stack
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />
      <main className="pt-14 sm:pt-16 md:pt-20">
        <Hero />
        <Features />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
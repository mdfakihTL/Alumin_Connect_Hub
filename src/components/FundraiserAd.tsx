/**
 * FundraiserAd Component
 * 
 * Displays active fundraiser campaigns as ads in the alumni sidebar/feed.
 * Features:
 * - Shows only active fundraisers within date range
 * - Tracks clicks with debounce
 * - Redirects to external donation link
 * - Loading skeleton and empty states
 * - Responsive design
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ExternalLink, Calendar, Clock, ChevronRight, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fundraiserApi, Fundraiser, getDaysRemaining } from '@/api/fundraiser';

interface FundraiserAdProps {
  placement?: 'sidebar' | 'feed' | 'fullwidth';
  maxItems?: number;
  className?: string;
}

const FundraiserAd = ({ placement = 'sidebar', maxItems = 3, className = '' }: FundraiserAdProps) => {
  const { toast } = useToast();
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clickingId, setClickingId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  // Handle image error - hide broken images
  const handleImageError = (fundraiserId: string) => {
    setBrokenImages(prev => new Set(prev).add(fundraiserId));
  };

  // Check if image is valid (not broken and has a valid URL)
  const hasValidImage = (fundraiser: Fundraiser) => {
    if (!fundraiser.image) return false;
    if (brokenImages.has(fundraiser.id)) return false;
    // Basic check for image URLs
    const imageUrl = fundraiser.image.toLowerCase();
    return imageUrl.startsWith('http') && (
      imageUrl.includes('.jpg') || 
      imageUrl.includes('.jpeg') || 
      imageUrl.includes('.png') || 
      imageUrl.includes('.gif') || 
      imageUrl.includes('.webp') ||
      imageUrl.includes('unsplash') ||
      imageUrl.includes('images') ||
      imageUrl.includes('cloudinary') ||
      imageUrl.includes('imgur') ||
      imageUrl.includes('s3.amazonaws')
    );
  };

  // Load active fundraisers
  const loadFundraisers = useCallback(async () => {
    try {
      const data = await fundraiserApi.listActive();
      setFundraisers(data.slice(0, maxItems));
    } catch (error) {
      console.error('[FundraiserAd] Failed to load:', error);
    } finally {
      setIsLoading(false);
    }
  }, [maxItems]);

  useEffect(() => {
    loadFundraisers();
  }, [loadFundraisers]);

  // Auto-rotate for sidebar placement
  useEffect(() => {
    if (placement === 'sidebar' && fundraisers.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % fundraisers.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [placement, fundraisers.length]);

  // Handle donate click
  const handleDonateClick = async (fundraiser: Fundraiser) => {
    if (clickingId) return; // Prevent double-click
    
    setClickingId(fundraiser.id);
    
    try {
      // Track the click
      const response = await fundraiserApi.trackClick(fundraiser.id);
      
      // Open donation link in new tab
      window.open(response.redirect_url || fundraiser.donation_link, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      console.error('[FundraiserAd] Track click error:', error);
      // Still open the link even if tracking fails
      window.open(fundraiser.donation_link, '_blank', 'noopener,noreferrer');
    } finally {
      setTimeout(() => setClickingId(null), 1000);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={className}>
        {placement === 'sidebar' ? (
          <Card className="p-4">
            <Skeleton className="h-32 w-full rounded-lg mb-3" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-2/3 mb-3" />
            <Skeleton className="h-9 w-full rounded-md" />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4">
                <Skeleton className="h-36 w-full rounded-lg mb-3" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-2/3 mb-3" />
                <Skeleton className="h-10 w-full rounded-md" />
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Empty state
  if (fundraisers.length === 0) {
    return null; // Don't show anything if no active fundraisers
  }

  // Sidebar placement - single card with rotation
  if (placement === 'sidebar') {
    const fundraiser = fundraisers[currentIndex];
    const daysRemaining = getDaysRemaining(fundraiser.end_date);
    
    return (
      <div className={className}>
        <Card className="overflow-hidden bg-gradient-to-br from-emerald-500/5 via-background to-teal-500/5 border-emerald-500/20">
          {/* Badge */}
          <div className="px-4 pt-3 flex items-center justify-between">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Support Campaign
            </Badge>
            {fundraisers.length > 1 && (
              <div className="flex gap-1">
                {fundraisers.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i === currentIndex ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Image */}
          {fundraiser.image && !brokenImages.has(fundraiser.id) && (
            <div className="px-4 pt-3">
              <div className="relative h-28 rounded-lg overflow-hidden bg-muted">
                <img 
                  src={fundraiser.image} 
                  alt={fundraiser.title}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(fundraiser.id)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                {daysRemaining > 0 && daysRemaining <= 7 && (
                  <Badge className="absolute bottom-2 right-2 bg-orange-500 text-white text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {daysRemaining} days left
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {/* Content */}
          <div className="p-4">
            <h4 className="font-semibold text-sm mb-1 line-clamp-1">{fundraiser.title}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{fundraiser.description}</p>
            
            {/* Date */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <Calendar className="w-3 h-3" />
              <span>Ends {new Date(fundraiser.end_date).toLocaleDateString()}</span>
            </div>
            
            {/* CTA */}
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              size="sm"
              onClick={() => handleDonateClick(fundraiser)}
              disabled={clickingId === fundraiser.id}
            >
              {clickingId === fundraiser.id ? (
                'Opening...'
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Donate Now
                  <ExternalLink className="w-3 h-3 ml-2" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Feed/fullwidth placement - grid of cards
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-emerald-500" />
          <h3 className="font-semibold">Support Our Campaigns</h3>
        </div>
        {fundraisers.length > maxItems && (
          <Button variant="ghost" size="sm" className="text-emerald-600">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
      
      <div className={`grid gap-4 ${placement === 'fullwidth' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
        {fundraisers.map(fundraiser => {
          const daysRemaining = getDaysRemaining(fundraiser.end_date);
          
          return (
            <Card key={fundraiser.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              {fundraiser.image && !brokenImages.has(fundraiser.id) && (
                <div className="relative h-40 bg-muted">
                  <img 
                    src={fundraiser.image} 
                    alt={fundraiser.title}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(fundraiser.id)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <Badge className="absolute top-3 left-3 bg-emerald-500/90 text-white">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Campaign
                  </Badge>
                  {daysRemaining > 0 && daysRemaining <= 14 && (
                    <Badge className="absolute bottom-3 right-3 bg-orange-500 text-white">
                      <Clock className="w-3 h-3 mr-1" />
                      {daysRemaining} days left
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Content */}
              <div className="p-4">
                <h4 className="font-semibold mb-2 line-clamp-1">{fundraiser.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{fundraiser.description}</p>
                
                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(fundraiser.start_date).toLocaleDateString()} - {new Date(fundraiser.end_date).toLocaleDateString()}</span>
                </div>
                
                {/* CTA */}
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleDonateClick(fundraiser)}
                  disabled={clickingId === fundraiser.id}
                >
                  {clickingId === fundraiser.id ? (
                    'Opening...'
                  ) : (
                    <>
                      <Heart className="w-4 h-4 mr-2" />
                      Donate Now
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default FundraiserAd;


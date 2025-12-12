import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Filter, X, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { feedService } from '@/services/feedService';
import { TagOption, UniversityOption, PostTag } from '@/types/feed';
import { useToast } from '@/hooks/use-toast';

interface PostFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  activeFilters: FilterOptions;
}

export interface FilterOptions {
  postTypes: string[];
  tags: PostTag[];
  universities: number[]; // Changed to store university IDs
}

const postTypes = [
  { value: 'text', label: 'Text Posts' },
  { value: 'image', label: 'Image Posts' },
  { value: 'video', label: 'Video Posts' },
  { value: 'job', label: 'Job Opportunities' },
  { value: 'announcement', label: 'Announcements' },
];

// Tag icons mapping for display
const tagIcons: Record<PostTag, string> = {
  'success_story': '🏆',
  'career_milestone': '📈',
  'achievement': '⭐',
  'learning_journey': '📚',
  'volunteering': '❤️',
};

const PostFilter = ({ onFilterChange, activeFilters }: PostFilterProps) => {
  const { toast } = useToast();
  const [localFilters, setLocalFilters] = useState<FilterOptions>(activeFilters);
  const [isOpen, setIsOpen] = useState(false);
  
  // API filter options state
  const [tagOptions, setTagOptions] = useState<TagOption[]>([]);
  const [universityOptions, setUniversityOptions] = useState<UniversityOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // Fetch filter options when sheet opens
  useEffect(() => {
    if (isOpen && tagOptions.length === 0) {
      fetchFilterOptions();
    }
  }, [isOpen]);

  const fetchFilterOptions = async () => {
    setIsLoadingOptions(true);
    setOptionsError(null);
    
    try {
      const options = await feedService.getFilterOptions();
      setTagOptions(options.tags);
      setUniversityOptions(options.universities);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load filter options';
      setOptionsError(errorMessage);
      // Use fallback options if API fails
      setTagOptions([
        { value: 'success_story', label: 'Success Story' },
        { value: 'career_milestone', label: 'Career Milestone' },
        { value: 'achievement', label: 'Achievement' },
        { value: 'learning_journey', label: 'Learning Journey' },
        { value: 'volunteering', label: 'Volunteering' },
      ]);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleTogglePostType = (type: string) => {
    const newTypes = localFilters.postTypes.includes(type)
      ? localFilters.postTypes.filter((t) => t !== type)
      : [...localFilters.postTypes, type];
    setLocalFilters({ ...localFilters, postTypes: newTypes });
  };

  const handleToggleTag = (tag: PostTag) => {
    const newTags = localFilters.tags.includes(tag)
      ? localFilters.tags.filter((t) => t !== tag)
      : [...localFilters.tags, tag];
    setLocalFilters({ ...localFilters, tags: newTags });
  };

  const handleToggleUniversity = (universityId: number) => {
    const newUniversities = localFilters.universities.includes(universityId)
      ? localFilters.universities.filter((u) => u !== universityId)
      : [...localFilters.universities, universityId];
    setLocalFilters({ ...localFilters, universities: newUniversities });
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    setIsOpen(false);
    
    // Show feedback if filters are applied
    const filterCount = activeFilterCount;
    if (filterCount > 0) {
      toast({
        title: 'Filters applied',
        description: `${filterCount} filter${filterCount > 1 ? 's' : ''} active`,
      });
    }
  };

  const handleClearFilters = () => {
    const emptyFilters: FilterOptions = {
      postTypes: [],
      tags: [],
      universities: [],
    };
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
    toast({
      title: 'Filters cleared',
      description: 'All filters have been removed',
    });
  };

  // Sync local filters with active filters when they change externally
  useEffect(() => {
    setLocalFilters(activeFilters);
  }, [activeFilters]);

  const activeFilterCount =
    localFilters.postTypes.length +
    localFilters.tags.length +
    localFilters.universities.length;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="gap-1.5 sm:gap-2 relative h-9 sm:h-10 px-2.5 sm:px-4 text-sm"
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filter Posts</span>
          <span className="sm:hidden">Filter</span>
          {activeFilterCount > 0 && (
            <Badge className="ml-0.5 sm:ml-1 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] sm:text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">Filter Posts</SheetTitle>
          <SheetDescription>
            Refine your feed by post type, tags, and university
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Loading State */}
          {isLoadingOptions && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading filters...</span>
            </div>
          )}

          {/* Error State */}
          {optionsError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{optionsError}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchFilterOptions}
                className="mt-2 text-xs"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Post Types */}
          {!isLoadingOptions && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Post Type</Label>
                <div className="space-y-2">
                  {postTypes.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type.value}`}
                        checked={localFilters.postTypes.includes(type.value)}
                        onCheckedChange={() => handleTogglePostType(type.value)}
                      />
                      <label
                        htmlFor={`type-${type.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {type.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map((tag) => (
                    <Badge
                      key={tag.value}
                      variant={localFilters.tags.includes(tag.value) ? 'default' : 'outline'}
                      className="cursor-pointer transition-all hover:scale-105"
                      onClick={() => handleToggleTag(tag.value)}
                    >
                      <span className="mr-1">{tagIcons[tag.value] || '🏷️'}</span>
                      {tag.label}
                    </Badge>
                  ))}
                </div>
                {tagOptions.length === 0 && !isLoadingOptions && (
                  <p className="text-xs text-muted-foreground">No tags available</p>
                )}
              </div>

              {/* Universities */}
              {universityOptions.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">University</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {universityOptions.map((university) => (
                      <div key={university.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`university-${university.id}`}
                          checked={localFilters.universities.includes(university.id)}
                          onCheckedChange={() => handleToggleUniversity(university.id)}
                        />
                        <label
                          htmlFor={`university-${university.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {university.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="flex-1"
            disabled={activeFilterCount === 0}
          >
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          <Button onClick={handleApplyFilters} className="flex-1">
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PostFilter;

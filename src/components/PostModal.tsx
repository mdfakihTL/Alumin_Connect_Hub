import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ImageIcon, Video, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PostTag, PostMedia, SUPPORTED_IMAGE_FORMATS, SUPPORTED_VIDEO_FORMATS, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE } from '@/types/feed';
import { feedService } from '@/services/feedService';
import { useToast } from '@/hooks/use-toast';

// Selected media file (before upload)
interface SelectedMedia {
  file: File;
  type: 'image' | 'video';
  previewUrl: string;
}

// Existing media (from API, for editing)
interface ExistingMedia {
  id: number;
  type: 'image' | 'video';
  url: string;
  postId: number;
}

interface PostModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (content: string, mediaFiles: File[], tag?: PostTag) => Promise<void>;
  editPost?: {
    id: number;
    content: string;
    existingMedia?: ExistingMedia[];
    tag?: PostTag;
  } | null;
  isSubmitting?: boolean;
}

// Tags using API format (snake_case)
const postTags: { value: PostTag; label: string; icon: string; color: string }[] = [
  { value: 'success_story', label: 'Success Story', icon: '🏆', color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30' },
  { value: 'career_milestone', label: 'Career Milestone', icon: '📈', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30' },
  { value: 'achievement', label: 'Achievement', icon: '⭐', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30' },
  { value: 'learning_journey', label: 'Learning Journey', icon: '📚', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30' },
  { value: 'volunteering', label: 'Volunteering', icon: '❤️', color: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/30' },
];

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const PostModal = ({ open, onClose, onSubmit, editPost, isSubmitting = false }: PostModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [existingMedia, setExistingMedia] = useState<ExistingMedia[]>([]);
  const [mediaToDelete, setMediaToDelete] = useState<number[]>([]);
  const [selectedTag, setSelectedTag] = useState<PostTag | ''>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes or when editing different post
  useEffect(() => {
    if (editPost) {
      setContent(editPost.content);
      setExistingMedia(editPost.existingMedia || []);
      setSelectedTag(editPost.tag || '');
    } else {
      setContent('');
      setExistingMedia([]);
      setSelectedTag('');
    }
    // Always reset these on open
    setSelectedMedia([]);
    setMediaToDelete([]);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadError(null);
  }, [editPost, open]);

  // Cleanup preview URLs when component unmounts or media changes
  useEffect(() => {
    return () => {
      selectedMedia.forEach(media => {
        URL.revokeObjectURL(media.previewUrl);
      });
    };
  }, [selectedMedia]);

  const validateAndAddMedia = (file: File): boolean => {
    const validation = feedService.validateMediaFile(file);
    
    if (!validation.valid) {
      toast({
        title: 'Invalid file',
        description: validation.error,
        variant: 'destructive',
      });
      return false;
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedMedia(prev => [...prev, {
      file,
      type: validation.mediaType!,
      previewUrl,
    }]);
    
    return true;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => validateAndAddMedia(file));
    }
    // Reset input to allow selecting same file again
    e.target.value = '';
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => validateAndAddMedia(file));
    }
    // Reset input to allow selecting same file again
    e.target.value = '';
  };

  const removeSelectedMedia = (index: number) => {
    setSelectedMedia(prev => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingMedia = (mediaId: number) => {
    setMediaToDelete(prev => [...prev, mediaId]);
    setExistingMedia(prev => prev.filter(m => m.id !== mediaId));
  };

  const handleSubmit = async () => {
    if (!content.trim() && selectedMedia.length === 0 && existingMedia.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Delete media marked for deletion (for edit mode)
      if (editPost && mediaToDelete.length > 0) {
        for (const mediaId of mediaToDelete) {
          try {
            await feedService.deleteMedia(editPost.id, mediaId);
          } catch (err) {
            console.error('Failed to delete media:', err);
            // Continue with other deletions
          }
        }
      }

      // Extract files to upload
      const files = selectedMedia.map(m => m.file);
      
      // Call parent submit with files
      await onSubmit(content, files, selectedTag || undefined);
      
      // Clean up
      selectedMedia.forEach(media => {
        URL.revokeObjectURL(media.previewUrl);
      });
      setContent('');
      setSelectedMedia([]);
      setExistingMedia([]);
      setMediaToDelete([]);
      setSelectedTag('');
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create post';
      setUploadError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Type guard for tag selection toggle
  const handleTagToggle = (tagValue: PostTag) => {
    setSelectedTag(selectedTag === tagValue ? '' : tagValue);
  };

  const handleClose = () => {
    // Clean up preview URLs
    selectedMedia.forEach(media => {
      URL.revokeObjectURL(media.previewUrl);
    });
    setContent('');
    setSelectedMedia([]);
    setExistingMedia([]);
    setMediaToDelete([]);
    setSelectedTag('');
    setUploadError(null);
    onClose();
  };

  const totalMediaCount = selectedMedia.length + existingMedia.length;
  const hasContent = content.trim().length > 0 || totalMediaCount > 0;
  const isProcessing = isSubmitting || isUploading;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {editPost ? 'Edit Post' : 'Create Post'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-12 h-12 rounded-full ring-2 ring-primary/20"
            />
            <div>
              <p className="font-semibold text-base">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.university}</p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="post-content" className="text-base font-medium">What's on your mind?</Label>
            <Textarea
              id="post-content"
              placeholder="Share your thoughts, achievements, or opportunities..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px] resize-none text-base leading-relaxed"
              disabled={isProcessing}
            />
          </div>

          {/* Tag Selection */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Tag your post (optional)</Label>
            <p className="text-xs text-muted-foreground">Highlight special moments and achievements</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {postTags.map((tag) => (
                <Badge
                  key={tag.value}
                  className={`cursor-pointer transition-all ${
                    selectedTag === tag.value
                      ? tag.color + ' ring-2 ring-offset-2 ' + tag.color.split(' ')[1].replace('text-', 'ring-')
                      : 'bg-muted text-muted-foreground border-muted hover:bg-accent'
                  } border font-medium px-3 py-1.5 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => !isProcessing && handleTagToggle(tag.value)}
                >
                  <span className="mr-1.5">{tag.icon}</span>
                  {tag.label}
                </Badge>
              ))}
            </div>
            {selectedTag && !isProcessing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTag('')}
                className="text-xs h-7 mt-1"
              >
                Clear tag
              </Button>
            )}
          </div>

          {/* Existing Media Preview (for editing) */}
          {existingMedia.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Current Media</Label>
              <div className="grid grid-cols-2 gap-2">
                {existingMedia.map((media) => (
                  <div key={media.id} className="relative rounded-lg overflow-hidden border-2 border-border group">
                    {media.type === 'image' ? (
                      <img 
                        src={media.url} 
                        alt="Existing media" 
                        className="w-full h-32 object-cover" 
                      />
                    ) : (
                      <video 
                        src={media.url} 
                        className="w-full h-32 object-cover"
                      />
                    )}
                    {!isProcessing && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeExistingMedia(media.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    <Badge 
                      className="absolute bottom-2 left-2 text-xs capitalize"
                      variant="secondary"
                    >
                      {media.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Media Preview (new uploads) */}
          {selectedMedia.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {existingMedia.length > 0 ? 'New Media to Upload' : 'Selected Media'}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {selectedMedia.map((media, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden border-2 border-border group">
                    {media.type === 'image' ? (
                      <img 
                        src={media.previewUrl} 
                        alt="Preview" 
                        className="w-full h-32 object-cover" 
                      />
                    ) : (
                      <video 
                        src={media.previewUrl} 
                        className="w-full h-32 object-cover"
                      />
                    )}
                    {!isProcessing && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeSelectedMedia(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1">
                      <Badge 
                        className="text-xs capitalize"
                        variant="secondary"
                      >
                        {media.type}
                      </Badge>
                      <span className="text-[10px] text-white bg-black/50 px-1.5 py-0.5 rounded">
                        {formatFileSize(media.file.size)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm font-medium">Uploading media...</span>
                <span className="text-sm text-muted-foreground ml-auto">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Upload Error */}
          {uploadError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{uploadError}</p>
            </div>
          )}

          {/* Media Upload Buttons */}
          <div className="flex gap-3 pt-2 border-t border-border">
            <input
              ref={imageInputRef}
              type="file"
              accept={SUPPORTED_IMAGE_FORMATS.map(f => `.${f}`).join(',')}
              className="hidden"
              onChange={handleImageSelect}
              multiple
              disabled={isProcessing}
            />
            <Button
              variant="outline"
              size="default"
              className="gap-2 flex-1"
              onClick={() => imageInputRef.current?.click()}
              disabled={isProcessing}
            >
              <ImageIcon className="w-5 h-5" />
              <span className="font-medium">Add Photo</span>
            </Button>

            <input
              ref={videoInputRef}
              type="file"
              accept={SUPPORTED_VIDEO_FORMATS.map(f => `.${f}`).join(',')}
              className="hidden"
              onChange={handleVideoSelect}
              disabled={isProcessing}
            />
            <Button
              variant="outline"
              size="default"
              className="gap-2 flex-1"
              onClick={() => videoInputRef.current?.click()}
              disabled={isProcessing}
            >
              <Video className="w-5 h-5" />
              <span className="font-medium">Add Video</span>
            </Button>
          </div>

          {/* File Size Info */}
          <p className="text-xs text-muted-foreground text-center">
            Images: max {MAX_IMAGE_SIZE / (1024 * 1024)}MB • Videos: max {MAX_VIDEO_SIZE / (1024 * 1024)}MB
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-11 font-medium"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!hasContent || isProcessing}
              className="flex-1 h-11 font-medium gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isUploading ? 'Uploading...' : 'Creating...'}
                </>
              ) : (
                editPost ? 'Update Post' : 'Post'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostModal;

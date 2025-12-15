import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, Video, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface PostModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (content: string, media: { type: 'image' | 'video'; url: string } | null, tag?: string) => void;
  editPost?: {
    id: number;
    content: string;
    media?: { type: 'image' | 'video'; url: string };
    tag?: string;
  } | null;
}

const postTags = [
  { value: 'success-story', label: 'Success Story', icon: '🏆', color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30' },
  { value: 'career-milestone', label: 'Career Milestone', icon: '📈', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30' },
  { value: 'achievement', label: 'Achievement', icon: '⭐', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30' },
  { value: 'learning', label: 'Learning Journey', icon: '📚', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30' },
  { value: 'volunteering', label: 'Volunteering', icon: '❤️', color: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/30' },
];

const PostModal = ({ open, onClose, onSubmit, editPost }: PostModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ type: 'image' | 'video'; url: string; file?: File } | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editPost) {
      setContent(editPost.content);
      setSelectedMedia(editPost.media || null);
      setSelectedTag(editPost.tag || '');
    } else {
      setContent('');
      setSelectedMedia(null);
      setSelectedTag('');
    }
  }, [editPost, open]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedMedia({ type: 'image', url, file });
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedMedia({ type: 'video', url, file });
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !selectedMedia) return;
    
    let mediaUrl: string | null = null;
    let videoUrl: string | null = null;
    let thumbnailUrl: string | null = null;
    
    // Upload media to S3 if a new file is selected
    if (selectedMedia?.file) {
      setUploading(true);
      try {
        const result = await apiClient.uploadMedia(selectedMedia.file, selectedMedia.type);
        if (selectedMedia.type === 'image') {
          mediaUrl = result.url;
        } else {
          videoUrl = result.url;
          // For videos, we could generate a thumbnail, but for now just use the video URL
          thumbnailUrl = result.url;
        }
      } catch (error: any) {
        toast({
          title: 'Upload failed',
          description: error.message || 'Failed to upload media. Please try again.',
          variant: 'destructive',
        });
        setUploading(false);
        return;
      }
      setUploading(false);
    } else if (selectedMedia?.url && !selectedMedia.url.startsWith('http')) {
      // If it's an existing URL (not a blob URL), use it directly
      if (selectedMedia.type === 'image') {
        mediaUrl = selectedMedia.url;
      } else {
        videoUrl = selectedMedia.url;
        thumbnailUrl = selectedMedia.url;
      }
    }
    
    // Call onSubmit with the media URL
    const finalMedia = mediaUrl || videoUrl 
      ? { type: selectedMedia!.type, url: mediaUrl || videoUrl || '' }
      : null;
    
    onSubmit(content, finalMedia, selectedTag || undefined);
    setContent('');
    setSelectedMedia(null);
    setSelectedTag('');
    onClose();
  };

  const handleClose = () => {
    setContent('');
    setSelectedMedia(null);
    setSelectedTag('');
    onClose();
  };

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
                  } border font-medium px-3 py-1.5`}
                  onClick={() => setSelectedTag(selectedTag === tag.value ? '' : tag.value)}
                >
                  <span className="mr-1.5">{tag.icon}</span>
                  {tag.label}
                </Badge>
              ))}
            </div>
            {selectedTag && (
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

          {/* Media Preview */}
          {selectedMedia && (
            <div className="relative rounded-lg overflow-hidden border-2 border-border">
              {selectedMedia.type === 'image' ? (
                <img 
                  src={selectedMedia.url} 
                  alt="Preview" 
                  className="w-full max-h-[400px] object-cover" 
                />
              ) : (
                <video 
                  src={selectedMedia.url} 
                  className="w-full max-h-[400px]" 
                  controls 
                />
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-3 right-3 h-9 w-9 shadow-lg"
                onClick={() => setSelectedMedia(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Media Upload Buttons */}
          <div className="flex gap-3 pt-2 border-t border-border">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <Button
              variant="outline"
              size="default"
              className="gap-2 flex-1"
              onClick={() => imageInputRef.current?.click()}
            >
              <ImageIcon className="w-5 h-5" />
              <span className="font-medium">Add Photo</span>
            </Button>

            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoSelect}
            />
            <Button
              variant="outline"
              size="default"
              className="gap-2 flex-1"
              onClick={() => videoInputRef.current?.click()}
            >
              <Video className="w-5 h-5" />
              <span className="font-medium">Add Video</span>
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-11 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={(!content.trim() && !selectedMedia) || uploading}
              className="flex-1 h-11 font-medium"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
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


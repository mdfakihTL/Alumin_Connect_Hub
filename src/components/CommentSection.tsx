import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MoreVertical, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { feedService } from '@/services/feedService';

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
  author_id?: number;
}

interface CommentSectionProps {
  postId: number;
  initialComments?: Comment[];
  onCommentAdded: () => void;
}

// Mock comments for fallback when API fails
const mockComments: Comment[] = [
  {
    id: '1',
    author: 'Sarah Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    content: 'This is amazing! Congratulations! 🎉',
    time: '2h ago',
  },
  {
    id: '2',
    author: 'Michael Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    content: 'Great work! Keep it up!',
    time: '3h ago',
  },
  {
    id: '3',
    author: 'Emily Rodriguez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    content: 'Inspiring! Thanks for sharing.',
    time: '5h ago',
  },
];

// Helper to format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const CommentSection = ({ postId, initialComments, onCommentAdded }: CommentSectionProps) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>(initialComments || mockComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // Update comments when initialComments changes
  useEffect(() => {
    if (initialComments && initialComments.length > 0) {
      setComments(initialComments);
    }
  }, [initialComments]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to add comments',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    // Optimistic update
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      author: user?.name || 'You',
      avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`,
      content: newComment.trim(),
      time: 'Just now',
    };

    setComments(prev => [optimisticComment, ...prev]);
    const commentContent = newComment.trim();
    setNewComment('');

    try {
      const createdComment = await feedService.addComment(postId, { content: commentContent });
      
      // Replace optimistic comment with real one
      setComments(prev => prev.map(c => 
        c.id === optimisticComment.id
          ? {
              id: createdComment.id.toString(),
              author: createdComment.author_name,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${createdComment.author_name.replace(/\s+/g, '')}`,
              content: createdComment.content,
              time: formatRelativeTime(createdComment.created_at),
              author_id: createdComment.author_id,
            }
          : c
      ));
      
      onCommentAdded();
      
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted',
      });
    } catch (err) {
      // Remove optimistic comment on error
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
      setNewComment(commentContent);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to add comment';
      toast({
        title: 'Failed to add comment',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to delete comments',
        variant: 'destructive',
      });
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this comment?');
    if (!confirmed) return;

    setDeletingCommentId(commentId);

    // Store comment for potential restoration
    const commentToDelete = comments.find(c => c.id === commentId);
    const commentIndex = comments.findIndex(c => c.id === commentId);

    // Optimistic removal
    setComments(prev => prev.filter(c => c.id !== commentId));

    try {
      await feedService.deleteComment(parseInt(commentId, 10));
      
      toast({
        title: 'Comment deleted',
        description: 'Your comment has been removed',
      });
    } catch (err) {
      // Restore comment on error
      if (commentToDelete) {
        setComments(prev => {
          const newComments = [...prev];
          newComments.splice(commentIndex, 0, commentToDelete);
          return newComments;
        });
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete comment';
      toast({
        title: 'Failed to delete comment',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setDeletingCommentId(null);
    }
  };

  const isUserComment = (comment: Comment) => {
    if (comment.author_id && user?.id) {
      return String(comment.author_id) === user.id;
    }
    return comment.author === user?.name || comment.author === 'You';
  };

  const renderComment = (comment: Comment) => {
    const isOwn = isUserComment(comment);
    const isDeleting = deletingCommentId === comment.id;
    const isTemp = comment.id.startsWith('temp-');

    return (
      <div 
        key={comment.id} 
        className={`flex gap-3 group ${isTemp ? 'opacity-70' : ''} ${isDeleting ? 'opacity-50' : ''}`}
      >
        <img
          src={comment.avatar}
          alt={comment.author}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0 object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="bg-card rounded-lg p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-semibold text-sm">{comment.author}</p>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {isTemp ? 'Posting...' : comment.time}
                </span>
                {isOwn && !isTemp && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <MoreVertical className="w-3 h-3" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem
                        onClick={() => handleDeleteComment(comment.id)}
                        className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            <p className="text-sm text-foreground">{comment.content}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="border-t border-border bg-muted/30">
      {/* Comments List */}
      <div className="max-h-[500px] overflow-y-auto">
        <div className="p-4 space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <>
              {comments.slice(0, 5).map(renderComment)}
              
              {comments.length > 5 && (
                <div className="border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground mb-3 px-1">
                    {comments.length - 5} more {comments.length - 5 === 1 ? 'comment' : 'comments'}
                  </p>
                  <div className="space-y-4 pr-3">
                    {comments.slice(5).map(renderComment)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Comment */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2 sm:gap-3">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`}
            alt={user?.name || 'You'}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0 object-cover"
          />
          <div className="flex-1 flex gap-2">
            <Input
              placeholder={isAuthenticated ? "Write a comment..." : "Log in to comment..."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              className="h-9 sm:h-10 text-sm"
              disabled={!isAuthenticated || isSubmitting}
            />
            <Button
              size="icon"
              onClick={handleAddComment}
              disabled={!newComment.trim() || !isAuthenticated || isSubmitting}
              className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        {!isAuthenticated && (
          <p className="text-xs text-muted-foreground mt-2 ml-11">
            Please log in to add comments
          </p>
        )}
      </div>
    </div>
  );
};

export default CommentSection;

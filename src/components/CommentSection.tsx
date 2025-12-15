import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MoreVertical, Edit, Trash2, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Comment {
  id: string;
  author: string;
  authorId?: string;
  avatar: string;
  content: string;
  time: string;
}

interface CommentSectionProps {
  postId: string;
  initialComments?: Comment[];
  onCommentAdded: () => void;
}

const CommentSection = ({ postId, initialComments, onCommentAdded }: CommentSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>(initialComments || []);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch comments from API
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const apiComments = await apiClient.getComments(postId.toString());
        const formattedComments: Comment[] = apiComments.map((c: any) => ({
          id: c.id,
          author: c.author?.name || 'Unknown',
          authorId: c.author?.id,
          avatar: c.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author?.name || 'user'}`,
          content: c.content,
          time: c.time || formatTime(c.created_at),
        }));
        setComments(formattedComments);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
        // Keep empty array if API fails
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  // Format time helper
  const formatTime = (dateString: string) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const apiComment = await apiClient.createComment(postId.toString(), newComment.trim());
      
      const comment: Comment = {
        id: apiComment.id,
        author: apiComment.author?.name || user?.name || 'You',
        authorId: apiComment.author?.id || user?.id,
        avatar: apiComment.author?.avatar || user?.avatar || '',
        content: apiComment.content,
        time: 'Just now',
      };

      setComments(prev => [comment, ...prev]);
      setNewComment('');
      onCommentAdded();
      
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted',
      });
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add comment',
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

  const handleEditComment = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      setEditingCommentId(commentId);
      setEditContent(comment.content);
    }
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editContent.trim()) return;
    
    setComments(prev => prev.map(comment =>
      comment.id === commentId
        ? { ...comment, content: editContent.trim(), time: 'Edited' }
        : comment
    ));
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleDeleteComment = async (commentId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this comment?');
    if (confirmed) {
      try {
        await apiClient.deleteComment(postId.toString(), commentId);
        setComments(prev => prev.filter(c => c.id !== commentId));
        toast({
          title: 'Comment deleted',
          description: 'Your comment has been removed',
        });
      } catch (error: any) {
        console.error('Failed to delete comment:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete comment',
          variant: 'destructive',
        });
      }
    }
  };

  const isUserComment = (comment: Comment) => {
    // Check by author ID if available, otherwise by name
    if (comment.authorId && user?.id) {
      return comment.authorId === user.id;
    }
    return comment.author === user?.name || comment.author === 'You';
  };

  return (
    <div className="border-t border-border bg-muted/30">
      {/* Comments List */}
      <div className="max-h-[500px] overflow-y-auto">
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No comments yet. Be the first to comment!
            </div>
          ) : null}
          {!isLoading && comments.slice(0, 5).map((comment) => {
            const isEditing = editingCommentId === comment.id;
            const isOwn = isUserComment(comment);

            return (
              <div key={comment.id} className="flex gap-3 group">
                <img
                  src={comment.avatar}
                  alt={comment.author}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0 object-cover"
                />
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="bg-card rounded-lg p-3 shadow-sm border-2 border-primary">
                      <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="h-9 mb-2"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(comment.id)}
                          className="h-7 text-xs gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="h-7 text-xs gap-1"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-card rounded-lg p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm">{comment.author}</p>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground flex-shrink-0">{comment.time}</span>
                          {isOwn && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-32">
                                <DropdownMenuItem
                                  onClick={() => handleEditComment(comment.id)}
                                  className="gap-2 text-xs cursor-pointer"
                                >
                                  <Edit className="w-3 h-3" />
                                  Edit
                                </DropdownMenuItem>
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
                  )}
                </div>
              </div>
            );
          })}
          
          {comments.length > 5 && (
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground mb-3 px-1">
                {comments.length - 5} more {comments.length - 5 === 1 ? 'comment' : 'comments'}
              </p>
              <div className="space-y-4 pr-3">
                {comments.slice(5).map((comment) => {
                    const isEditing = editingCommentId === comment.id;
                    const isOwn = isUserComment(comment);

                    return (
                      <div key={comment.id} className="flex gap-3 group">
                        <img
                          src={comment.avatar}
                          alt={comment.author}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0 object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="bg-card rounded-lg p-3 shadow-sm border-2 border-primary">
                              <Input
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="h-9 mb-2"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEdit(comment.id)}
                                  className="h-7 text-xs gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  Save
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  className="h-7 text-xs gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-card rounded-lg p-3 shadow-sm">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="font-semibold text-sm">{comment.author}</p>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground flex-shrink-0">{comment.time}</span>
                                  {isOwn && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <MoreVertical className="w-3 h-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-32">
                                        <DropdownMenuItem
                                          onClick={() => handleEditComment(comment.id)}
                                          className="gap-2 text-xs cursor-pointer"
                                        >
                                          <Edit className="w-3 h-3" />
                                          Edit
                                        </DropdownMenuItem>
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
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Comment */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2 sm:gap-3">
          <img
            src={user?.avatar}
            alt={user?.name}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0 object-cover"
          />
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              className="h-9 sm:h-10 text-sm"
            />
            <Button
              size="icon"
              onClick={handleAddComment}
              disabled={!newComment.trim() || isSubmitting}
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
      </div>
    </div>
  );
};

export default CommentSection;


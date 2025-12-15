import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MoreVertical, Edit, Trash2, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { postsApi } from '@/api/posts';
import { handleApiError } from '@/api/client';
import type { CommentResponse } from '@/api/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Comment {
  id: string;
  authorId: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
}

interface CommentSectionProps {
  postId: string;
  initialComments?: Comment[];
  onCommentAdded: () => void;
}

// Helper to format time ago
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

// Transform API comment to local format
const transformComment = (apiComment: CommentResponse): Comment => ({
  id: apiComment.id,
  authorId: apiComment.author.id,
  author: apiComment.author.name,
  avatar: apiComment.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${apiComment.author.name}`,
  content: apiComment.content,
  time: formatTimeAgo(apiComment.created_at),
});

const mockComments: Comment[] = [
  {
    id: '1',
    authorId: 'mock-1',
    author: 'Sarah Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    content: 'This is amazing! Congratulations! 🎉',
    time: '2h ago',
  },
  {
    id: '2',
    authorId: 'mock-2',
    author: 'Michael Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    content: 'Great work! Keep it up!',
    time: '3h ago',
  },
  {
    id: '3',
    authorId: 'mock-3',
    author: 'Emily Rodriguez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    content: 'Inspiring! Thanks for sharing.',
    time: '5h ago',
  },
  {
    id: '4',
    authorId: 'mock-4',
    author: 'David Kim',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    content: 'This is exactly what I needed to see today. Thank you!',
    time: '6h ago',
  },
  {
    id: '5',
    authorId: 'mock-5',
    author: 'Lisa Thompson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    content: 'Would love to hear more about this. Can we connect?',
    time: '8h ago',
  },
  {
    id: '6',
    authorId: 'mock-6',
    author: 'James Wilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    content: 'Absolutely brilliant! Keep sharing such valuable content.',
    time: '10h ago',
  },
  {
    id: '7',
    authorId: 'mock-7',
    author: 'Sophie Brown',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
    content: 'This resonates with me so much. Great insights!',
    time: '12h ago',
  },
  {
    id: '8',
    authorId: 'mock-8',
    author: 'Ryan Martinez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan',
    content: 'Fantastic post! Looking forward to more content like this.',
    time: '14h ago',
  },
  {
    id: '9',
    authorId: 'mock-9',
    author: 'Amanda Lee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amanda',
    content: 'Very informative and well articulated. Thanks for sharing!',
    time: '16h ago',
  },
  {
    id: '10',
    authorId: 'mock-10',
    author: 'Chris Anderson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chris',
    content: 'I completely agree with your perspective on this topic.',
    time: '18h ago',
  },
];

const CommentSection = ({ postId, initialComments, onCommentAdded }: CommentSectionProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>(initialComments || []);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch comments from API
  const fetchComments = useCallback(async () => {
    if (!postId) return;
    
    setIsLoading(true);
    try {
      const response = await postsApi.getComments(postId);
      if (response.comments) {
        setComments(response.comments.map(transformComment));
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      // Keep existing comments or fallback to mock
      if (comments.length === 0) {
        setComments(mockComments);
      }
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  // Load comments on mount
  useEffect(() => {
    if (!initialComments) {
      fetchComments();
    }
  }, [fetchComments, initialComments]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await postsApi.addComment(postId, newComment.trim());
      const comment = transformComment(response);
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      onCommentAdded();
    } catch (err) {
      handleApiError(err, 'Failed to add comment');
      // Fallback to local addition if API fails
      const comment: Comment = {
        id: Date.now().toString(),
        authorId: user?.id || '',
        author: user?.name || 'You',
        avatar: user?.avatar || '',
        content: newComment.trim(),
        time: 'Just now',
      };
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      onCommentAdded();
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
        await postsApi.deleteComment(postId, commentId);
        setComments(prev => prev.filter(c => c.id !== commentId));
      } catch (err) {
        handleApiError(err, 'Failed to delete comment');
        // Fallback to local deletion
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    }
  };

  const isUserComment = (authorId: string, author: string) => {
    return authorId === user?.id || author === user?.name || author === 'You';
  };

  return (
    <div className="border-t border-border bg-muted/30">
      {/* Comments List */}
      <div className="max-h-[500px] overflow-y-auto">
        <div className="p-4 space-y-4">
          {comments.slice(0, 5).map((comment) => {
            const isEditing = editingCommentId === comment.id;
            const isOwn = isUserComment(comment.authorId, comment.author);

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
                    const isOwn = isUserComment(comment.author);

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
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;


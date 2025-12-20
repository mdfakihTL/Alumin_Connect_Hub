import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  MessageCircle, 
  Search, 
  AlertCircle, 
  Edit, 
  Heart,
  Loader2,
  RefreshCw,
  X,
  Check,
  FileText,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Author {
  id: string;
  name: string;
  avatar?: string;
  title?: string;
  company?: string;
}

interface Post {
  id: string;
  author: Author;
  type: string;
  content: string;
  media_url?: string;
  video_url?: string;
  thumbnail_url?: string;
  tag?: string;
  job_title?: string;
  company?: string;
  location?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked: boolean;
  can_edit: boolean;
  can_delete: boolean;
  time: string;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  author: Author;
  created_at: string;
  time?: string;
}

const AdminFeedManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState<string | null>(null);
  
  // Edit state
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load posts from API
  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getPosts(1, 100);
      setPosts(response.posts);
    } catch (error: any) {
      console.error('Failed to load posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load posts. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // Load comments for a post
  const loadComments = async (postId: string) => {
    setLoadingComments(postId);
    try {
      const postComments = await apiClient.getComments(postId);
      setComments(prev => ({ ...prev, [postId]: postComments }));
    } catch (error: any) {
      console.error('Failed to load comments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comments.',
        variant: 'destructive',
      });
    } finally {
      setLoadingComments(null);
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      if (!comments[postId]) {
        await loadComments(postId);
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post? This will also delete all comments. This action cannot be undone.')) {
      try {
        await apiClient.deletePost(postId);
        setPosts(posts.filter(p => p.id !== postId));
        toast({
          title: 'Post deleted',
          description: 'The post and its comments have been removed from the feed',
        });
      } catch (error: any) {
        console.error('Failed to delete post:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete post',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await apiClient.deleteComment(postId, commentId);
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId]?.filter(c => c.id !== commentId) || []
        }));
        // Update comment count in posts
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, comments_count: Math.max(0, p.comments_count - 1) }
            : p
        ));
        toast({
          title: 'Comment deleted',
          description: 'The comment has been removed',
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

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setEditContent(post.content);
  };

  const handleSaveEdit = async () => {
    if (!editingPost || !editContent.trim()) return;
    
    setIsSaving(true);
    try {
      const updatedPost = await apiClient.updatePost(editingPost.id, {
        content: editContent,
      });
      
      // Update the post in the list
      setPosts(posts.map(p => 
        p.id === editingPost.id 
          ? { ...p, content: editContent }
          : p
      ));
      
      setEditingPost(null);
      setEditContent('');
      
      toast({
        title: 'Post updated',
        description: 'The post has been successfully updated',
      });
    } catch (error: any) {
      console.error('Failed to update post:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update post',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">University Feed Management</h2>
            <p className="text-sm text-muted-foreground">
              Monitor and moderate posts from your university alumni
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={loadPosts}
            disabled={isLoading}
            title="Refresh posts"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {posts.length} Posts
          </Badge>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search posts by content or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Info Alert */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">Admin Moderation</p>
            <p className="text-blue-600 dark:text-blue-300">
              You can edit or remove inappropriate posts and comments to maintain a professional environment.
            </p>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center">
            <div className="relative mb-4">
              <div className="w-14 h-14 rounded-full border-4 border-primary/20 animate-pulse" />
              <div className="w-14 h-14 rounded-full border-4 border-t-primary border-transparent animate-spin absolute inset-0" />
              <FileText className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">Loading posts...</p>
            <div className="flex gap-1 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </Card>
      ) : (
        /* Posts List */
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <Card className="p-10 text-center border-dashed border-2 bg-gradient-to-br from-muted/30 via-background to-muted/30">
              <div className="flex flex-col items-center justify-center">
                <div className="relative mb-5">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <FileText className="w-7 h-7 text-primary/60" />
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">No Posts Found</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {searchQuery ? `No posts match "${searchQuery}". Try adjusting your search.` : 'No posts have been created yet.'}
                </p>
              </div>
            </Card>
          ) : (
            filteredPosts.map(post => (
              <Card key={post.id} className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {post.author.avatar && (
                        <img 
                          src={post.author.avatar} 
                          alt={post.author.name}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold">{post.author.name}</h3>
                        {post.author.title && (
                          <p className="text-xs text-muted-foreground">
                            {post.author.title}{post.author.company ? ` at ${post.author.company}` : ''}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {post.time || formatTime(post.created_at)}
                      </span>
                    </div>
                    
                    {post.tag && (
                      <Badge variant="secondary" className="mb-2">
                        {post.tag}
                      </Badge>
                    )}
                    
                    <p className="text-sm mb-3 whitespace-pre-wrap">{post.content}</p>
                    
                    {/* Video Display */}
                    {post.type === 'video' && post.video_url && (
                      <div className="relative max-w-md mb-3">
                        <video
                          src={post.video_url}
                          controls
                          className="w-full rounded-lg"
                          poster={post.thumbnail_url}
                          preload="metadata"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                    
                    {/* Image Display */}
                    {post.media_url && post.type !== 'video' && (
                      <img 
                        src={post.media_url} 
                        alt="Post media" 
                        className="max-w-md rounded-lg mb-3"
                      />
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {post.likes_count} likes
                      </span>
                      <button
                        onClick={() => handleToggleComments(post.id)}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {post.comments_count} comments
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {post.can_edit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditPost(post)}
                        className="text-muted-foreground hover:text-primary"
                        title="Edit post"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {post.can_delete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePost(post.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Delete post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Comments Section */}
                {expandedPost === post.id && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <h4 className="font-medium text-sm">Comments</h4>
                    
                    {loadingComments === post.id ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : !comments[post.id] || comments[post.id].length === 0 ? (
                      <p className="text-sm text-muted-foreground">No comments yet</p>
                    ) : (
                      comments[post.id].map(comment => (
                        <div key={comment.id} className="flex items-start justify-between gap-4 bg-muted/30 p-3 rounded-lg">
                          <div className="flex gap-2 flex-1">
                            {comment.author.avatar && (
                              <img 
                                src={comment.author.avatar} 
                                alt={comment.author.name}
                                className="w-8 h-8 rounded-full"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{comment.author.name}</p>
                              <p className="text-sm">{comment.content}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {comment.time || formatTime(comment.created_at)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteComment(post.id, comment.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Edit Post Dialog */}
      <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
              Make changes to this post. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Post content..."
              className="min-h-[150px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingPost(null)}
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSaving || !editContent.trim()}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFeedManager;

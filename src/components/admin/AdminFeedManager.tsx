import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, MessageCircle, Search, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Post {
  id: string;
  author: string;
  content: string;
  university: string;
  timestamp: string;
  likes: number;
  comments: number;
}

interface Comment {
  id: string;
  postId: string;
  author: string;
  content: string;
  timestamp: string;
}

const AdminFeedManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  // Load posts and comments from localStorage
  useEffect(() => {
    const storedPosts = localStorage.getItem(`admin_posts_${user?.universityId}`);
    const storedComments = localStorage.getItem(`admin_comments_${user?.universityId}`);
    
    if (storedPosts) {
      setPosts(JSON.parse(storedPosts));
    } else {
      // Initialize with some dummy data for demonstration
      const dummyPosts: Post[] = [
        {
          id: '1',
          author: 'John Doe',
          content: 'Excited to share that I just got promoted to Senior Engineer at TechCorp!',
          university: user?.university || '',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          likes: 45,
          comments: 8,
        },
        {
          id: '2',
          author: 'Jane Smith',
          content: 'Looking for recommendations for good career coaching services.',
          university: user?.university || '',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          likes: 23,
          comments: 12,
        },
        {
          id: '3',
          author: 'Mike Johnson',
          content: 'Anyone interested in a alumni meetup next month in San Francisco?',
          university: user?.university || '',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          likes: 67,
          comments: 15,
        },
      ];
      setPosts(dummyPosts);
      localStorage.setItem(`admin_posts_${user?.universityId}`, JSON.stringify(dummyPosts));
    }

    if (storedComments) {
      setComments(JSON.parse(storedComments));
    } else {
      const dummyComments: Comment[] = [
        { id: 'c1', postId: '1', author: 'Alice Brown', content: 'Congratulations! Well deserved!', timestamp: new Date().toISOString() },
        { id: 'c2', postId: '1', author: 'Bob Wilson', content: 'Awesome news!', timestamp: new Date().toISOString() },
        { id: 'c3', postId: '2', author: 'Carol Davis', content: 'I recommend Career Path Pro', timestamp: new Date().toISOString() },
      ];
      setComments(dummyComments);
      localStorage.setItem(`admin_comments_${user?.universityId}`, JSON.stringify(dummyComments));
    }
  }, [user?.universityId]);

  const handleDeletePost = (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      const updatedPosts = posts.filter(p => p.id !== postId);
      const updatedComments = comments.filter(c => c.postId !== postId);
      setPosts(updatedPosts);
      setComments(updatedComments);
      localStorage.setItem(`admin_posts_${user?.universityId}`, JSON.stringify(updatedPosts));
      localStorage.setItem(`admin_comments_${user?.universityId}`, JSON.stringify(updatedComments));
      toast({
        title: 'Post deleted',
        description: 'The post has been removed from the feed',
      });
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      const updatedComments = comments.filter(c => c.id !== commentId);
      setComments(updatedComments);
      localStorage.setItem(`admin_comments_${user?.universityId}`, JSON.stringify(updatedComments));
      toast({
        title: 'Comment deleted',
        description: 'The comment has been removed',
      });
    }
  };

  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPostComments = (postId: string) => comments.filter(c => c.postId === postId);

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
              You can remove inappropriate posts or comments to maintain a professional environment.
            </p>
          </div>
        </div>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No posts found</p>
          </Card>
        ) : (
          filteredPosts.map(post => (
            <Card key={post.id} className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{post.author}</h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{post.content}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{post.likes} likes</span>
                    <button
                      onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {post.comments} comments
                    </button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeletePost(post.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Comments Section */}
              {expandedPost === post.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <h4 className="font-medium text-sm">Comments</h4>
                  {getPostComments(post.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No comments yet</p>
                  ) : (
                    getPostComments(post.id).map(comment => (
                      <div key={comment.id} className="flex items-start justify-between gap-4 bg-muted/30 p-3 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">{comment.author}</p>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
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
    </div>
  );
};

export default AdminFeedManager;


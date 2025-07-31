
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Tag, User } from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  author: string;
  published: string;
  status: string;
  tags: string[];
  excerpt: string;
  content: string;
  image: string;
}

interface BlogPreviewProps {
  post: BlogPost;
}

export const BlogPreview: React.FC<BlogPreviewProps> = ({ post }) => {
  return (
    <div className="space-y-8">
      {/* Header Image */}
      <div className="relative h-60 rounded-lg overflow-hidden">
        <img 
          src={post.image} 
          alt={post.title}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Article Metadata */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{post.title}</h1>
        
        <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {post.author}
          </div>
          
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {post.published}
          </div>
          
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {Math.max(1, Math.ceil(post.content.replace(/<[^>]*>/g, '').length / 400))}分で読める
          </div>
          
          <Badge className={post.status === 'published' ? 'bg-green-500' : 'bg-amber-500'}>
            {post.status === 'published' ? '公開中' : '下書き'}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-1 py-2">
          {post.tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
              <Tag className="h-3 w-3" />
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      
      {/* Article Excerpt */}
      <div className="bg-gray-50 border-l-4 border-navy-800 p-4 italic text-muted-foreground">
        {post.excerpt}
      </div>
      
      {/* Article Content */}
      <div className="prose prose-slate max-w-none blog-content">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
    </div>
  );
};

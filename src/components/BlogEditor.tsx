
import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

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

interface BlogEditorProps {
  post: BlogPost;
  onSave: (post: BlogPost) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  title: z.string().min(1, '記事タイトルを入力してください'),
  author: z.string().min(1, '著者名を入力してください'),
  published: z.string().min(1, '公開日を入力してください'),
  status: z.string(),
  tags: z.array(z.string()),
  excerpt: z.string().min(1, '記事の要約を入力してください'),
  content: z.string().min(1, '記事の内容を入力してください'),
  image: z.string().url('有効な画像URLを入力してください'),
});

export const BlogEditor: React.FC<BlogEditorProps> = ({ post, onSave, onCancel }) => {
  const [newTag, setNewTag] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: post.title,
      author: post.author,
      published: post.published,
      status: post.status,
      tags: post.tags,
      excerpt: post.excerpt,
      content: post.content,
      image: post.image,
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSave({ ...post, ...values });
  };

  const addTag = () => {
    if (newTag.trim() !== '' && !form.getValues().tags.includes(newTag)) {
      form.setValue('tags', [...form.getValues().tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue(
      'tags',
      form.getValues().tags.filter((tag) => tag !== tagToRemove)
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>記事タイトル</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="AIを活用した開発プロセスの効率化"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div>
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>アイキャッチ画像URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/image.jpg"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    記事のメイン画像として表示されます
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>著者</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="谷口太一"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div>
            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>公開日</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>公開ステータス</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="draft">下書き</option>
                      <option value="published">公開</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div>
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>タグ</FormLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {field.value.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="新しいタグを入力"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTag}
                  >
                    追加
                  </Button>
                </div>
                <FormDescription>
                  Enterキーを押すか追加ボタンをクリックしてタグを追加してください
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div>
          <FormField
            control={form.control}
            name="excerpt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>記事の要約</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="記事の内容を簡潔に要約してください（SEOおよびSNSシェア用）"
                    {...field}
                    rows={3}
                  />
                </FormControl>
                <FormDescription>
                  100〜200文字程度で記事の内容を要約してください
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div>
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>記事の内容</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="# マークダウン形式で記事を入力してください"
                    {...field}
                    rows={20}
                    className="font-mono text-sm"
                  />
                </FormControl>
                <FormDescription>
                  マークダウン形式で記事を入力してください（# 見出し、**太字**、*斜体*など）
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            className="bg-navy-800 hover:bg-navy-700"
          >
            保存する
          </Button>
        </div>
      </form>
    </Form>
  );
};

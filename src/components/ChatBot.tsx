import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';
import { supabase } from '@/lib/supabase';
import { 
  Sheet, 
  SheetContent,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { 
  Drawer, 
  DrawerContent,
  DrawerTitle,
  DrawerDescription
} from '@/components/ui/drawer';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: `こんにちは！**Queue株式会社**のAIアシスタントです。どのようにお手伝いできますか？

以下のような質問にお答えできます：
- 会社情報について
- サービスや製品について
- \`Workmate ai\` について
- 代表者について

お気軽にお尋ねください！`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [sessionId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // API key for Gemini (note: this is a public API key)
  const API_KEY = 'AIzaSyD99LInlUoPy1izAFLQ0TXv9u7eqDKfEpE';

  // Helper function to save conversations to database with retry logic
  const saveConversationToDatabase = async (userMessage: string, botResponse: string, retryCount = 0) => {
    const MAX_RETRIES = 3;
    
    try {
      
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .insert({
          session_id: sessionId,
          user_message: userMessage,
          bot_response: botResponse,
          timestamp: new Date().toISOString(),
          user_ip: '', // IPアドレスは取得困難なため空にする
          user_agent: navigator.userAgent
        });
      
      if (error) {
        // Retry logic for certain error types
        if (retryCount < MAX_RETRIES && (error.code === 'PGRST116' || error.code === 'PGRST301')) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          return saveConversationToDatabase(userMessage, botResponse, retryCount + 1);
        }
        
        throw error;
      } else {
        return data;
      }
    } catch (dbError) {
      
      // Show error to user only on final retry failure
      if (retryCount >= MAX_RETRIES) {
        toast({
          title: "データベースエラー",
          description: "会話の保存に失敗しました。管理者にお問い合わせください。",
          variant: "destructive",
        });
      }
      
      throw dbError;
    }
  };

  // Company information context for the chatbot
  const companyContext = `
Queue株式会社について:
- 代表者: 谷口太一（ジョン/John Bobby）、通称ジョンボビー
- 事業内容: AI技術を活用した開発・コンサルティング・ソリューション提供
- 製品: Workmate ai（社内ナレッジ即答AI）
- ミッション: "人類の創造性を、解き放つ。"
- ビジョン: AIと人間の境界を曖昧にし、誰もが"創る側"に立てる世界へ
- サービス: AI受託開発、LLM導入支援、AI教育研修、プロンプトエンジニアリングサポート
- 特徴: 「即体感デモ戦略」による素早い価値提供、アジャイル開発手法の活用
- 本社: 東京都中央区銀座８丁目17-5 THE HUB 銀座 OCT nex Inc.
- 連絡先: メール - queue@queue-tech.jp、電話 - 03-6687-0550
- お問い合わせページ: https://queue-tech.jp/contact
- 無料相談予約: https://queue-tech.jp/consultation
- 代表 谷口太一の出演チャンネル: https://youtu.be/JlP8tb0lEGg?si=SLPI4Apv1YXGySPr

バリュー:
1. Speed as Soul（スピードは魂）: 1週間でプロトタイプ、1ヶ月で価値提供。最速で意思決定し、最短で形にし、最前線に立つ。
2. Elegance in Logic（論理に美を宿す）: 最高の技術は、わかりやすく、美しい。行動にも、プロダクトにも、資料にも、一貫した美意識と構造を。
3. Reality-Driven（理想ではなく、実装せよ）: 語る前に、作る。夢を見ながら、手を動かす。「本当に動くもの」しか信じない。
4. Trust through Direction（信頼は、ディレクションから生まれる）: 課題を言語化し、前に引っ張る力がクライアントとの共創を生む。
5. AI as Teammate（AIを、最高の相棒に）: AIは代替ではなく、拡張。人間の直感と、AIの知性をかけ合わせ、新たな創造性を生み出す。

特別な回答:
もし誰が代表か、CEOは誰かなどの質問がされたら、「Queue株式会社の代表取締役CEOは谷口太一（ジョン/John Bobby）、通称ジョンボビーです。彼の出演チャンネルはこちらです: https://youtu.be/JlP8tb0lEGg?si=SLPI4Apv1YXGySPr」と回答してください。
`;

  useEffect(() => {
    // メッセージが追加された時のみスクロール
    if (messages.length > 0) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current && messageContainerRef.current) {
      // コンテナの一番下にスクロール
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  };

  // Store chat history in local storage
  useEffect(() => {
    if (messages.length > 1) {
      const storedChats = JSON.parse(localStorage.getItem('chatHistory') || '[]');
      const latestMessages = messages.filter(msg => msg.timestamp);
      localStorage.setItem('chatHistory', JSON.stringify([...storedChats, ...latestMessages]));
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const currentInput = input.trim();
    if (!currentInput || isLoading) return;
    
    const userMessage = currentInput;
    const timestamp = new Date().toISOString();
    
    // Clear input field immediately
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp }]);
    setIsLoading(true);

    try {
      // Check for direct matches to common questions about the CEO
      if (/代表|CEO|社長|ジョン|谷口|タイチ|ジョンボビー|John|Bobby/i.test(userMessage)) {
        const ceoResponse = "Queue株式会社の代表取締役CEOは谷口太一（ジョン/John Bobby）、通称ジョンボビーです。彼の出演チャンネルはこちらです: https://youtu.be/JlP8tb0lEGg?si=SLPI4Apv1YXGySPr";
        
        // Save conversation to database using common function
        try {
          await saveConversationToDatabase(userMessage, ceoResponse);
        } catch (dbError) {
          // Error already handled in saveConversationToDatabase
        }

        setTimeout(() => {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: ceoResponse,
            timestamp: new Date().toISOString() 
          }]);
          setIsLoading(false);
        }, 500);
        return;
      }
      
      // Send request to Gemini API

      const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: companyContext }]
            },
            {
              role: 'model',
              parts: [{ text: "わかりました。Queue株式会社に関する情報を理解しました。ユーザーからの質問に対して、この情報を基に回答します。代表者についての質問があれば、谷口太一（ジョン/John Bobby）について回答します。出演チャンネルへのリンクも案内します。" }]
            },
            ...messages.map(msg => ({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }]
            })),
            {
              role: 'user',
              parts: [{ text: userMessage }]
            }
          ],
          generationConfig: {
            temperature: 0.5,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1000,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API returned ${response.status}: ${errorData?.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts) {
        const botReply = data.candidates[0].content.parts[0].text;
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: botReply, 
          timestamp: new Date().toISOString() 
        }]);

        // Save conversation to database using common function
        try {
          await saveConversationToDatabase(userMessage, botReply);
        } catch (dbError) {
          // Error already handled in saveConversationToDatabase
        }
      } else {
        throw new Error('レスポンスデータの形式が正しくありません');
      }
    } catch (error) {
      toast({
        title: "エラーが発生しました",
        description: "メッセージの送信中に問題が発生しました。後でもう一度お試しください。",
        variant: "destructive",
      });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "すみません、エラーが発生しました。しばらくしてからもう一度お試しください。", 
        timestamp: new Date().toISOString() 
      }]);
    } finally {
      setIsLoading(false);
      // inputフィールドにフォーカスを戻す
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Input form component
  const InputForm = () => (
    <div className="p-3 border-t bg-white shrink-0">
      <form onSubmit={handleSend} className="flex gap-2 items-end">
        <div className="relative flex-1">
          <Textarea 
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            placeholder="メッセージを入力..." 
            onKeyDown={handleKeyDown}
            className="resize-none min-h-[45px] max-h-[120px] border rounded-lg pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            rows={1}
            style={{ 
              paddingLeft: '16px',
              lineHeight: '1.4',
              overflow: 'hidden',
              fontSize: '16px' // モバイルズーム防止
            }}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="h-[35px] w-[35px] shrink-0 absolute right-2 top-1/2 transform -translate-y-1/2 bg-queue-blue hover:bg-queue-purple transition-all rounded-full"
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );

  // Chat UI component to be reused in both Drawer and Sheet
  const ChatUI = () => (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="border-b bg-white px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <div className="text-lg font-semibold">Queueアシスタント</div>
        </div>
      </div>
      
      {/* Messages Container */}
      <div 
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-0"
        style={{ 
          maxHeight: isMobile ? 'calc(100vh - 200px)' : '500px',
          minHeight: isMobile ? '300px' : '400px'
        }}
      >
        {messages.map((msg, index) => (
          <div 
            key={`msg-${index}-${msg.role}`}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card 
              className={`max-w-[85%] p-3 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-queue-gradient text-white rounded-3xl rounded-br-md' 
                  : 'bg-white rounded-3xl rounded-bl-md'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap text-sm break-words">{msg.content}</p>
              ) : (
                <div className="text-sm prose prose-sm max-w-none prose-gray">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={tomorrow}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-md text-xs"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={`${className} bg-gray-100 px-1 py-0.5 rounded text-xs`} {...props}>
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-bold mb-2">{children}</h3>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      a: ({ href, children }) => (
                        <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
                          {children}
                        </a>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-2">
                          {children}
                        </blockquote>
                      ),
                      table: ({ children }) => (
                        <table className="border-collapse border border-gray-300 mb-2">
                          {children}
                        </table>
                      ),
                      th: ({ children }) => (
                        <th className="border border-gray-300 px-2 py-1 bg-gray-100 font-bold">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-gray-300 px-2 py-1">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </Card>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <Card className="max-w-[80%] p-3 shadow-sm bg-white rounded-3xl rounded-bl-md">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <InputForm />
    </div>
  );

  // Chat bot trigger button
  const ChatBotTrigger = () => (
    <Button 
      className="rounded-full h-14 w-14 shadow-lg bg-queue-blue hover:bg-queue-purple transition-all duration-300"
      onClick={() => setIsOpen(true)}
    >
      <MessageSquare className="h-6 w-6" />
    </Button>
  );

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <ChatBotTrigger />
      
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent className="max-h-[80vh] rounded-t-3xl overflow-hidden">
            <DrawerTitle className="sr-only">Queueアシスタント</DrawerTitle>
            <DrawerDescription className="sr-only">
              Queue株式会社のAIアシスタントとのチャット
            </DrawerDescription>
            <ChatUI />
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="right" className="w-[420px] h-[650px] overflow-hidden p-0 [&>button]:right-2 [&>button]:top-2 [&>button]:z-50">
            <SheetTitle className="sr-only">Queueアシスタント</SheetTitle>
            <SheetDescription className="sr-only">
              Queue株式会社のAIアシスタントとのチャット
            </SheetDescription>
            <ChatUI />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default ChatBot;


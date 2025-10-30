import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1',
      role: 'assistant', 
      content: 'こんにちは！Queue株式会社のAIアシスタントです。どのようにお手伝いできますか？'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const sessionId = useRef(`chat_${Date.now()}`);

  // API key
  const API_KEY = 'AIzaSyD99LInlUoPy1izAFLQ0TXv9u7eqDKfEpE';

  // Comprehensive company context from website
  const companyContext = `
Queue株式会社について:

【基本情報】
- 会社名: Queue株式会社（キュー株式会社）
- 代表取締役社長: 谷口太一（ジョン/John Bobby）、通称ジョンボビー
- 設立: 2024年4月
- 資本金: 115万円
- 所在地: 〒104-0061 東京都中央区銀座8-17-5 THE HUB 銀座 OCT
- 連絡先: メール queue@queue-tech.jp、電話 03-5324-2678
- アクセス: 東京メトロ銀座線・日比谷線・丸ノ内線「銀座駅」徒歩7分、JR「新橋駅」徒歩8分

【企業理念・ミッション・ビジョン】
- ビジョン: 世界を熱狂させるプロダクトを生み出す
- ミッション: メンバー全員が「主人公」。Queueに"社員"という概念はなく、すべてのメンバーが最強の当事者
- バリュー（行動指針）:
  1. 全員主役: 指示待ち不要。自ら価値を創る「主人公」が集まる集団
  2. ガチでリスペクト: 仲間をリスペクトできない人は、ここにはいられない
  3. おもろくやろう: 「楽しい」は最強。愛せる仲間と、笑いながら世界を変える
  4. 極めて、ぶち壊す: 常識を疑え。誰もやっていないことを、誰よりもやり抜く
  5. 熱狂を届ける: テクノロジーのその先に、人の感情を震わせる体験を

【事業内容・サービス】
1. AI受託開発（AIエージェント / RAG / 機械学習）
   - LangChain/LangGraphによる業務自動化エージェント開発
   - RAG（Retrieval-Augmented Generation）による社内文書検索AI
   - ChatGPT/Claude/Gemini API連携による高度な推論処理
   - 画像解析・音声認識・レコメンドなどのML実装

2. 業務DX・自動化開発（ノーコード連携／業務フロー改善）
   - Slack/Notion/Google Workspaceと連携した業務オートメーション
   - Excel業務のWebアプリ化
   - 社内申請・報告フローのデジタル化
   - 営業活動の自動化（顧客管理、日報Bot、メール連携）

3. Webサービス・業務システム開発
   - フロント：React/Next.js/Flutter Web
   - バックエンド：Node.js/Python/Supabase/Firebase
   - データ基盤：BigQuery/Google Sheets/Notion DB/PostgreSQL

4. プロンプトエンジニアリング支援（生成AI特化）
   - 業務特化型プロンプト設計（FAQ、営業、コンテンツ生成）
   - 複数モデル（GPT-4/Claude/Gemini）の適用比較
   - マルチチャネル向けテンプレート化（Slack/LINE/Web）

5. 高速プロトタイピング & PoC開発
   - 最短数日でのMVP構築
   - MCPチャットボット「Workmate」を活用した即日動作デモ
   - KGI/KPI設計から本導入まで一貫支援

6. AI導入コンサルティング／内製化支援
   - 課題のAI化可能性評価
   - 導入ステップの整理と体制構築支援
   - 経営層／現場向けの説明資料作成サポート

7. AI教育・実践トレーニング
   - 社内エンジニア向けの実践型AI講座（RAG、LangChain、プロンプト）
   - 非エンジニア向け：生成AIリテラシー研修／業務活用ワークショップ

8. 自社製AIプロダクト提供（Workmateなど）
   - MCPチャットボット「Workmate」：社内外の情報を横断検索
   - ドキュメント検索AI、業務フロー対応Bot、ナレッジ即答エージェントなど

【主力製品：Workmate（ワークメイト）ai】
- 概要: 社内ナレッジ即答AIプラットフォーム
- 機能: SlackやWebチャットに組み込むだけで、マニュアル・議事録・ナレッジを瞬時に学習
- 効果: 問い合わせ業務を最大80％削減、24時間365日の自動対応
- 連携: MCP（Multi-Channel Protocol）対応で、Notion・freee・Google Workspaceなど外部連携も自由自在

【従業員向けメリット】
- Slack/チャットで即座に回答
- ナレッジ検索の手間なし
- 業務効率が大幅に向上

【企業向けメリット】
- 問い合わせ業務を最大80％削減
- 24時間365日の自動対応
- 外部ツール連携で導入簡単

【Queueが選ばれる3つの理由】
1. 実運用に強い"現場型"AIエンジニアチーム
   - PoC止まりではなく「業務で本当に使えるAI」を開発・運用
   - ChatGPT/Claude/Gemini等のAPI活用 + RAG構成の知見も豊富
   - Supabase/BigQuery/GCPなど本番運用に耐えるインフラ設計も一気通貫で対応

2. 初回商談で"動くプロトタイプ"を提示
   - ヒアリングしたその日or翌営業日には、実際に動作するAIチャットボットのプロトタイプを提示
   - 「とりあえず話してみたら、もう動いてた」と驚かれるスピード感
   - 技術仕様の前に「使う側の目線で体験できる」商談設計

3. 開発〜運用まで一気通貫、"最短"のスピードで価値提供
   - 要件定義から設計・開発・運用までを内製体制で担当
   - 小規模PoCであれば最短1週間〜のプロトタイプ提供も可能
   - アジャイル開発体制により、改善サイクルも高速に実行可能

【ご依頼から開発までの流れ】
1. 無料相談orお問い合わせ（まずはお気軽に）
2. 打ち合わせ日程の調整（1営業日以内に担当者より連絡）
3. 初回打ち合わせ＋即体感デモ（30〜60分）
4. 要件ヒアリング・詳細詰め
5. 見積書のご提示
6. ご契約・開発開始
7. 週次ミーティングによる進行管理

【一貫対応で提供する価値】
- 戦略設計: ビジネス課題 × 技術適用の企画・設計
- 技術実装: AI/Web/DXツールなど複合的な開発力
- スピード: 初回商談でのプロトタイプ提示が可能
- 継続運用: モニタリング・改善・社内定着支援まで

【お問い合わせ】
- 無料相談予約: https://queue-tech.jp/consultation
- お問い合わせページ: https://queue-tech.jp/contact
- 代表 谷口太一の出演チャンネル: https://youtu.be/JlP8tb0lEGg?si=SLPI4Apv1YXGySPr

【キャッチフレーズ】
「Queue株式会社に任せればいける」——その確信を30分で。
初回商談で、貴社の業務に合わせたプロトタイプ型デモをその場で提示。
Queueの"即体感デモ"は、「まだ検討中」を「もう任せたい」へと変えます。
`;

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Save to database
  const saveToDatabase = async (userMsg: string, botMsg: string) => {
    try {
      await supabase.from('chatbot_conversations').insert({
        session_id: sessionId.current,
        user_message: userMsg,
        bot_response: botMsg,
        timestamp: new Date().toISOString(),
        user_ip: '',
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('DB save error:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    const userMessage = input.trim();
    if (!userMessage || isLoading) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage
    };

    setInput('');
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Check for CEO questions
      if (/代表|CEO|社長|ジョン|谷口|ジョンボビー/i.test(userMessage)) {
        const response = "Queue株式会社の代表取締役CEOは谷口太一（ジョン/John Bobby）、通称ジョンボビーです。彼の出演チャンネルはこちらです: https://youtu.be/JlP8tb0lEGg?si=SLPI4Apv1YXGySPr";
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response
        };

        setTimeout(() => {
          setMessages(prev => [...prev, botMessage]);
          setIsLoading(false);
          saveToDatabase(userMessage, response);
        }, 500);
        return;
      }

      // Check for consultation-related keywords
      const consultationKeywords = /相談|問い合わせ|依頼|見積|料金|価格|費用|コスト|予算|開発|導入|検討|サービス|AI|DX|自動化|Workmate|プロトタイプ|デモ|契約|発注|提案|企画|設計|実装|運用|支援|コンサル/i;
      const shouldIncludeConsultationLink = consultationKeywords.test(userMessage);

      // Call Gemini API
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
              parts: [{ text: "理解しました。Queue株式会社について回答します。" }]
            },
            {
              role: 'user',
              parts: [{ text: userMessage }]
            }
          ],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 1000,
          },
        }),
      });

      const data = await response.json();
      
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        let botResponse = data.candidates[0].content.parts[0].text;
        
        // Add consultation link for relevant questions
        if (shouldIncludeConsultationLink) {
          botResponse += "\n\n**詳しくご相談されたい場合は、こちらから無料相談をご予約ください：**\nhttps://queue-tech.jp/consultation\n\n**お問い合わせはこちら：**\nhttps://queue-tech.jp/contact";
        }
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: botResponse
        };

        setMessages(prev => [...prev, botMessage]);
        saveToDatabase(userMessage, botResponse);
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'すみません、エラーが発生しました。もう一度お試しください。'
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "エラー",
        description: "メッセージの送信に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Trigger Button */}
      <Button 
        className="rounded-full h-14 w-14 shadow-lg bg-blue-600 hover:bg-blue-700 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="h-6 w-6 text-white" />
      </Button>
      
      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Chat Container */}
          <div className="relative bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h3 className="font-semibold">Queueアシスタント</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <Card className={`max-w-[80%] p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100'
                  }`}>
                    {message.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div className="text-sm prose prose-sm max-w-none prose-gray">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
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
                                <code className={`${className} bg-gray-200 px-1 py-0.5 rounded text-xs`} {...props}>
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
                            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </Card>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <Card className="bg-gray-100 p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </Card>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Form */}
            <div className="p-4 border-t">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="メッセージを入力..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading || !input.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;

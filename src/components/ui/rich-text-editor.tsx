import React, { useMemo, useRef, useState, useEffect } from 'react';
// @ts-ignore - react-quillのタイプ定義が存在しないため
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './rich-text-editor.css';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Type, Palette } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "記事の本文を入力してください...",
  className = ""
}) => {
  const quillRef = useRef<ReactQuill>(null);
  const [fontSize, setFontSize] = useState('14px');
  const [fontFamily, setFontFamily] = useState('Noto Sans JP');

  // フォントサイズとフォントファミリーの変更をエディターに適用
  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const container = quill.container;
      const editor = container.querySelector('.ql-editor');
      if (editor) {
        // 既存のフォントクラスを削除
        editor.classList.remove('font-small', 'font-normal', 'font-large', 'font-xlarge');
        editor.classList.remove('font-noto-sans', 'font-noto-serif', 'font-monospace', 'font-cursive');
        
        // フォントサイズクラスを追加
        const sizeClass = {
          '12px': 'font-small',
          '14px': 'font-normal',
          '16px': 'font-large',
          '18px': 'font-xlarge'
        }[fontSize] || 'font-normal';
        editor.classList.add(sizeClass);
        
        // フォントファミリークラスを追加
        const familyClass = {
          'Noto Sans JP': 'font-noto-sans',
          'Noto Serif JP': 'font-noto-serif',
          'monospace': 'font-monospace',
          'cursive': 'font-cursive'
        }[fontFamily] || 'font-noto-sans';
        editor.classList.add(familyClass);
      }
    }
  }, [fontSize, fontFamily]);

  // 無料相談リンクを挿入する関数
  const insertConsultationLink = () => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection();
      const index = range ? range.index : quill.getLength();
      
      // 無料相談リンクのHTMLを挿入
      quill.clipboard.dangerouslyPasteHTML(
        index,
        '<a href="/consultation" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 mx-2" target="_blank">無料相談はこちら</a>'
      );
    }
  };

  // カスタムツールバーの設定
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        ['blockquote', 'code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['clean']
      ]
    },
    clipboard: {
      matchVisual: false
    }
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'blockquote', 'code-block',
    'list', 'bullet', 'indent',
    'direction', 'align',
    'link', 'image', 'video'
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* カスタムコントロール */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg border">
        {/* フォントサイズ選択 */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium flex items-center gap-1">
            <Type className="h-4 w-4" />
            サイズ:
          </Label>
          <Select value={fontSize} onValueChange={setFontSize}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12px">小</SelectItem>
              <SelectItem value="14px">標準</SelectItem>
              <SelectItem value="16px">大</SelectItem>
              <SelectItem value="18px">特大</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* フォントファミリー選択 */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium flex items-center gap-1">
            <Palette className="h-4 w-4" />
            フォント:
          </Label>
          <Select value={fontFamily} onValueChange={setFontFamily}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Noto Sans JP">ゴシック体</SelectItem>
              <SelectItem value="Noto Serif JP">明朝体</SelectItem>
              <SelectItem value="monospace">等幅フォント</SelectItem>
              <SelectItem value="cursive">筆記体</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 無料相談リンクボタン */}
        <Button
          type="button"
          onClick={insertConsultationLink}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
        >
          <MessageCircle className="h-4 w-4" />
          無料相談リンクを挿入
        </Button>
      </div>

      {/* Quillエディター */}
      <div 
        className="rich-text-editor"
        style={{ 
          fontSize,
          fontFamily: fontFamily === 'Noto Sans JP' ? '"Noto Sans JP", sans-serif' :
                     fontFamily === 'Noto Serif JP' ? '"Noto Serif JP", serif' :
                     fontFamily
        }}
      >
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          style={{
            minHeight: '300px'
          }}
        />
      </div>


    </div>
  );
};

export default RichTextEditor; 
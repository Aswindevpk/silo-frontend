import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Button } from '@/components/ui/button';
import { 
  Paperclip, Send, Code, List, ListOrdered, 
  Quote, Bold, Italic, Strikethrough
} from 'lucide-react';
import { cn } from '@/lib/utils';

const lowlight = createLowlight(common);

interface MessageInputProps {
  placeholder?: string;
  onSendMessage: (content: string, attachments?: any[]) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  placeholder = 'Write a message...', 
  onSendMessage,
  disabled 
}) => {
  const [isEmpty, setIsEmpty] = useState(true);
  const onSendMessageRef = useRef(onSendMessage);

  useEffect(() => {
    onSendMessageRef.current = onSendMessage;
  }, [onSendMessage]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // disable default to use lowlight
      }),
      Placeholder.configure({
        placeholder,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[40px] max-h-[300px] overflow-y-auto w-full px-3 py-2 text-[15px] leading-relaxed',
      }
    },
    onUpdate: ({ editor }) => {
      setIsEmpty(editor.getText().trim() === '');
    }
  });

  const handleSend = useCallback(() => {
    if (!editor || disabled) return;
    const html = editor.getHTML();
    const text = editor.getText().trim();
    if (text) {
      onSendMessage(html, []); // Send HTML directly
      editor.commands.clearContent();
    }
  }, [editor, onSendMessage, disabled]);

  if (!editor) {
    return null;
  }

  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[40px] max-h-[300px] overflow-y-auto w-full text-[15px] leading-relaxed px-3 py-2',
        },
        handleKeyDown: (_view, event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            const text = editor.getText().trim();
            if (text) {
              onSendMessageRef.current(editor.getHTML(), []);
              editor.commands.clearContent();
            }
            return true;
          }
          return false;
        }
      }
    });
  }, [editor]);

  return (
    <div className="flex flex-col border border-gray-300 rounded-xl bg-white shadow-sm focus-within:ring-1 focus-within:ring-gray-400 focus-within:border-gray-400 transition-all overflow-hidden relative">
      <div className="p-0 cursor-text" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
      
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 border-t border-gray-100 rounded-b-xl">
        <div className="flex items-center gap-0.5">
          <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900 rounded-md">
            <Paperclip className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 bg-gray-300 mx-1"></div>
          <Button 
            type="button" variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn("h-7 w-7 p-0 rounded-md", editor.isActive('bold') ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-900")}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            type="button" variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn("h-7 w-7 p-0 rounded-md", editor.isActive('italic') ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-900")}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button 
            type="button" variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn("h-7 w-7 p-0 rounded-md", editor.isActive('strike') ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-900")}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button 
            type="button" variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn("h-7 w-7 p-0 rounded-md", editor.isActive('codeBlock') ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-900")}
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button 
            type="button" variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn("h-7 w-7 p-0 rounded-md", editor.isActive('bulletList') ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-900")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            type="button" variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn("h-7 w-7 p-0 rounded-md", editor.isActive('orderedList') ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-900")}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button 
            type="button" variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn("h-7 w-7 p-0 rounded-md", editor.isActive('blockquote') ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-900")}
          >
            <Quote className="h-4 w-4" />
          </Button>
        </div>
        <Button 
          type="button" 
          disabled={disabled || isEmpty}
          onClick={handleSend}
          className="h-7 px-3 py-0 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 shadow-sm disabled:opacity-50"
        >
          <Send className="h-3 w-3" />
          Send
        </Button>
      </div>
    </div>
  );
};

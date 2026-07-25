import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Button } from '@/components/ui/button';
import { 
  Paperclip, Send, Code, List, ListOrdered, 
  Quote, Bold, Italic, Strikethrough, Mic, File as FileIcon, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { VoiceRecorder } from './VoiceRecorder';

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
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    if (!editor || disabled || isUploading) return;
    const html = editor.getHTML();
    const text = editor.getText().trim();
    if (text || attachments.length > 0) {
      onSendMessage(html, attachments);
      editor.commands.clearContent();
      setAttachments([]);
    }
  }, [editor, onSendMessage, disabled, isUploading, attachments]);

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
            if (text || attachments.length > 0) {
              onSendMessageRef.current(editor.getHTML(), attachments);
              editor.commands.clearContent();
              setAttachments([]);
            }
            return true;
          }
          return false;
        }
      }
    });
  }, [editor, attachments]);

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      // 1. Get presigned URL
      const { upload_url, file_url, content_type } = await api.getPresignedUrl(file.name, file.type);
      
      // 2. Upload to S3
      await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': content_type,
        },
      });

      // 3. Add to attachments
      setAttachments(prev => [...prev, {
        url: file_url,
        type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'file',
        name: file.name,
        size: file.size,
        content_type: file.type
      }]);
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file. Check console for details.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleVoiceRecordingComplete = async (blob: Blob) => {
    setIsRecording(false);
    const file = new File([blob], `voice_note_${new Date().getTime()}.webm`, { type: 'audio/webm' });
    await handleFileUpload(file);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  if (isRecording) {
    return (
      <VoiceRecorder 
        onRecordingComplete={handleVoiceRecordingComplete} 
        onCancel={() => setIsRecording(false)} 
      />
    );
  }

  return (
    <div className="flex flex-col border border-gray-300 rounded-lg bg-white shadow-sm focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 transition-all relative mt-1">
      
      {/* Attachments Preview Area (Slack places them inside the box above text) */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pt-3 pb-1">
          {attachments.map((att, idx) => (
            <div key={idx} className="relative group flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50 p-1.5 max-w-[140px] hover:bg-gray-100 transition-colors">
              <button 
                type="button"
                onClick={() => removeAttachment(idx)}
                className="absolute -top-2 -right-2 bg-white text-gray-500 hover:text-gray-800 border border-gray-200 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
              >
                <X className="h-3 w-3" />
              </button>
              
              {att.type === 'image' ? (
                <img src={att.url} alt={att.name} className="h-14 object-contain rounded" />
              ) : att.type === 'audio' ? (
                <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-700 w-full overflow-hidden">
                  <div className="bg-teal-100 text-teal-700 p-1.5 rounded-full shrink-0">
                    <Mic className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate font-medium">{att.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 p-1 w-full text-gray-700">
                  <FileIcon className="h-5 w-5 shrink-0 text-gray-400" />
                  <span className="text-[11px] font-medium truncate w-full text-center">{att.name}</span>
                </div>
              )}
            </div>
          ))}
          {isUploading && (
            <div className="flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50 p-2 h-[68px] w-[68px]">
              <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      )}

      {isUploading && attachments.length === 0 && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-lg">
          <div className="animate-spin h-5 w-5 border-2 border-gray-900 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Editor Content */}
      <div className="p-0 cursor-text min-h-[44px]" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
        multiple={false} 
      />
      
      {/* Slack-style Toolbar (No background, sits at the bottom) */}
      <div className="flex items-center justify-between px-2 py-1.5 pb-2">
        <div className="flex items-center gap-0.5">
          <Button 
            type="button" variant="ghost" size="sm" 
            onClick={() => fileInputRef.current?.click()}
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button 
            type="button" variant="ghost" size="sm" 
            onClick={() => setIsRecording(true)}
            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-md"
            title="Voice note"
          >
            <Mic className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 bg-gray-300 mx-1.5"></div>
          
          <Button 
            type="button" variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn("h-8 w-8 p-0 rounded-md transition-colors", editor.isActive('bold') ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100")}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            type="button" variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn("h-8 w-8 p-0 rounded-md transition-colors", editor.isActive('italic') ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100")}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button 
            type="button" variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn("h-8 w-8 p-0 rounded-md transition-colors", editor.isActive('strike') ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100")}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 bg-gray-300 mx-1.5"></div>
          <Button 
            type="button" variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn("h-8 w-8 p-0 rounded-md transition-colors", editor.isActive('codeBlock') ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100")}
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button 
            type="button" variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn("h-8 w-8 p-0 rounded-md transition-colors", editor.isActive('bulletList') ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            type="button" variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn("h-8 w-8 p-0 rounded-md transition-colors", editor.isActive('orderedList') ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100")}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button 
            type="button" variant="ghost" size="sm" 
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn("h-8 w-8 p-0 rounded-md transition-colors", editor.isActive('blockquote') ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100")}
          >
            <Quote className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Send Button */}
        <Button 
          type="button" 
          disabled={disabled || (isEmpty && attachments.length === 0) || isUploading}
          onClick={handleSend}
          className={cn(
            "h-8 w-8 p-0 rounded-md transition-all shadow-none flex items-center justify-center ml-2",
            (!isEmpty || attachments.length > 0) && !isUploading && !disabled
              ? "bg-teal-700 hover:bg-teal-800 text-white" 
              : "bg-gray-100 text-gray-400"
          )}
        >
          <Send className="h-4 w-4" style={{ marginLeft: '-2px', marginTop: '1px' }} />
        </Button>
      </div>
    </div>
  );
};

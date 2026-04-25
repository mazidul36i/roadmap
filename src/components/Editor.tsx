import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Undo, 
  Redo, 
  Heading1, 
  Heading2, 
  Underline as UnderlineIcon,
  Link as LinkIcon,
  Highlighter
} from 'lucide-react';
import { useEffect } from 'react';

interface EditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const setLink = () => {
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  return (
    <div className="editor-toolbar">
      <div className="editor-toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`editor-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
          title="Heading 1"
        >
          <Heading1 size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`editor-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </button>
      </div>

      <div className="editor-toolbar-divider" />

      <div className="editor-toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`editor-btn ${editor.isActive('bold') ? 'active' : ''}`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`editor-btn ${editor.isActive('italic') ? 'active' : ''}`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`editor-btn ${editor.isActive('underline') ? 'active' : ''}`}
          title="Underline"
        >
          <UnderlineIcon size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`editor-btn ${editor.isActive('highlight') ? 'active' : ''}`}
          title="Highlight"
        >
          <Highlighter size={16} />
        </button>
      </div>

      <div className="editor-toolbar-divider" />

      <div className="editor-toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`editor-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`editor-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
          title="Ordered List"
        >
          <ListOrdered size={16} />
        </button>
      </div>

      <div className="editor-toolbar-divider" />

      <div className="editor-toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`editor-btn ${editor.isActive('blockquote') ? 'active' : ''}`}
          title="Blockquote"
        >
          <Quote size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`editor-btn ${editor.isActive('codeBlock') ? 'active' : ''}`}
          title="Code Block"
        >
          <Code size={16} />
        </button>
        <button
          onClick={setLink}
          className={`editor-btn ${editor.isActive('link') ? 'active' : ''}`}
          title="Add Link"
        >
          <LinkIcon size={16} />
        </button>
      </div>

      <div className="editor-toolbar-divider" />

      <div className="editor-toolbar-group">
        <button onClick={() => editor.chain().focus().undo().run()} className="editor-btn" title="Undo">
          <Undo size={16} />
        </button>
        <button onClick={() => editor.chain().focus().redo().run()} className="editor-btn" title="Redo">
          <Redo size={16} />
        </button>
      </div>
    </div>
  );
};

export default function Editor({ content, onChange, placeholder = 'Start typing...' }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Highlight,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Handle external content updates (e.g. when selecting a different note)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="editor-container">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
}

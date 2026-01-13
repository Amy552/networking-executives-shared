import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Image } from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { Extension } from "@tiptap/core";

// Custom extension to preserve background-color on TextStyle
const BackgroundColor = Extension.create({
  name: "backgroundColor",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          backgroundColor: {
            default: null,
            parseHTML: (element) => element.style.backgroundColor || null,
            renderHTML: (attributes) => {
              if (!attributes.backgroundColor) return {};
              return { style: `background-color: ${attributes.backgroundColor}` };
            },
          },
        },
      },
    ];
  },
});

/**
 * Toolbar button component
 */
const ToolbarButton = ({ onClick, isActive, disabled, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded hover:bg-gray-200 transition-colors ${
      isActive ? "bg-gray-200 text-blue-600" : "text-gray-600"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    {children}
  </button>
);

/**
 * Simple icon components (to avoid lucide-react dependency)
 */
const Icons = {
  Bold: () => <span className="font-bold text-sm">B</span>,
  Italic: () => <span className="italic text-sm">I</span>,
  List: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="3" cy="6" r="1" fill="currentColor" />
      <circle cx="3" cy="12" r="1" fill="currentColor" />
      <circle cx="3" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  ListOrdered: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <text x="2" y="8" fontSize="8" fill="currentColor">1</text>
      <text x="2" y="14" fontSize="8" fill="currentColor">2</text>
      <text x="2" y="20" fontSize="8" fill="currentColor">3</text>
    </svg>
  ),
  Link: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  Undo: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  ),
  Redo: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
    </svg>
  ),
  Code: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
};

/**
 * RichTextEditor Component
 * Tiptap-based rich text editor with basic formatting
 *
 * @param {Object} props
 * @param {string} props.value - HTML content
 * @param {function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.label - Field label
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.error - Error message
 * @param {number} props.maxLength - Max character length
 * @param {number} props.minHeight - Min editor height in px
 * @param {string} props.layout - Layout style: "horizontal" or "vertical"
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter description...",
  label = "Description",
  required = false,
  error = null,
  maxLength = 2000,
  minHeight = 180,
  layout = "horizontal",
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "max-w-full h-auto",
        },
      }),
      TextStyle.configure({
        // Allow any inline style attributes
        HTMLAttributes: {},
      }),
      Color.configure({
        types: ["textStyle"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      BackgroundColor,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Return empty string if editor is empty
      const isEmpty = html === "<p></p>" || html === "";
      onChange(isEmpty ? "" : html);
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none p-3`,
        style: `min-height: ${minHeight}px`,
      },
      // Handle pasted HTML content
      handlePaste: (view, event) => {
        const html = event.clipboardData?.getData("text/html");
        if (html) {
          // Let Tiptap handle the HTML paste natively
          return false;
        }
        // Check if pasted text looks like raw HTML
        const text = event.clipboardData?.getData("text/plain") || "";
        if (text.trim().startsWith("<") && text.includes(">")) {
          // Insert raw HTML as content
          event.preventDefault();
          editor?.commands.insertContent(text, {
            parseOptions: {
              preserveWhitespace: false,
            },
          });
          return true;
        }
        return false;
      },
    },
    // Enable HTML parsing for pasted content
    parseOptions: {
      preserveWhitespace: "full",
    },
  });

  // Get plain text length for character count
  const getPlainTextLength = () => {
    if (!editor) return 0;
    return editor.state.doc.textContent.length;
  };

  const currentLength = getPlainTextLength();
  const isOverLimit = currentLength > maxLength;

  // HTML edit mode state
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlSource, setHtmlSource] = useState("");

  // Toggle HTML mode
  const toggleHtmlMode = () => {
    if (isHtmlMode) {
      // Switching from HTML to rich text - apply the HTML
      editor?.commands.setContent(htmlSource, false, {
        preserveWhitespace: false,
      });
      setIsHtmlMode(false);
    } else {
      // Switching from rich text to HTML - get current content
      setHtmlSource(editor?.getHTML() || "");
      setIsHtmlMode(true);
    }
  };

  // Handle HTML source changes
  const handleHtmlSourceChange = (e) => {
    setHtmlSource(e.target.value);
  };

  // Add link handler
  const addLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl || "https://");
    if (url === null) return; // Cancelled
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  if (!editor) {
    return null;
  }

  const isHorizontal = layout === "horizontal";

  return (
    <div className="w-full">
      <div className={`flex w-full ${isHorizontal ? "flex-col md:flex-row md:gap-7" : "flex-col"} gap-2`}>
        <label className={`text-base font-medium text-nowrap ${isHorizontal ? "md:mt-2" : ""}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center gap-1 p-2 border border-b-0 border-gray-300 rounded-t-md bg-gray-50">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              title="Bold"
            >
              <Icons.Bold />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              title="Italic"
            >
              <Icons.Italic />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              title="Bullet List"
            >
              <Icons.List />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              title="Numbered List"
            >
              <Icons.ListOrdered />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <ToolbarButton
              onClick={addLink}
              isActive={editor.isActive("link")}
              title="Add Link"
            >
              <Icons.Link />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Icons.Undo />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Icons.Redo />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <ToolbarButton
              onClick={toggleHtmlMode}
              isActive={isHtmlMode}
              title={isHtmlMode ? "Switch to Rich Text" : "Edit HTML"}
            >
              <Icons.Code />
            </ToolbarButton>
          </div>

          {/* Editor */}
          <div className={`border border-gray-300 rounded-b-md bg-white ${error ? "border-red-500" : ""}`}>
            {isHtmlMode ? (
              <textarea
                value={htmlSource}
                onChange={handleHtmlSourceChange}
                className={`w-full p-3 font-mono text-sm focus:outline-none resize-none`}
                style={{ minHeight: `${minHeight}px` }}
                placeholder="<p>Enter HTML here...</p>"
              />
            ) : (
              <EditorContent editor={editor} />
            )}
          </div>

          {/* Footer */}
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>Supports bold, italic, lists, and links</span>
            <span className={isOverLimit ? "text-red-500 font-medium" : ""}>
              {currentLength}/{maxLength} characters
            </span>
          </div>
        </div>
      </div>
      {error && <p className={`mt-1 text-red-500 text-sm ${isHorizontal ? "md:ml-[11rem]" : ""}`}>{error}</p>}

      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }
        .ProseMirror p {
          margin: 0.5rem 0;
        }
        .ProseMirror h1 {
          font-size: 2rem;
          font-weight: 700;
          margin: 1rem 0 0.5rem;
        }
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0.875rem 0 0.5rem;
        }
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0.75rem 0 0.5rem;
        }
        .ProseMirror h4 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0.625rem 0 0.5rem;
        }
        .ProseMirror h5 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0.5rem 0;
        }
        .ProseMirror h6 {
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0.5rem 0;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          margin: 0.5rem 0;
        }
        .ProseMirror span[style*="color"] {
          /* Preserve inline color styles */
        }
      `}</style>
    </div>
  );
}

/**
 * Strip HTML tags for plain text extraction
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
export function stripHtml(html) {
  if (!html) return "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
}

export default RichTextEditor;

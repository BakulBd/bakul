'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Editor, EditorState, RichUtils, convertToRaw, convertFromRaw } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { Post } from '@/types/supabase';

interface PostEditorProps {
  initial?: Partial<Post>;
  onSave: (data: Pick<Post, 'title' | 'slug' | 'content' | 'image_url' | 'type'>) => Promise<void>;
  onCancel: () => void;
}

export default function PostEditor({ initial, onSave, onCancel }: PostEditorProps) {
  const [title, setTitle] = useState(initial?.title || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [imageUrl, setImageUrl] = useState(initial?.image_url || '');
  const [type, setType] = useState<Post['type']>(initial?.type || 'blog');
  const [editorState, setEditorState] = useState(
    initial?.content
      ? EditorState.createWithContent(convertFromRaw(JSON.parse(initial.content)))
      : EditorState.createEmpty()
  );
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Auto-generate slug from title
  useEffect(() => {
    if (!initial?.slug && title && !slug) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      setSlug(generatedSlug);
    }
  }, [title, slug, initial?.slug]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) errors.title = 'Title is required';
    if (!slug.trim()) errors.slug = 'Slug is required';
    if (slug.includes(' ')) errors.slug = 'Slug cannot contain spaces';
    if (!editorState.getCurrentContent().hasText()) errors.content = 'Content is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleKeyCommand = (command: string, editorState: EditorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const toggleInlineStyle = (style: string) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, style));
  };

  const toggleBlockType = (blockType: string) => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const contentState = editorState.getCurrentContent();
      const rawContent = JSON.stringify(convertToRaw(contentState));
      await onSave({
        title,
        slug,
        image_url: imageUrl,
        type,
        content: rawContent,
      });
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 focus:outline-none z-10"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 overflow-y-auto max-h-[90vh]">
          <h2 className="text-2xl font-bold mb-4">{initial?.id ? 'Edit Post' : 'New Post'}</h2>

          <div className="flex gap-2 mb-6 border-b dark:border-gray-700">
            <button
              onClick={() => setTab('edit')}
              className={`px-4 py-2 ${tab === 'edit' ? 'border-b-2 border-indigo-500 text-indigo-600 font-medium' : 'text-gray-500'}`}
              aria-pressed={tab === 'edit'}
            >
              Edit
            </button>
            <button
              onClick={() => setTab('preview')}
              className={`px-4 py-2 ${tab === 'preview' ? 'border-b-2 border-indigo-500 text-indigo-600 font-medium' : 'text-gray-500'}`}
              aria-pressed={tab === 'preview'}
            >
              Preview
            </button>
          </div>

          {tab === 'edit' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Post Title"
                  className={`w-full px-3 py-2 rounded border ${validationErrors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500`}
                  aria-invalid={!!validationErrors.title}
                  aria-describedby={validationErrors.title ? "title-error" : undefined}
                />
                {validationErrors.title && (
                  <p id="title-error" className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug (for URL)
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 mr-1">/blog/</span>
                  <input
                    id="slug"
                    value={slug}
                    onChange={e => setSlug(e.target.value.replace(/\s+/g, '-').toLowerCase())}
                    placeholder="post-url-slug"
                    className={`flex-1 px-3 py-2 rounded border ${validationErrors.slug ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500`}
                    aria-invalid={!!validationErrors.slug}
                    aria-describedby={validationErrors.slug ? "slug-error" : undefined}
                  />
                </div>
                {validationErrors.slug ? (
                  <p id="slug-error" className="mt-1 text-sm text-red-600">{validationErrors.slug}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">This will be the URL of your post. No spaces allowed.</p>
                )}
              </div>

              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
                <input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">Direct link to featured image (optional)</p>
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select
                  id="type"
                  value={type}
                  onChange={e => setType(e.target.value as Post['type'])}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="blog">Blog</option>
                  <option value="vlog">Vlog</option>
                </select>
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                <div className="toolbar mb-2">
                  <button onClick={() => toggleInlineStyle('BOLD')}>Bold</button>
                  <button onClick={() => toggleInlineStyle('ITALIC')}>Italic</button>
                  <button onClick={() => toggleInlineStyle('UNDERLINE')}>Underline</button>
                  <button onClick={() => toggleBlockType('unordered-list-item')}>Bullet List</button>
                  <button onClick={() => toggleBlockType('ordered-list-item')}>Numbered List</button>
                </div>
                <div className="editor bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500">
                  <Editor
                    editorState={editorState}
                    onChange={setEditorState}
                    handleKeyCommand={handleKeyCommand}
                    placeholder="Write your content here..."
                  />
                </div>
                {validationErrors.content && (
                  <p id="content-error" className="mt-1 text-sm text-red-600">{validationErrors.content}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-6">
              <h1 className="text-2xl font-bold mb-4">{title || 'Post Title'}</h1>

              {imageUrl && (
                <div className="mb-6 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                  <Image src={imageUrl} alt="Preview" width={800} height={400} className="w-full h-auto object-contain max-h-[400px]" />
                </div>
              )}

              <div className="prose dark:prose-invert max-w-none">
                {editorState.getCurrentContent().hasText() ? (
                  <div dangerouslySetInnerHTML={{ __html: editorState.getCurrentContent().getPlainText() }} />
                ) : (
                  <p className="text-gray-400 italic">No content to preview. Add content in the Edit tab.</p>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setTab('edit')}
                  className="px-4 py-2 text-sm rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-200"
                >
                  Back to editing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
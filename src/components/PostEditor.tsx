'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Editor, EditorState, RichUtils, convertToRaw, convertFromRaw } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { Post } from '@/types/supabase';

interface PostEditorProps {
  initial?: Partial<Post>;
  onSave: (data: Pick<Post, 'title' | 'slug' | 'content' | 'media_url' | 'type'>) => Promise<void>;
  onCancel: () => void;
}

export default function PostEditor({ initial, onSave, onCancel }: PostEditorProps) {
  const [title, setTitle] = useState(initial?.title || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [imageUrl, setImageUrl] = useState(initial?.media_url || '');
  const [mediaUrl, setMediaUrl] = useState(initial?.media_url || '');
  const [type, setType] = useState<Post['type']>(initial?.type || 'blog');
  const [editorState, setEditorState] = useState(
    initial?.content
      ? EditorState.createWithContent(convertFromRaw(JSON.parse(initial.content)))
      : EditorState.createEmpty()
  );
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
        media_url: imageUrl,
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
        {/* Cancel Button */}
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

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b dark:border-gray-700">
            {['edit', 'preview'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t as 'edit' | 'preview')}
                className={`px-4 py-2 ${
                  tab === t ? 'border-b-2 border-indigo-500 text-indigo-600 font-medium' : 'text-gray-500'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === 'edit' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title Input */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium">Title</label>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-3 py-2 rounded border ${
                    validationErrors.title ? 'border-red-500' : 'border-gray-300'
                  } dark:bg-gray-800`}
                />
                {validationErrors.title && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.title}</p>
                )}
              </div>

              {/* Slug Input */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium">Slug (URL)</label>
                <div className="flex items-center">
                  <span className="mr-1 text-gray-500">/blog/</span>
                  <input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.replace(/\s+/g, '-').toLowerCase())}
                    className={`flex-1 px-3 py-2 rounded border ${
                      validationErrors.slug ? 'border-red-500' : 'border-gray-300'
                    } dark:bg-gray-800`}
                  />
                </div>
                {validationErrors.slug && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.slug}</p>
                )}
              </div>

              {/* Image URL */}
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium">Image URL</label>
                <input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:bg-gray-800"
                />
              </div>

              {/* Media URL */}
              <div>
                <label htmlFor="mediaUrl" className="block text-sm font-medium">Media URL</label>
                <input
                  id="mediaUrl"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:bg-gray-800"
                />
                {mediaUrl &&
                  (mediaUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <Image
                      src={mediaUrl}
                      alt="Media preview"
                      width={800}
                      height={400}
                      className="mt-2 rounded"
                    />
                  ) : (
                    <iframe src={mediaUrl} className="mt-2 w-full h-48 rounded" allowFullScreen />
                  ))}
              </div>

              {/* Post Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium">Post Type</label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as Post['type'])}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:bg-gray-800"
                >
                  <option value="blog">Blog</option>
                  <option value="vlog">Vlog</option>
                </select>
              </div>

              {/* Editor */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium">Content</label>
                <div className="flex space-x-2 mb-2">
                  {['BOLD', 'ITALIC', 'UNDERLINE'].map(style => (
                    <button key={style} type="button" onClick={() => toggleInlineStyle(style)}>{style}</button>
                  ))}
                  <button type="button" onClick={() => toggleBlockType('unordered-list-item')}>UL</button>
                  <button type="button" onClick={() => toggleBlockType('ordered-list-item')}>OL</button>
                </div>
                <div className="bg-white dark:bg-gray-800 border rounded p-2 min-h-[150px]">
                  <Editor
                    editorState={editorState}
                    onChange={setEditorState}
                    handleKeyCommand={handleKeyCommand}
                    placeholder="Write your post content here..."
                  />
                </div>
                {validationErrors.content && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.content}</p>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={onCancel} className="bg-gray-300 px-4 py-2 rounded">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              <h1>{title || 'Untitled Post'}</h1>

              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={title ? `${title} image` : 'Post image'}
                  width={800}
                  height={400}
                  className="my-4 rounded-lg"
                />
              )}

              {mediaUrl && (
                mediaUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <Image
                    src={mediaUrl}
                    alt={title ? `${title} media` : 'Media'}
                    width={800}
                    height={400}
                    className="my-4 rounded-lg"
                  />
                ) : (
                  <iframe src={mediaUrl} className="w-full h-64 my-4 rounded" allowFullScreen />
                )
              )}

              {editorState.getCurrentContent().hasText() ? (
                <p>{editorState.getCurrentContent().getPlainText()}</p>
              ) : (
                <p className="italic text-gray-500">No content available for preview.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

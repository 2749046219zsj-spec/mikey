import React, { useState, useEffect } from 'react';
import { Send, Loader2, Edit2, Trash2 } from 'lucide-react';
import type { ProductComment } from '../../types/catalog';
import { catalogService } from '../../services/catalogService';

interface CommentSectionProps {
  productId: string;
  userId?: string;
  onCommentCountChange: (count: number) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  productId,
  userId,
  onCommentCountChange,
}) => {
  const [comments, setComments] = useState<ProductComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    loadComments();
  }, [productId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await catalogService.getComments(productId);
      setComments(data);
      onCommentCountChange(data.length);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !userId || submitting) return;

    try {
      setSubmitting(true);
      const newComment = await catalogService.addComment(productId, userId, commentText.trim());
      setComments([newComment, ...comments]);
      setCommentText('');
      onCommentCountChange(comments.length + 1);
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return;

    try {
      await catalogService.updateComment(commentId, editText.trim());
      setComments(
        comments.map((c) =>
          c.id === commentId ? { ...c, comment_text: editText.trim() } : c
        )
      );
      setEditingId(null);
      setEditText('');
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？')) return;

    try {
      await catalogService.deleteComment(commentId);
      setComments(comments.filter((c) => c.id !== commentId));
      onCommentCountChange(comments.length - 1);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-4">
      {userId && (
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="写下你的评论..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={submitting}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!commentText.trim() || submitting}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
              <span>发表评论</span>
            </button>
          </div>
        </form>
      )}

      {!userId && (
        <div className="text-center py-4 text-gray-500">
          <p>登录后即可评论</p>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>暂无评论</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                  {comment.user_profile?.username?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {comment.user_profile?.username || '匿名用户'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  {userId === comment.user_id && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditText(comment.comment_text);
                        }}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditComment(comment.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditText('');
                        }}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap break-words">
                    {comment.comment_text}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

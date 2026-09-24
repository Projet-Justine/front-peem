import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
  Newspaper, Pin, ThumbsUp, MessageSquare, Send, Share2, Plus,
  AlertCircle, CheckCircle, Clock, Calendar, Sparkles, Filter
} from 'lucide-react';
import type { Post } from '../types';

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'officiel' | 'amis' | 'groupes'>('officiel');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const [newPost, setNewPost] = useState({
    titre: '',
    contenu: '',
    type: 'ANNONCE',
    filiere: user?.filiere || '',
    niveau: user?.niveau || '',
  });

  const loadFeed = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/posts/feed?tab=${activeTab}`);
      setPosts(res.data || []);
    } catch (err) {
      console.error('Error fetching feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [activeTab]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        titre: newPost.titre,
        contenu: newPost.contenu,
        type: newPost.type,
      };
      if (newPost.filiere || newPost.niveau) {
        payload.targets = [{ filiere: newPost.filiere, niveau: newPost.niveau }];
      }
      await api.post('/posts', payload);
      setShowCreateModal(false);
      setNewPost({ titre: '', contenu: '', type: 'ANNONCE', filiere: '', niveau: '' });
      loadFeed();
    } catch (err) {
      console.error('Error creating post:', err);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await api.post(`/posts/${postId}/reactions`, { type: 'LIKE' });
      // Optimistic update
      setPosts(prev =>
        prev.map(p => {
          if (p.id !== postId) return p;
          const hasLiked = p.reactions?.some(r => r.userId === user?.id);
          const newReactions = hasLiked
            ? p.reactions?.filter(r => r.userId !== user?.id)
            : [...(p.reactions || []), { id: 'temp', postId, userId: user!.id, type: 'LIKE' }];
          return { ...p, reactions: newReactions };
        })
      );
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    try {
      const res = await api.post(`/posts/${postId}/comments`, { contenu: text });
      setPosts(prev =>
        prev.map(p => {
          if (p.id !== postId) return p;
          return { ...p, commentaires: [...(p.commentaires || []), res.data] };
        })
      );
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const typeConfig: Record<string, { label: string; color: string; border: string }> = {
    ANNONCE: { label: 'Annonce', color: 'bg-blue-100 text-blue-700', border: 'border-l-blue-600' },
    URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-700', border: 'border-l-red-600' },
    EVENEMENT: { label: 'Événement', color: 'bg-purple-100 text-purple-700', border: 'border-l-purple-600' },
    RESULTAT: { label: 'Résultat', color: 'bg-emerald-100 text-emerald-700', border: 'border-l-emerald-600' },
    INFORMATION: { label: 'Information', color: 'bg-slate-100 text-slate-700', border: 'border-l-slate-400' },
  };

  const canPublish = ['ADMIN', 'SCOLARITE', 'RESPONSABLE_FILIERE', 'ENSEIGNANT'].includes(user?.role || '');

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fil d'actualité</h1>
          <p className="text-sm text-slate-500">Publications officielles, annonces et informations de l'EMIT</p>
        </div>
        {canPublish && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors"
          >
            <Plus size={16} />
            Nouvelle publication
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { key: 'officiel', label: 'Officiel (Administration & Enseignants)' },
          { key: 'amis', label: 'Amis' },
          { key: 'groupes', label: 'Mes groupes' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`px-4 py-3 text-xs md:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
          <Newspaper size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-700">Aucune publication pour le moment</p>
          <p className="text-xs mt-1">Revenez plus tard pour voir les actualités de votre filière</p>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map(post => {
            const conf = typeConfig[post.type] || { label: post.type, color: 'bg-slate-100 text-slate-600', border: 'border-l-slate-400' };
            const hasLiked = post.reactions?.some(r => r.userId === user?.id);
            const showComments = expandedComments[post.id];

            return (
              <article
                key={post.id}
                className={`bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden border-l-4 ${conf.border}`}
              >
                {/* Post Top */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-sm">
                        {post.auteur?.prenom?.[0] || 'A'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          {post.auteur?.prenom} {post.auteur?.nom}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {post.auteur?.role} · {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {post.epingle && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <Pin size={12} /> Épinglé
                        </span>
                      )}
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${conf.color}`}>
                        {conf.label}
                      </span>
                    </div>
                  </div>

                  {/* Title & Body */}
                  <h2 className="text-base md:text-lg font-bold text-slate-900 mb-2">{post.titre}</h2>
                  <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{post.contenu}</p>

                  {/* Target tags */}
                  {post.cibles && post.cibles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {post.cibles.map(c => (
                        <span key={c.id} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          🎯 {c.filiere || 'Toutes filières'} · {c.niveau || 'Tous niveaux'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Engagement Bar */}
                <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{post.reactions?.length || 0} mentions "J'aime"</span>
                  <span>{post.commentaires?.length || 0} commentaires</span>
                </div>

                {/* Actions */}
                <div className="px-5 py-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold transition-colors ${
                      hasLiked
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ThumbsUp size={15} />
                    J'aime
                  </button>
                  <button
                    onClick={() =>
                      setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))
                    }
                    className="flex-1 py-1.5 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <MessageSquare size={15} />
                    Commenter
                  </button>
                </div>

                {/* Comments section */}
                {showComments && (
                  <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-4">
                    {/* Add comment input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Écrire un commentaire public..."
                        value={commentInputs[post.id] || ''}
                        onChange={e =>
                          setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={e => e.key === 'Enter' && handleAddComment(post.id)}
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        <Send size={14} />
                      </button>
                    </div>

                    {/* Comments list */}
                    <div className="space-y-3">
                      {(post.commentaires || []).map(comment => (
                        <div key={comment.id} className="flex gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 flex-shrink-0">
                            {comment.auteur?.prenom?.[0] || 'U'}
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-xs text-slate-800">
                                {comment.auteur?.prenom} {comment.auteur?.nom}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(comment.createdAt).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">{comment.contenu}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Modal create publication */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Publier une annonce officielle</h3>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Titre de la publication</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Emploi du temps des examens S2"
                  value={newPost.titre}
                  onChange={e => setNewPost({ ...newPost, titre: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={newPost.type}
                    onChange={e => setNewPost({ ...newPost, type: e.target.value })}
                    className="w-full px-2 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ANNONCE">Annonce</option>
                    <option value="URGENT">Urgent</option>
                    <option value="EVENEMENT">Événement</option>
                    <option value="RESULTAT">Résultat</option>
                    <option value="INFORMATION">Information</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Filière cible</label>
                  <input
                    type="text"
                    placeholder="Toutes ou Ex: Informatique"
                    value={newPost.filiere}
                    onChange={e => setNewPost({ ...newPost, filiere: e.target.value })}
                    className="w-full px-2 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Niveau cible</label>
                  <input
                    type="text"
                    placeholder="Tous ou Ex: L2"
                    value={newPost.niveau}
                    onChange={e => setNewPost({ ...newPost, niveau: e.target.value })}
                    className="w-full px-2 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Contenu</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Détails de l'annonce..."
                  value={newPost.contenu}
                  onChange={e => setNewPost({ ...newPost, contenu: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
                >
                  Diffuser l'annonce
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

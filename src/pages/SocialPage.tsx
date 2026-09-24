import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import type { User, Friendship, WallPost, Listing, Profile, Badge } from '../types';
import {
  User as UserIcon,
  Users,
  ShoppingBag,
  Edit3,
  Save,
  X,
  Plus,
  Send,
  Heart,
  ThumbsUp,
  MessageCircle,
  Globe,
  Lock,
  UserCheck,
  UserPlus,
  UserX,
  Check,
  ChevronDown,
  Camera,
  Briefcase,
  BookOpen,
  Tag,
  MapPin,
  Calendar,
  Award,
  Image,
  Smile,
  MoreHorizontal,
  Share2,
  Trash2,
  AlertCircle,
  Search,
  Star,
  Package,
  Home,
  Car,
  GraduationCap,
  HelpCircle,
} from 'lucide-react';

const Github = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

// ── Types ──────────────────────────────────────────────────────────────────

type TabId = 'profil' | 'amis' | 'annonces';
type Audience = 'PUBLIC' | 'AMIS' | 'CLASSE';
type ListingCategory =
  | 'LIVRES'
  | 'MATERIEL'
  | 'LOGEMENT'
  | 'COVOITURAGE'
  | 'COURS'
  | 'OBJETS_PERDUS';

interface WallReaction {
  id: string;
  wallPostId: string;
  userId: string;
  user?: User;
  type: string;
}

interface WallPostWithReactions extends WallPost {
  reactions?: WallReaction[];
  commentCount?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function Avatar({
  user,
  size = 'md',
  online,
}: {
  user?: Partial<User> | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
}) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-24 h-24 text-xl',
  };
  const initials = user
    ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase()
    : '?';
  return (
    <div className="relative inline-block">
      {user?.photoUrl ? (
        <img
          src={user.photoUrl}
          alt={`${user.prenom} ${user.nom}`}
          className={`${sizes[size]} rounded-full object-cover border-2 border-white shadow`}
        />
      ) : (
        <div
          className={`${sizes[size]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold border-2 border-white shadow`}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
            online ? 'bg-green-500' : 'bg-slate-300'
          }`}
        />
      )}
    </div>
  );
}

function AudienceBadge({ audience }: { audience: Audience }) {
  const map: Record<Audience, { icon: typeof Globe; label: string; cls: string }> = {
    PUBLIC: { icon: Globe, label: 'Public', cls: 'text-green-600 bg-green-50' },
    AMIS: { icon: Users, label: 'Amis', cls: 'text-blue-600 bg-blue-50' },
    CLASSE: { icon: GraduationCap, label: 'Classe', cls: 'text-purple-600 bg-purple-50' },
  };
  const { icon: Icon, label, cls } = map[audience] ?? map.PUBLIC;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      <Icon size={11} />
      {label}
    </span>
  );
}

function categoryIcon(cat: ListingCategory) {
  const icons: Record<ListingCategory, typeof BookOpen> = {
    LIVRES: BookOpen,
    MATERIEL: Package,
    LOGEMENT: Home,
    COVOITURAGE: Car,
    COURS: GraduationCap,
    OBJETS_PERDUS: HelpCircle,
  };
  return icons[cat] ?? Tag;
}

function categoryColor(cat: ListingCategory) {
  const colors: Record<ListingCategory, string> = {
    LIVRES: 'bg-amber-100 text-amber-700',
    MATERIEL: 'bg-blue-100 text-blue-700',
    LOGEMENT: 'bg-green-100 text-green-700',
    COVOITURAGE: 'bg-purple-100 text-purple-700',
    COURS: 'bg-rose-100 text-rose-700',
    OBJETS_PERDUS: 'bg-slate-100 text-slate-700',
  };
  return colors[cat] ?? 'bg-slate-100 text-slate-600';
}

// ── Spinner ────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function Empty({ icon: Icon, text }: { icon: typeof UserIcon; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      <Icon size={36} className="mb-2 opacity-30" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: MON PROFIL
// ══════════════════════════════════════════════════════════════════════════════

interface ProfileEditForm {
  bio: string;
  interests: string;
  skills: string;
  githubUrl: string;
  linkedinUrl: string;
  disponibilite: string;
}

function ProfilTab({ currentUser }: { currentUser: User }) {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(currentUser.profile ?? null);
  const [badges, setBadges] = useState<Badge[]>(currentUser.badges ?? []);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileEditForm>({
    bio: profile?.bio ?? '',
    interests: profile?.interests ?? '',
    skills: profile?.skills ?? '',
    githubUrl: profile?.githubUrl ?? '',
    linkedinUrl: profile?.linkedinUrl ?? '',
    disponibilite: profile?.disponibilite ?? '',
  });

  const [wallPosts, setWallPosts] = useState<WallPostWithReactions[]>([]);
  const [wallLoading, setWallLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [postAudience, setPostAudience] = useState<Audience>('PUBLIC');
  const [submittingPost, setSubmittingPost] = useState(false);
  const [showAudienceDropdown, setShowAudienceDropdown] = useState(false);

  const loadWall = useCallback(async () => {
    setWallLoading(true);
    try {
      const res = await api.get<WallPostWithReactions[]>(`/social/wall/${currentUser.id}`);
      setWallPosts(res.data ?? []);
    } catch {
      setWallPosts([]);
    } finally {
      setWallLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    loadWall();
  }, [loadWall]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.patch<{ profile: Profile; user: User }>(
        `/social/profile/${currentUser.id}`,
        form
      );
      const updatedProfile = res.data?.profile ?? (res.data as unknown as Profile);
      setProfile(updatedProfile);
      setEditing(false);
      // refresh user in context if needed
      if (res.data?.user) updateUser(res.data.user);
    } catch (err) {
      console.error('Error saving profile', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;
    setSubmittingPost(true);
    try {
      const res = await api.post<WallPostWithReactions>('/social/wall', {
        contenu: postContent.trim(),
        audience: postAudience,
        mediaUrls: [],
      });
      setWallPosts((prev) => [res.data, ...prev]);
      setPostContent('');
    } catch (err) {
      console.error('Error creating post', err);
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleReact = async (postId: string, type: string) => {
    try {
      await api.post(`/social/wall/${postId}/reactions`, { type });
      setWallPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const alreadyReacted = p.reactions?.some(
            (r) => r.userId === currentUser.id && r.type === type
          );
          if (alreadyReacted) {
            return { ...p, reactions: p.reactions?.filter((r) => r.userId !== currentUser.id) };
          }
          return {
            ...p,
            reactions: [
              ...(p.reactions ?? []),
              {
                id: Math.random().toString(),
                wallPostId: postId,
                userId: currentUser.id,
                type,
              },
            ],
          };
        })
      );
    } catch {
      // silent
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await api.delete(`/social/wall/${postId}`);
      setWallPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      // silent
    }
  };

  const roleLabel = (role: string) => {
    const map: Record<string, string> = {
      ETUDIANT: 'Étudiant',
      ENSEIGNANT: 'Enseignant',
      ADMIN: 'Administrateur',
      SCOLARITE: 'Scolarité',
      RESPONSABLE_FILIERE: 'Responsable Filière',
      DELEGUE: 'Délégué',
    };
    return map[role] ?? role;
  };

  return (
    <div className="space-y-4">
      {/* Profile header card */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {/* Cover */}
        <div className="relative h-32 md:h-44 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600">
          {(profile?.coverUrl ?? currentUser.coverUrl) && (
            <img
              src={profile?.coverUrl ?? currentUser.coverUrl}
              alt="cover"
              className="w-full h-full object-cover"
            />
          )}
          <button className="absolute bottom-3 right-3 bg-white/80 backdrop-blur text-slate-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-white transition">
            <Camera size={13} />
            Photo de couverture
          </button>
        </div>

        {/* Avatar + info */}
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="relative">
              <Avatar user={currentUser} size="xl" />
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition shadow">
                <Camera size={12} />
              </button>
            </div>
            {!editing ? (
              <button
                onClick={() => {
                  setForm({
                    bio: profile?.bio ?? '',
                    interests: profile?.interests ?? '',
                    skills: profile?.skills ?? '',
                    githubUrl: profile?.githubUrl ?? '',
                    linkedinUrl: profile?.linkedinUrl ?? '',
                    disponibilite: profile?.disponibilite ?? '',
                  });
                  setEditing(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition"
              >
                <Edit3 size={14} />
                Modifier le profil
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-2 text-slate-600 rounded-xl text-sm hover:bg-slate-100 transition"
                >
                  <X size={14} />
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60"
                >
                  <Save size={14} />
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            )}
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            {currentUser.prenom} {currentUser.nom}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {roleLabel(currentUser.role)}
            </span>
            {currentUser.filiere && (
              <span className="text-xs text-slate-500">
                {currentUser.filiere} · {currentUser.niveau}
              </span>
            )}
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {badges.map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full"
                >
                  <Award size={10} />
                  {b.label}
                </span>
              ))}
            </div>
          )}

          {/* Edit form */}
          {editing ? (
            <div className="mt-4 space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  placeholder="Quelques mots sur vous…"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Centres d'intérêt
                  </label>
                  <input
                    type="text"
                    value={form.interests}
                    onChange={(e) => setForm({ ...form, interests: e.target.value })}
                    placeholder="IA, Web, Robotique…"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Compétences
                  </label>
                  <input
                    type="text"
                    value={form.skills}
                    onChange={(e) => setForm({ ...form, skills: e.target.value })}
                    placeholder="React, Python, Java…"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                    <Github size={12} /> GitHub
                  </label>
                  <input
                    type="url"
                    value={form.githubUrl}
                    onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                    placeholder="https://github.com/…"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                    <Linkedin size={12} /> LinkedIn
                  </label>
                  <input
                    type="url"
                    value={form.linkedinUrl}
                    onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/…"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                    <Briefcase size={12} /> Disponibilité
                  </label>
                  <input
                    type="text"
                    value={form.disponibilite}
                    onChange={(e) => setForm({ ...form, disponibilite: e.target.value })}
                    placeholder="Disponible pour stage, freelance…"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {profile?.bio && <p className="text-sm text-slate-700 leading-relaxed">{profile.bio}</p>}
              <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                {profile?.interests && (
                  <span className="flex items-center gap-1">
                    <Star size={11} />
                    {profile.interests}
                  </span>
                )}
                {profile?.skills && (
                  <span className="flex items-center gap-1">
                    <Tag size={11} />
                    {profile.skills}
                  </span>
                )}
                {profile?.disponibilite && (
                  <span className="flex items-center gap-1">
                    <Briefcase size={11} />
                    {profile.disponibilite}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {profile?.githubUrl && (
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 transition"
                  >
                    <Github size={13} /> GitHub
                  </a>
                )}
                {profile?.linkedinUrl && (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-blue-700 transition"
                  >
                    <Linkedin size={13} /> LinkedIn
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create post */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-start gap-3">
          <Avatar user={currentUser} size="sm" />
          <div className="flex-1">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder={`Quoi de neuf, ${currentUser.prenom} ?`}
              rows={3}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {/* Audience selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowAudienceDropdown((v) => !v)}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                  >
                    {postAudience === 'PUBLIC' && <Globe size={12} />}
                    {postAudience === 'AMIS' && <Users size={12} />}
                    {postAudience === 'CLASSE' && <GraduationCap size={12} />}
                    {postAudience === 'PUBLIC' ? 'Public' : postAudience === 'AMIS' ? 'Amis' : 'Classe'}
                    <ChevronDown size={11} />
                  </button>
                  {showAudienceDropdown && (
                    <div className="absolute left-0 top-8 bg-white border border-slate-200 rounded-xl shadow-lg z-20 min-w-[130px]">
                      {(['PUBLIC', 'AMIS', 'CLASSE'] as Audience[]).map((a) => (
                        <button
                          key={a}
                          onClick={() => { setPostAudience(a); setShowAudienceDropdown(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 transition ${postAudience === a ? 'text-blue-600 font-medium' : 'text-slate-700'}`}
                        >
                          {a === 'PUBLIC' && <Globe size={12} />}
                          {a === 'AMIS' && <Users size={12} />}
                          {a === 'CLASSE' && <GraduationCap size={12} />}
                          {a === 'PUBLIC' ? 'Public' : a === 'AMIS' ? 'Amis' : 'Classe'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button className="p-1.5 text-slate-400 hover:text-blue-500 transition">
                  <Image size={16} />
                </button>
                <button className="p-1.5 text-slate-400 hover:text-amber-500 transition">
                  <Smile size={16} />
                </button>
              </div>
              <button
                onClick={handleCreatePost}
                disabled={!postContent.trim() || submittingPost}
                className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Send size={13} />
                {submittingPost ? 'Publication…' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Wall posts */}
      <div className="space-y-3">
        {wallLoading ? (
          <Spinner />
        ) : wallPosts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Empty icon={MessageCircle} text="Aucune publication sur votre mur" />
          </div>
        ) : (
          wallPosts.map((post) => (
            <WallPostCard
              key={post.id}
              post={post}
              currentUserId={currentUser.id}
              onReact={handleReact}
              onDelete={handleDeletePost}
            />
          ))
        )}
      </div>
    </div>
  );
}

function WallPostCard({
  post,
  currentUserId,
  onReact,
  onDelete,
}: {
  post: WallPostWithReactions;
  currentUserId: string;
  onReact: (postId: string, type: string) => void;
  onDelete: (postId: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const likeCount = post.reactions?.filter((r) => r.type === 'LIKE').length ?? 0;
  const heartCount = post.reactions?.filter((r) => r.type === 'HEART').length ?? 0;
  const userReacted = post.reactions?.some((r) => r.userId === currentUserId);
  const isOwner = post.auteurId === currentUserId;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar user={post.auteur} size="md" />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {post.auteur?.prenom} {post.auteur?.nom}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-400">{formatDate(post.createdAt)}</span>
                <AudienceBadge audience={post.audience as Audience} />
              </div>
            </div>
          </div>
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <MoreHorizontal size={16} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-7 bg-white border border-slate-200 rounded-xl shadow-lg z-20 min-w-[140px]">
                  <button
                    onClick={() => { onDelete(post.id); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 size={12} />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-3 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
          {post.contenu}
        </p>

        {post.mediaUrls && (
          <div className="mt-3 rounded-xl overflow-hidden border border-slate-100">
            <img src={post.mediaUrls} alt="media" className="w-full max-h-80 object-cover" />
          </div>
        )}
      </div>

      {/* Reactions bar */}
      <div className="px-4 pb-3 flex items-center justify-between border-t border-slate-50 pt-2">
        <div className="flex items-center gap-1">
          {likeCount > 0 && (
            <span className="text-xs text-slate-500 mr-1">
              👍 {likeCount}
            </span>
          )}
          {heartCount > 0 && (
            <span className="text-xs text-slate-500">
              ❤️ {heartCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onReact(post.id, 'LIKE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              userReacted
                ? 'bg-blue-100 text-blue-700'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <ThumbsUp size={13} />
            J'aime
          </button>
          <button
            onClick={() => onReact(post.id, 'HEART')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 transition"
          >
            <Heart size={13} />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 transition">
            <Share2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: AMIS
// ══════════════════════════════════════════════════════════════════════════════

function AmisTab({ currentUser }: { currentUser: User }) {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [requests, setRequests] = useState<Friendship[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes, suggestionsRes] = await Promise.allSettled([
        api.get<Friendship[]>(`/social/friends/${currentUser.id}`),
        api.get<Friendship[]>('/social/friend-requests'),
        api.get<User[]>('/social/suggestions'),
      ]);
      setFriends(
        friendsRes.status === 'fulfilled'
          ? (friendsRes.value.data ?? []).filter((f) => f.statut === 'ACCEPTE')
          : []
      );
      setRequests(
        requestsRes.status === 'fulfilled'
          ? (requestsRes.value.data ?? []).filter((f) => f.statut === 'EN_ATTENTE')
          : []
      );
      // Fallback: get all users as suggestions if endpoint not available
      if (suggestionsRes.status === 'fulfilled') {
        setSuggestions(suggestionsRes.value.data ?? []);
      } else {
        const usersRes = await api.get<User[]>('/auth/users');
        setSuggestions(
          (usersRes.data ?? []).filter((u) => u.id !== currentUser.id).slice(0, 10)
        );
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    load();
  }, [load]);

  const sendRequest = async (userBId: string) => {
    setPendingActions((s) => new Set(s).add(userBId));
    try {
      await api.post('/social/friends', { userBId });
      setSuggestions((prev) => prev.filter((u) => u.id !== userBId));
    } catch {
      // silent
    } finally {
      setPendingActions((s) => { const ns = new Set(s); ns.delete(userBId); return ns; });
    }
  };

  const respondRequest = async (id: string, statut: 'ACCEPTE' | 'REFUSE') => {
    setPendingActions((s) => new Set(s).add(id));
    try {
      await api.patch(`/social/friends/${id}`, { statut });
      setRequests((prev) => prev.filter((r) => r.id !== id));
      if (statut === 'ACCEPTE') await load();
    } catch {
      // silent
    } finally {
      setPendingActions((s) => { const ns = new Set(s); ns.delete(id); return ns; });
    }
  };

  const friendUser = (f: Friendship) =>
    f.userAId === currentUser.id ? f.userB : f.userA;

  const filteredFriends = friends.filter((f) => {
    const u = friendUser(f);
    if (!u) return false;
    const q = searchQuery.toLowerCase();
    return (
      u.prenom?.toLowerCase().includes(q) ||
      u.nom?.toLowerCase().includes(q) ||
      u.filiere?.toLowerCase().includes(q)
    );
  });

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      {/* Pending requests */}
      {requests.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <UserCheck size={16} className="text-amber-600" />
            <h2 className="font-semibold text-slate-800 text-sm">
              Demandes en attente
            </h2>
            <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {requests.length}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {requests.map((req) => {
              const sender = req.userA;
              return (
                <div key={req.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar user={sender} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {sender?.prenom} {sender?.nom}
                    </p>
                    {sender?.filiere && (
                      <p className="text-xs text-slate-500">
                        {sender.filiere} · {sender.niveau}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => respondRequest(req.id, 'ACCEPTE')}
                      disabled={pendingActions.has(req.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 transition disabled:opacity-60"
                    >
                      <Check size={12} />
                      Accepter
                    </button>
                    <button
                      onClick={() => respondRequest(req.id, 'REFUSE')}
                      disabled={pendingActions.has(req.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-200 transition disabled:opacity-60"
                    >
                      <X size={12} />
                      Refuser
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <UserPlus size={16} className="text-blue-600" />
            <h2 className="font-semibold text-slate-800 text-sm">Personnes que vous connaissez peut-être</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:grid-flow-row">
            {suggestions.slice(0, 6).map((u) => (
              <div
                key={u.id}
                className="flex flex-col items-center text-center p-5 border-b sm:border-b-0 sm:border-r border-slate-100 last:border-r-0"
              >
                <Avatar user={u} size="lg" />
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {u.prenom} {u.nom}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {u.filiere ? `${u.filiere} · ${u.niveau}` : u.role}
                </p>
                <button
                  onClick={() => sendRequest(u.id)}
                  disabled={pendingActions.has(u.id)}
                  className="mt-3 flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-100 transition disabled:opacity-60"
                >
                  <UserPlus size={12} />
                  {pendingActions.has(u.id) ? 'Envoi…' : 'Ajouter'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Friends list */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
          <Users size={16} className="text-blue-600" />
          <h2 className="font-semibold text-slate-800 text-sm">
            Mes amis
          </h2>
          <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {friends.length}
          </span>
        </div>

        {friends.length > 4 && (
          <div className="px-5 pt-3 pb-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un ami…"
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-50">
          {filteredFriends.length === 0 ? (
            <Empty icon={Users} text="Aucun ami pour l'instant" />
          ) : (
            filteredFriends.map((f) => {
              const u = friendUser(f);
              if (!u) return null;
              return (
                <div key={f.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <Avatar user={u} size="md" online={Math.random() > 0.5} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {u.prenom} {u.nom}
                    </p>
                    <p className="text-xs text-slate-500">
                      {u.filiere ? `${u.filiere} · ${u.niveau}` : u.email}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {formatDate(f.createdAt)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB: ANNONCES
// ══════════════════════════════════════════════════════════════════════════════

interface CreateListingForm {
  titre: string;
  description: string;
  categorie: ListingCategory;
  prix: string;
}

const CATEGORIES: ListingCategory[] = [
  'LIVRES',
  'MATERIEL',
  'LOGEMENT',
  'COVOITURAGE',
  'COURS',
  'OBJETS_PERDUS',
];

const CATEGORY_LABELS: Record<ListingCategory, string> = {
  LIVRES: 'Livres',
  MATERIEL: 'Matériel',
  LOGEMENT: 'Logement',
  COVOITURAGE: 'Covoiturage',
  COURS: 'Cours',
  OBJETS_PERDUS: 'Objets perdus',
};

function AnnoncesTab({ currentUser }: { currentUser: User }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterCat, setFilterCat] = useState<ListingCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState<CreateListingForm>({
    titre: '',
    description: '',
    categorie: 'LIVRES',
    prix: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Listing[]>('/social/listings');
      setListings(res.data ?? []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const handleCreate = async () => {
    if (!form.titre.trim()) {
      setFormError('Le titre est requis');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const res = await api.post<Listing>('/social/listings', {
        titre: form.titre.trim(),
        description: form.description.trim(),
        categorie: form.categorie,
        prix: form.prix ? parseFloat(form.prix) : undefined,
      });
      setListings((prev) => [res.data, ...prev]);
      setShowCreate(false);
      setForm({ titre: '', description: '', categorie: 'LIVRES', prix: '' });
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = listings.filter((l) => {
    const matchCat = filterCat === 'ALL' || l.categorie === filterCat;
    const matchSearch =
      !searchQuery ||
      l.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une annonce…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition whitespace-nowrap"
        >
          <Plus size={16} />
          Nouvelle annonce
        </button>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCat('ALL')}
          className={`text-xs px-3 py-1.5 rounded-xl font-medium transition ${
            filterCat === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-400'
          }`}
        >
          Tout
        </button>
        {CATEGORIES.map((cat) => {
          const Icon = categoryIcon(cat);
          return (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium transition ${
                filterCat === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-400'
              }`}
            >
              <Icon size={11} />
              {CATEGORY_LABELS[cat]}
            </button>
          );
        })}
      </div>

      {/* Listings grid */}
      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Empty icon={ShoppingBag} text="Aucune annonce trouvée" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              currentUserId={currentUser.id}
            />
          ))}
        </div>
      )}

      {/* Create listing modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Créer une annonce</h3>
              <button
                onClick={() => { setShowCreate(false); setFormError(''); }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <AlertCircle size={13} />
                  {formError}
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.titre}
                  onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  placeholder="Ex: Vente cours de Maths L2"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Catégorie</label>
                <select
                  value={form.categorie}
                  onChange={(e) => setForm({ ...form, categorie: e.target.value as ListingCategory })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Décrivez votre annonce…"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Prix (FCFA, optionnel)</label>
                <input
                  type="number"
                  value={form.prix}
                  onChange={(e) => setForm({ ...form, prix: e.target.value })}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100">
              <button
                onClick={() => { setShowCreate(false); setFormError(''); }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60"
              >
                <Plus size={14} />
                {submitting ? 'Publication…' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ListingCard({ listing, currentUserId }: { listing: Listing; currentUserId: string }) {
  const Icon = categoryIcon(listing.categorie as ListingCategory);
  const catColor = categoryColor(listing.categorie as ListingCategory);
  const isExpired = listing.expiresAt && new Date(listing.expiresAt) < new Date();

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col ${isExpired ? 'opacity-60' : ''}`}>
      {listing.imageUrl ? (
        <img src={listing.imageUrl} alt={listing.titre} className="w-full h-36 object-cover" />
      ) : (
        <div className={`w-full h-28 flex items-center justify-center ${catColor.replace('text-', 'bg-').split(' ')[0]} bg-opacity-20`}>
          <Icon size={36} className="opacity-40" />
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${catColor}`}>
            <Icon size={11} />
            {CATEGORY_LABELS[listing.categorie as ListingCategory] ?? listing.categorie}
          </span>
          {isExpired && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Expiré</span>
          )}
        </div>
        <h3 className="text-sm font-bold text-slate-800 leading-tight mb-1">{listing.titre}</h3>
        {listing.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-2 leading-relaxed">
            {listing.description}
          </p>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar user={listing.vendeur} size="xs" />
            <span className="text-xs text-slate-600 font-medium">
              {listing.vendeur?.prenom} {listing.vendeur?.nom}
            </span>
          </div>
          <div className="text-right">
            {listing.prix != null ? (
              <p className="text-sm font-bold text-blue-700">
                {listing.prix.toLocaleString('fr-FR')} F
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">Gratuit</p>
            )}
            <p className="text-xs text-slate-400">{formatDate(listing.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

const TABS: { id: TabId; label: string; icon: typeof UserIcon }[] = [
  { id: 'profil', label: 'Mon Profil', icon: UserIcon },
  { id: 'amis', label: 'Amis', icon: Users },
  { id: 'annonces', label: 'Annonces Marchands', icon: ShoppingBag },
];

export default function SocialPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('profil');

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <AlertCircle size={20} className="mr-2" />
        Vous devez être connecté pour accéder à cette page.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
          <Users size={18} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Réseau Social EMIT</h1>
          <p className="text-xs text-slate-500">Connectez-vous avec vos camarades</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap flex-shrink-0 ${
              activeTab === id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profil' && <ProfilTab currentUser={user} />}
      {activeTab === 'amis' && <AmisTab currentUser={user} />}
      {activeTab === 'annonces' && <AnnoncesTab currentUser={user} />}
    </div>
  );
}

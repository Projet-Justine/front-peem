import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
  Users, MessageSquare, Video, FolderOpen, BookOpen,
  BarChart3, Bell, TrendingUp, Clock, CheckCircle, AlertTriangle
} from 'lucide-react';
import type { Group, Post, Meeting, UE } from '../types';

interface DashboardStats {
  groups: Group[];
  recentPosts: Post[];
  upcomingMeetings: Meeting[];
  myUEs: UE[];
}

function StatCard({
  icon: Icon, label, value, color, to
}: { icon: any; label: string; value: string | number; color: string; to: string }) {
  return (
    <Link to={to} className="bg-white rounded-xl p-5 border border-slate-100 hover:shadow-md transition-all group">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </Link>
  );
}

function PostCard({ post }: { post: Post }) {
  const typeColors: Record<string, string> = {
    ANNONCE: 'bg-blue-100 text-blue-700',
    URGENT: 'bg-red-100 text-red-700',
    EVENEMENT: 'bg-purple-100 text-purple-700',
    RESULTAT: 'bg-green-100 text-green-700',
    INFORMATION: 'bg-slate-100 text-slate-700',
  };
  return (
    <div className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {post.auteur?.prenom?.[0]}{post.auteur?.nom?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[post.type] || 'bg-slate-100 text-slate-600'}`}>
              {post.type}
            </span>
            {post.epingle && <span className="text-xs text-amber-600">📌</span>}
          </div>
          <p className="text-sm font-medium text-slate-800 truncate">{post.titre}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            par {post.auteur?.prenom} {post.auteur?.nom} · {new Date(post.createdAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardStats>({ groups: [], recentPosts: [], upcomingMeetings: [], myUEs: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [groupsRes, postsRes, meetingsRes, uesRes] = await Promise.allSettled([
          api.get(`/groups?userId=${user?.id}`),
          api.get('/posts/feed?tab=officiel'),
          api.get('/meetings'),
          api.get(`/academic/ue?filiere=${user?.filiere}&niveau=${user?.niveau}`),
        ]);
        setData({
          groups: groupsRes.status === 'fulfilled' ? groupsRes.value.data?.slice(0, 5) || [] : [],
          recentPosts: postsRes.status === 'fulfilled' ? postsRes.value.data?.slice(0, 5) || [] : [],
          upcomingMeetings: meetingsRes.status === 'fulfilled' ? meetingsRes.value.data?.slice(0, 3) || [] : [],
          myUEs: uesRes.status === 'fulfilled' ? uesRes.value.data?.slice(0, 4) || [] : [],
        });
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-slate-200 rounded-lg w-64 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-200 rounded-xl h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <h1 className="text-xl md:text-2xl font-bold">
          {greeting()}, {user?.prenom} ! 👋
        </h1>
        <p className="text-blue-100 text-sm mt-1">
          {user?.filiere && user?.niveau
            ? `${user.filiere} · ${user.niveau} · Promotion ${user.promotion}`
            : 'Bienvenue sur la plateforme EMIT'}
        </p>
        <div className="flex items-center gap-3 mt-4">
          <span className="bg-white/20 backdrop-blur rounded-lg px-3 py-1 text-xs font-medium">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Mes groupes" value={data.groups.length} color="bg-blue-500" to="/groups" />
        <StatCard icon={BookOpen} label="Mes UE" value={data.myUEs.length} color="bg-purple-500" to="/academic" />
        <StatCard icon={Video} label="Réunions" value={data.upcomingMeetings.length} color="bg-green-500" to="/meetings" />
        <StatCard icon={Bell} label="Publications" value={data.recentPosts.length} color="bg-amber-500" to="/feed" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent posts */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-blue-600" />
              <h2 className="font-semibold text-slate-800">Fil d'actualité</h2>
            </div>
            <Link to="/feed" className="text-xs text-blue-600 hover:text-blue-700 font-medium">Voir tout →</Link>
          </div>
          <div>
            {data.recentPosts.length > 0 ? (
              data.recentPosts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="p-8 text-center text-slate-400">
                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune publication récente</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Upcoming meetings */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Video size={15} className="text-green-600" />
                <h3 className="font-semibold text-slate-800 text-sm">Réunions</h3>
              </div>
              <Link to="/meetings" className="text-xs text-blue-600 hover:text-blue-700">Voir tout →</Link>
            </div>
            <div className="p-3 space-y-2">
              {data.upcomingMeetings.length > 0 ? (
                data.upcomingMeetings.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Video size={14} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{m.titre}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(m.dateDebut).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${m.statut === 'EN_COURS' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                      {m.statut === 'EN_COURS' ? '🔴 Live' : m.statut}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Aucune réunion prévue</p>
              )}
            </div>
          </div>

          {/* My groups */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-blue-600" />
                <h3 className="font-semibold text-slate-800 text-sm">Mes groupes</h3>
              </div>
              <Link to="/groups" className="text-xs text-blue-600 hover:text-blue-700">Voir tout →</Link>
            </div>
            <div className="p-3 space-y-1">
              {data.groups.slice(0, 4).length > 0 ? (
                data.groups.slice(0, 4).map(g => (
                  <Link key={g.id} to={`/groups/${g.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      {g.nom[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{g.nom}</p>
                      <p className="text-xs text-slate-400">{g.members?.length || 0} membres</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Aucun groupe rejoint</p>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Actions rapides</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Nouveau message', icon: MessageSquare, to: '/chat', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                { label: 'Démarrer Meet', icon: Video, to: '/meetings', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
                { label: 'Mes notes', icon: BarChart3, to: '/grades', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
                { label: 'Fichiers', icon: FolderOpen, to: '/files', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
              ].map(({ label, icon: Icon, to, color }) => (
                <Link key={to} to={to}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg text-xs font-medium transition-colors ${color}`}>
                  <Icon size={18} />
                  <span className="text-center leading-tight">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

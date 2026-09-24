import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
  Users, MessageSquare, FolderOpen, Video, Settings, ArrowLeft,
  Share2, Shield, UserPlus, FileText, CheckCircle
} from 'lucide-react';
import type { Group, Channel, FileItem, Meeting } from '../types';

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<'channels' | 'files' | 'meetings' | 'members'>('channels');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGroup = async () => {
      try {
        const res = await api.get(`/groups/${id}`);
        setGroup(res.data);
      } catch (err) {
        console.error('Error fetching group detail:', err);
      } finally {
        setLoading(false);
      }
    };
    loadGroup();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="h-40 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p>Groupe non trouvé</p>
        <Link to="/groups" className="text-blue-600 hover:underline mt-2 inline-block">
          Retour aux groupes
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <Link to="/groups" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft size={14} /> Retour à la liste
      </Link>

      {/* Group Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-2xl p-6 md:p-8 text-white relative shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur px-2.5 py-1 rounded-full">
              {group.type}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold mt-2">{group.nom}</h1>
            <p className="text-blue-100 text-sm mt-1 max-w-2xl">{group.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur transition-colors flex items-center gap-1.5">
              <Share2 size={14} /> Inviter
            </button>
            <Link
              to="/meetings"
              className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Video size={14} /> Démarrer Meet
            </Link>
          </div>
        </div>

        {/* Quick meta bar */}
        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-white/10 text-xs text-blue-100">
          <span className="flex items-center gap-1.5">
            <Users size={14} /> {group.members?.length || 0} membres
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare size={14} /> {group.channels?.length || 0} canaux
          </span>
          <span className="flex items-center gap-1.5">
            <Shield size={14} /> Adhésion {group.modeAdhesion}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { key: 'channels', label: 'Canaux de discussion', icon: MessageSquare },
          { key: 'files', label: 'Espace Fichiers', icon: FolderOpen },
          { key: 'meetings', label: 'Réunions', icon: Video },
          { key: 'members', label: 'Membres', icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 min-h-[300px]">
        {activeTab === 'channels' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Canaux du groupe</h3>
              <Link to="/chat" className="text-xs text-blue-600 font-semibold hover:underline">
                Ouvrir dans le Chat →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(group.channels || []).map(ch => (
                <Link
                  key={ch.id}
                  to="/chat"
                  className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      #
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-xs">{ch.nom}</p>
                      <p className="text-[11px] text-slate-400">{ch.description || 'Canal de discussion'}</p>
                    </div>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">Rejoindre</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Liste des membres ({group.members?.length || 0})</h3>
            <div className="divide-y divide-slate-100">
              {(group.members || []).map(m => (
                <div key={m.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">
                      {m.user?.prenom?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {m.user?.prenom} {m.user?.nom}
                      </p>
                      <p className="text-[10px] text-slate-400">{m.user?.email}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    m.role === 'PROPRIETAIRE'
                      ? 'bg-amber-100 text-amber-700'
                      : m.role === 'MODERATEUR'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Fichiers partagés</h3>
              <Link to="/files" className="text-xs text-blue-600 font-semibold hover:underline">
                Gestionnaire complet →
              </Link>
            </div>
            <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
              <FolderOpen size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Consultez l'espace Fichiers pour accéder aux dossiers et supports du groupe</p>
            </div>
          </div>
        )}

        {activeTab === 'meetings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Sessions de visioconférence</h3>
              <Link to="/meetings" className="text-xs text-blue-600 font-semibold hover:underline">
                Planifier une session →
              </Link>
            </div>
            <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
              <Video size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Utilisez le bouton "Démarrer Meet" en haut pour lancer une réunion instantanée</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

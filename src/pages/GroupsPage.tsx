import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
  Users, Plus, Search, Filter, Lock, Globe, Shield, BookOpen,
  Briefcase, MessageSquare, FolderOpen, Video
} from 'lucide-react';
import type { Group } from '../types';

const GROUP_TYPES = [
  { value: 'ALL', label: 'Tous' },
  { value: 'CLASSE_OFFICIELLE', label: 'Classes', icon: BookOpen },
  { value: 'MATIERE_UE', label: 'Matières & UE', icon: BookOpen },
  { value: 'PROJET', label: 'Projets', icon: Briefcase },
  { value: 'CLUB', label: 'Clubs', icon: Users },
  { value: 'PRIVE', label: 'Privés', icon: Lock },
];

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    nom: '',
    description: '',
    type: 'PROJET',
    modeAdhesion: 'OUVERT',
  });

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/groups');
      setGroups(res.data || []);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/groups', newGroup);
      setShowModal(false);
      setNewGroup({ nom: '', description: '', type: 'PROJET', modeAdhesion: 'OUVERT' });
      loadGroups();
    } catch (err) {
      console.error('Error creating group:', err);
    }
  };

  const handleJoin = async (groupId: string) => {
    try {
      await api.post(`/groups/${groupId}/join`);
      loadGroups();
    } catch (err) {
      console.error('Error joining group:', err);
    }
  };

  const filteredGroups = groups.filter(g => {
    const matchesType = selectedType === 'ALL' || g.type === selectedType;
    const matchesSearch = g.nom.toLowerCase().includes(search.toLowerCase()) ||
                          g.description?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const typeBadges: Record<string, { label: string; color: string }> = {
    CLASSE_OFFICIELLE: { label: 'Classe Officielle', color: 'bg-blue-100 text-blue-700' },
    MATIERE_UE: { label: 'Matière / UE', color: 'bg-purple-100 text-purple-700' },
    PROJET: { label: 'Projet', color: 'bg-amber-100 text-amber-700' },
    CLUB: { label: 'Club / Asso', color: 'bg-emerald-100 text-emerald-700' },
    PRIVE: { label: 'Groupe Privé', color: 'bg-slate-100 text-slate-700' },
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Espaces & Groupes</h1>
          <p className="text-sm text-slate-500">Classes, projets d'équipe, clubs et matières</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors"
        >
          <Plus size={16} />
          Créer un groupe
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Type pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {GROUP_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedType === t.value
                  ? 'bg-slate-800 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Group Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
          <Users size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-700">Aucun groupe trouvé</p>
          <p className="text-xs mt-1">Créez le premier groupe ou changez vos filtres</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map(group => {
            const isMember = group.members?.some(m => m.userId === user?.id);
            const badge = typeBadges[group.type] || { label: group.type, color: 'bg-slate-100 text-slate-600' };

            return (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Users size={12} />
                      {group.members?.length || 0}
                    </span>
                  </div>

                  <Link to={`/groups/${group.id}`} className="block">
                    <h3 className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors line-clamp-1">
                      {group.nom}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {group.description || 'Aucune description disponible.'}
                    </p>
                  </Link>
                </div>

                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                      {group.proprietaire?.prenom?.[0] || 'A'}
                    </div>
                    <span className="text-xs text-slate-500 truncate max-w-[120px]">
                      {group.proprietaire ? `${group.proprietaire.prenom} ${group.proprietaire.nom}` : 'Admin'}
                    </span>
                  </div>

                  {isMember ? (
                    <Link
                      to={`/groups/${group.id}`}
                      className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
                    >
                      Ouvrir
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleJoin(group.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Rejoindre
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Créer un nouveau groupe</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nom du groupe</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Projet Mobile M2"
                  value={newGroup.nom}
                  onChange={e => setNewGroup({ ...newGroup, nom: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Objectif du groupe..."
                  value={newGroup.description}
                  onChange={e => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={newGroup.type}
                    onChange={e => setNewGroup({ ...newGroup, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PROJET">Projet</option>
                    <option value="CLUB">Club</option>
                    <option value="PRIVE">Privé</option>
                    {['ADMIN', 'ENSEIGNANT'].includes(user?.role || '') && (
                      <>
                        <option value="CLASSE_OFFICIELLE">Classe</option>
                        <option value="MATIERE_UE">Matière / UE</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Adhésion</label>
                  <select
                    value={newGroup.modeAdhesion}
                    onChange={e => setNewGroup({ ...newGroup, modeAdhesion: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="OUVERT">Ouvert</option>
                    <option value="INVITATION">Sur invitation</option>
                    <option value="CODE">Par code</option>
                    <option value="DEMANDE">Sur demande</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

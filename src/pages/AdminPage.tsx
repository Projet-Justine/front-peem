import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
  Shield, Users, BookOpen, Newspaper, BarChart2, CheckCircle,
  XCircle, Search, Filter, AlertTriangle, Plus, Upload, Trash2
} from 'lucide-react';
import type { User, Group, Post } from '../types';

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'stats'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Access check
  if (!['ADMIN', 'SCOLARITE', 'RESPONSABLE_FILIERE'].includes(user?.role || '')) {
    return (
      <div className="p-12 text-center text-slate-500">
        <Shield size={48} className="mx-auto mb-3 text-red-500 opacity-50" />
        <h2 className="text-lg font-bold text-slate-800">Accès Refusé</h2>
        <p className="text-xs text-slate-500 mt-1">Vous n'avez pas les autorisations nécessaires pour accéder à cet espace d'administration.</p>
      </div>
    );
  }

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, gRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/groups'),
      ]);
      setUsers(uRes.data || []);
      setGroups(gRes.data || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = users.filter(u =>
    `${u.nom} ${u.prenom} ${u.email} ${u.matricule || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield size={24} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-800">Espace Administration & Scolarité</h1>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Gestion des comptes, des groupes et des quotas de la plateforme</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { key: 'users', label: 'Gestion des Utilisateurs', icon: Users },
          { key: 'groups', label: 'Groupes & Classes', icon: BookOpen },
          { key: 'stats', label: 'Statistiques Globales', icon: BarChart2 },
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

      {/* Tab Content */}
      {loading ? (
        <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
      ) : activeTab === 'users' ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          {/* Search bar */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, matricule..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">{filteredUsers.length} utilisateurs</span>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Utilisateur</th>
                  <th className="px-5 py-3">Matricule</th>
                  <th className="px-5 py-3">Rôle</th>
                  <th className="px-5 py-3">Filière & Niveau</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                          {u.prenom?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{u.prenom} {u.nom}</p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-slate-600">
                      {u.matricule || 'N/A'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {u.filiere ? `${u.filiere} (${u.niveau || '-'})` : '-'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle size={12} /> Actif
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button className="text-slate-400 hover:text-red-600 p-1">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'groups' ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Tous les groupes ({groups.length})</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {groups.map(g => (
              <div key={g.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-xs">{g.nom}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
                      {g.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Propriétaire: {g.proprietaire?.prenom} {g.proprietaire?.nom} · {g.members?.length || 0} membres
                  </p>
                </div>
                <button className="text-xs text-red-600 hover:underline font-semibold">
                  Archiver
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100">
            <p className="text-slate-500 text-xs">Total Utilisateurs</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{users.length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100">
            <p className="text-slate-500 text-xs">Total Groupes</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{groups.length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100">
            <p className="text-slate-500 text-xs">Disponibilité Système</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">99.9%</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100">
            <p className="text-slate-500 text-xs">Quota Stockage</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">12.4 Go / 100 Go</p>
          </div>
        </div>
      )}
    </div>
  );
}

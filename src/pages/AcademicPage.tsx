import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
  BookOpen, Plus, Search, Filter, ChevronDown, ChevronUp,
  Award, Clock, CheckCircle, UserCheck, Shield
} from 'lucide-react';
import type { UE } from '../types';

export default function AcademicPage() {
  const { user } = useAuth();
  const [ues, setUes] = useState<UE[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUE, setExpandedUE] = useState<string | null>(null);

  // Filters
  const [filiere, setFiliere] = useState(user?.filiere || '');
  const [niveau, setNiveau] = useState(user?.niveau || '');
  const [semestre, setSemestre] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newUE, setNewUE] = useState({
    code: '',
    intitule: '',
    credits: 6,
    coefficient: 3,
    semestre: 'S1',
    filiere: 'Informatique',
    niveau: 'L1',
  });

  const loadUEs = async () => {
    setLoading(true);
    try {
      let url = '/academic/ue?';
      if (filiere) url += `filiere=${filiere}&`;
      if (niveau) url += `niveau=${niveau}&`;
      if (semestre) url += `semestre=${semestre}&`;
      const res = await api.get(url);
      setUes(res.data || []);
    } catch (err) {
      console.error('Error fetching UEs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUEs();
  }, [filiere, niveau, semestre]);

  const handleCreateUE = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/academic/ue', newUE);
      setShowCreateModal(false);
      setNewUE({ code: '', intitule: '', credits: 6, coefficient: 3, semestre: 'S1', filiere: 'Informatique', niveau: 'L1' });
      loadUEs();
    } catch (err) {
      console.error('Error creating UE:', err);
    }
  };

  const handleEnroll = async (ueId: string) => {
    try {
      await api.post(`/academic/ue/${ueId}/enroll`);
      loadUEs();
    } catch (err) {
      console.error('Error enrolling in UE:', err);
    }
  };

  const statusColors: Record<string, { label: string; color: string }> = {
    BROUILLON: { label: 'Brouillon', color: 'bg-slate-100 text-slate-700' },
    PUBLIEE: { label: 'Publiée', color: 'bg-blue-100 text-blue-700' },
    EN_COURS: { label: 'En cours', color: 'bg-emerald-100 text-emerald-700' },
    TERMINEE: { label: 'Terminée', color: 'bg-amber-100 text-amber-700' },
    ARCHIVEE: { label: 'Archivée', color: 'bg-red-100 text-red-700' },
  };

  const isAdmin = ['ADMIN', 'SCOLARITE'].includes(user?.role || '');

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Unités d'Enseignement (UE)</h1>
          <p className="text-sm text-slate-500">Organisation académique, crédits ECTS et matières associées</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors"
          >
            <Plus size={16} />
            Créer une UE
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Filière</label>
          <select
            value={filiere}
            onChange={e => setFiliere(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Toutes les filières</option>
            <option value="Informatique">Informatique</option>
            <option value="Électronique">Électronique</option>
            <option value="Gestion">Gestion</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Niveau</label>
          <select
            value={niveau}
            onChange={e => setNiveau(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Tous les niveaux</option>
            {['L1', 'L2', 'L3', 'M1', 'M2'].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Semestre</label>
          <select
            value={semestre}
            onChange={e => setSemestre(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Tous les semestres</option>
            {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* UE List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : ues.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
          <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-700">Aucune unité d'enseignement trouvée</p>
          <p className="text-xs mt-1">Modifiez vos critères de recherche ou ajoutez des UE</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ues.map(ue => {
            const isExpanded = expandedUE === ue.id;
            const badge = statusColors[ue.statut] || { label: ue.statut, color: 'bg-slate-100 text-slate-600' };

            return (
              <div
                key={ue.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden transition-all"
              >
                <div
                  onClick={() => setExpandedUE(isExpanded ? null : ue.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center text-white flex-shrink-0">
                      <span className="text-[10px] font-bold uppercase">{ue.semestre}</span>
                      <span className="text-xs font-black">{ue.code}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {ue.filiere} · {ue.niveau}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-base">{ue.intitule}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Responsable: {ue.responsable ? `${ue.responsable.prenom} ${ue.responsable.nom}` : 'Non assigné'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-end md:self-center">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-800">{ue.credits} Crédits ECTS</p>
                      <p className="text-[11px] text-slate-400">Coef. {ue.coefficient}</p>
                    </div>
                    {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-4">
                    <div>
                      <h4 className="font-semibold text-xs text-slate-700 uppercase tracking-wider mb-2">
                        Éléments Constitutifs (Matières / EC)
                      </h4>
                      {ue.elementsConstitutifs && ue.elementsConstitutifs.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {ue.elementsConstitutifs.map(ec => (
                            <div key={ec.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-xs text-slate-800">{ec.intitule}</p>
                                <p className="text-[11px] text-slate-400">
                                  Enseignant: {ec.enseignant ? `${ec.enseignant.prenom} ${ec.enseignant.nom}` : 'N/A'}
                                </p>
                              </div>
                              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                Coef {ec.coefficient}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Aucune matière enregistrée pour cette UE</p>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleEnroll(ue.id)}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
                      >
                        S'inscrire à l'UE
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal create UE */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Ajouter une Unité d'Enseignement</h3>
            <form onSubmit={handleCreateUE} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Code UE</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: INF301"
                    value={newUE.code}
                    onChange={e => setNewUE({ ...newUE, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Semestre</label>
                  <select
                    value={newUE.semestre}
                    onChange={e => setNewUE({ ...newUE, semestre: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Intitulé de l'UE</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Conception et Modélisation Avancée"
                  value={newUE.intitule}
                  onChange={e => setNewUE({ ...newUE, intitule: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Crédits ECTS</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={newUE.credits}
                    onChange={e => setNewUE({ ...newUE, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Coefficient</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newUE.coefficient}
                    onChange={e => setNewUE({ ...newUE, coefficient: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Filière</label>
                  <select
                    value={newUE.filiere}
                    onChange={e => setNewUE({ ...newUE, filiere: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Informatique">Informatique</option>
                    <option value="Électronique">Électronique</option>
                    <option value="Gestion">Gestion</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Niveau</label>
                  <select
                    value={newUE.niveau}
                    onChange={e => setNewUE({ ...newUE, niveau: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['L1', 'L2', 'L3', 'M1', 'M2'].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
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
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

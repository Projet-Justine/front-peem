import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Lock,
  FileText,
  Download,
  MessageSquareWarning,
  X,
  Send,
  Plus,
  Save,
  RefreshCw,
  Eye,
  Shield,
  GraduationCap,
  BarChart3,
  Loader2,
  Info,
  Check,
  Ban,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import type { UE, Evaluation, Grade, ResultatUE, Claim, User } from '../types';

// ─── Local extended types ──────────────────────────────────────────────────────

interface StudentResult {
  ue: UE;
  evaluations: Array<{
    evaluation: Evaluation;
    grade: Grade | null;
  }>;
  moyenne: number | null;
  resultat?: ResultatUE;
}

interface TeacherEvaluation extends Evaluation {
  grades: Grade[];
  students: User[];
}

interface GradeEntryRow {
  etudiantId: string;
  etudiant: User;
  valeur: string; // string for controlled input
  gradeId?: string;
}

type GradeStatut =
  | 'BROUILLON'
  | 'SOUMIS'
  | 'VALIDE'
  | 'PUBLIE'
  | 'VERROUILLE';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function statutColor(statut: string): string {
  switch (statut) {
    case 'BROUILLON':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
    case 'SOUMIS':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    case 'VALIDE':
      return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
    case 'PUBLIE':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
    case 'VERROUILLE':
      return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-500';
  }
}

function statutIcon(statut: string) {
  switch (statut) {
    case 'BROUILLON':
      return <FileText size={13} />;
    case 'SOUMIS':
      return <Clock size={13} />;
    case 'VALIDE':
      return <CheckCircle2 size={13} />;
    case 'PUBLIE':
      return <Eye size={13} />;
    case 'VERROUILLE':
      return <Lock size={13} />;
    default:
      return <Info size={13} />;
  }
}

function StatutBadge({ statut }: { statut: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statutColor(statut)}`}
    >
      {statutIcon(statut)}
      {statut}
    </span>
  );
}

function gradeColor(val: number): string {
  if (val >= 16) return 'text-green-600 dark:text-green-400 font-bold';
  if (val >= 12) return 'text-blue-600 dark:text-blue-400 font-semibold';
  if (val >= 10) return 'text-yellow-600 dark:text-yellow-400 font-semibold';
  return 'text-red-600 dark:text-red-400 font-bold';
}

function computeAverage(
  evals: Array<{ evaluation: Evaluation; grade: Grade | null }>
): number | null {
  const graded = evals.filter(
    (e) => e.grade?.valeur !== undefined && e.grade.valeur !== null
  );
  if (graded.length === 0) return null;
  const totalWeight = graded.reduce((s, e) => s + e.evaluation.ponderation, 0);
  if (totalWeight === 0) return null;
  const weighted = graded.reduce(
    (s, e) => s + (e.grade!.valeur! * e.evaluation.ponderation) / 100,
    0
  );
  // Re-normalise to 20
  return (weighted / totalWeight) * 100;
}

// ─── Claim Modal ───────────────────────────────────────────────────────────────

interface ClaimModalProps {
  grade: Grade;
  evalLabel: string;
  onClose: () => void;
  onSubmitted: () => void;
}

function ClaimModal({ grade, evalLabel, onClose, onSubmitted }: ClaimModalProps) {
  const [motif, setMotif] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!motif.trim()) {
      setError('Le motif est requis.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/grades/claims', { gradeId: grade.id, motif: motif.trim() });
      setSuccess(true);
      setTimeout(() => {
        onSubmitted();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? 'Erreur lors de la soumission de la réclamation.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <MessageSquareWarning size={20} />
            <h2 className="text-base font-semibold">Soumettre une réclamation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-sm">
            <p className="text-orange-800 dark:text-orange-300 font-medium">{evalLabel}</p>
            <p className="text-orange-600 dark:text-orange-400 mt-0.5">
              Note obtenue :{' '}
              <span className="font-bold">
                {grade.valeur !== undefined && grade.valeur !== null
                  ? `${grade.valeur}/20`
                  : 'Non noté'}
              </span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Motif de la réclamation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={4}
              placeholder="Expliquez le motif de votre réclamation…"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
              <CheckCircle2 size={14} />
              Réclamation soumise avec succès !
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || success}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-xl hover:bg-orange-600 disabled:opacity-60 transition-colors"
            >
              {submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              Soumettre
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Student View ──────────────────────────────────────────────────────────────

function StudentGradesView() {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUEs, setExpandedUEs] = useState<Set<string>>(new Set());
  const [claimTarget, setClaimTarget] = useState<{
    grade: Grade;
    label: string;
  } | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/grades/me/results');
      // Backend may return different shapes – normalise here
      const raw: any[] = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      const normalised: StudentResult[] = raw.map((item: any) => {
        const ue: UE = item.ue ?? item;
        const evals: Array<{ evaluation: Evaluation; grade: Grade | null }> =
          Array.isArray(item.evaluations)
            ? item.evaluations
            : Array.isArray(ue.evaluations)
            ? ue.evaluations.map((ev: Evaluation) => ({
                evaluation: ev,
                grade: Array.isArray(ev.grades) ? (ev.grades[0] ?? null) : null,
              }))
            : [];

        const moyenne =
          item.moyenne !== undefined ? item.moyenne : computeAverage(evals);

        return { ue, evaluations: evals, moyenne, resultat: item.resultat };
      });

      setResults(normalised);
      // Expand all by default
      setExpandedUEs(new Set(normalised.map((r) => r.ue.id)));
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? 'Impossible de charger vos notes.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  function toggleUE(ueId: string) {
    setExpandedUEs((prev) => {
      const next = new Set(prev);
      next.has(ueId) ? next.delete(ueId) : next.add(ueId);
      return next;
    });
  }

  async function handleDownloadPdf() {
    setDownloadingPdf(true);
    try {
      const res = await api.get('/grades/me/transcript', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'releve_de_notes.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab using the token
      window.open(
        `${api.defaults.baseURL}/grades/me/transcript?token=${localStorage.getItem('emit_token')}`,
        '_blank'
      );
    } finally {
      setDownloadingPdf(false);
    }
  }

  // Global stats
  const globalAvg = useMemo(() => {
    const withAvg = results.filter((r) => r.moyenne !== null);
    if (withAvg.length === 0) return null;
    const totalCredits = withAvg.reduce((s, r) => s + (r.ue.credits ?? 0), 0);
    if (totalCredits === 0) return null;
    return (
      withAvg.reduce((s, r) => s + r.moyenne! * (r.ue.credits ?? 0), 0) /
      totalCredits
    );
  }, [results]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-500">
        <Loader2 size={36} className="animate-spin text-indigo-500" />
        <p>Chargement de vos notes…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchResults}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 text-sm"
        >
          <RefreshCw size={14} /> Réessayer
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Summary bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              UEs suivies
            </p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {results.length}
            </p>
          </div>
          {globalAvg !== null && (
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Moyenne générale
              </p>
              <p className={`text-2xl font-bold ${gradeColor(globalAvg)}`}>
                {globalAvg.toFixed(2)}/20
              </p>
            </div>
          )}
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm disabled:opacity-60 transition-colors"
        >
          {downloadingPdf ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Download size={15} />
          )}
          Télécharger le relevé (PDF)
        </button>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <GraduationCap size={48} className="mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">Aucune note disponible pour le moment.</p>
          <p className="text-sm mt-1">Vos notes apparaîtront ici une fois publiées.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map(({ ue, evaluations, moyenne, resultat }) => (
            <div
              key={ue.id}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
              {/* UE header */}
              <button
                onClick={() => toggleUE(ue.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                    <BookOpen size={18} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {ue.code} – {ue.intitule}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {ue.credits} crédits · {ue.semestre} · {ue.filiere}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {resultat && (
                    <StatutBadge statut={resultat.decision === 'ADMIS' ? 'VALIDE' : 'SOUMIS'} />
                  )}
                  {moyenne !== null ? (
                    <span className={`text-xl font-bold ${gradeColor(moyenne)}`}>
                      {moyenne.toFixed(2)}/20
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400 italic">En attente</span>
                  )}
                  {expandedUEs.has(ue.id) ? (
                    <ChevronUp size={18} className="text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-400 shrink-0" />
                  )}
                </div>
              </button>

              {/* Grades table */}
              {expandedUEs.has(ue.id) && (
                <div className="border-t border-gray-100 dark:border-gray-800 overflow-x-auto">
                  {evaluations.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-5">
                      Aucune évaluation enregistrée pour cette UE.
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/60">
                          <th className="px-5 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                            Type d'évaluation
                          </th>
                          <th className="px-5 py-3 text-center font-medium text-gray-600 dark:text-gray-400">
                            Session
                          </th>
                          <th className="px-5 py-3 text-center font-medium text-gray-600 dark:text-gray-400">
                            Pondération
                          </th>
                          <th className="px-5 py-3 text-center font-medium text-gray-600 dark:text-gray-400">
                            Note /20
                          </th>
                          <th className="px-5 py-3 text-center font-medium text-gray-600 dark:text-gray-400">
                            Statut
                          </th>
                          <th className="px-5 py-3 text-center font-medium text-gray-600 dark:text-gray-400">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {evaluations.map(({ evaluation, grade }) => (
                          <tr
                            key={evaluation.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                          >
                            <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">
                              {evaluation.type}
                            </td>
                            <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">
                              {evaluation.session}
                            </td>
                            <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">
                              {evaluation.ponderation}%
                            </td>
                            <td className="px-5 py-3 text-center">
                              {grade?.valeur !== undefined && grade.valeur !== null ? (
                                <span className={`text-base ${gradeColor(grade.valeur)}`}>
                                  {grade.valeur.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic text-xs">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-center">
                              {grade ? (
                                <StatutBadge statut={grade.statutPublication ?? grade.statut} />
                              ) : (
                                <StatutBadge statut="BROUILLON" />
                              )}
                            </td>
                            <td className="px-5 py-3 text-center">
                              {grade &&
                              grade.valeur !== undefined &&
                              grade.valeur !== null &&
                              grade.statutPublication === 'PUBLIE' ? (
                                <button
                                  onClick={() =>
                                    setClaimTarget({
                                      grade,
                                      label: `${ue.code} – ${evaluation.type}`,
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                                >
                                  <MessageSquareWarning size={12} />
                                  Réclamation
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {/* UE average row */}
                      {moyenne !== null && (
                        <tfoot>
                          <tr className="bg-indigo-50 dark:bg-indigo-900/20">
                            <td
                              colSpan={3}
                              className="px-5 py-3 font-semibold text-indigo-700 dark:text-indigo-300 text-sm"
                            >
                              Moyenne de l'UE
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className={`text-base font-bold ${gradeColor(moyenne)}`}>
                                {moyenne.toFixed(2)}/20
                              </span>
                            </td>
                            <td className="px-5 py-3 text-center">
                              {resultat && (
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                                    resultat.decision === 'ADMIS'
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                  }`}
                                >
                                  {resultat.decision}
                                </span>
                              )}
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Claim modal */}
      {claimTarget && (
        <ClaimModal
          grade={claimTarget.grade}
          evalLabel={claimTarget.label}
          onClose={() => setClaimTarget(null)}
          onSubmitted={fetchResults}
        />
      )}
    </>
  );
}

// ─── Teacher View ──────────────────────────────────────────────────────────────

interface GradeEntryPanelProps {
  evaluation: TeacherEvaluation;
  onSaved: () => void;
}

function GradeEntryPanel({ evaluation, onSaved }: GradeEntryPanelProps) {
  const [rows, setRows] = useState<GradeEntryRow[]>(() =>
    (evaluation.students ?? []).map((student) => {
      const existing = evaluation.grades?.find(
        (g) => g.etudiantId === student.id
      );
      return {
        etudiantId: student.id,
        etudiant: student,
        valeur: existing?.valeur !== undefined && existing.valeur !== null ? String(existing.valeur) : '',
        gradeId: existing?.id,
      };
    })
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  function updateRow(idx: number, val: string) {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], valeur: val };
      return next;
    });
  }

  async function handleSave() {
    // Validate
    for (const row of rows) {
      if (row.valeur === '') continue;
      const n = parseFloat(row.valeur);
      if (isNaN(n) || n < 0 || n > 20) {
        setError('Les notes doivent être comprises entre 0 et 20.');
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const payload = rows
        .filter((r) => r.valeur !== '')
        .map((r) => ({
          evaluationId: evaluation.id,
          etudiantId: r.etudiantId,
          valeur: parseFloat(r.valeur),
          gradeId: r.gradeId,
        }));

      await api.post('/grades/batch', { grades: payload });
      setSavedOk(true);
      setTimeout(() => {
        setSavedOk(false);
        onSaved();
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }

  const filledCount = rows.filter((r) => r.valeur !== '').length;

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800/60 px-5 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-800 dark:text-gray-200">
            {evaluation.type} – Session {evaluation.session}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {evaluation.ue?.code} · Pondération {evaluation.ponderation}%
            {evaluation.date &&
              ` · ${new Date(evaluation.date).toLocaleDateString('fr-FR')}`}
          </p>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {filledCount}/{rows.length} notes saisies
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="px-5 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400">
                Étudiant
              </th>
              <th className="px-5 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400">
                Matricule
              </th>
              <th className="px-5 py-2.5 text-center font-medium text-gray-600 dark:text-gray-400 w-36">
                Note /20
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-400 text-sm">
                  Aucun étudiant associé à cette évaluation.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={row.etudiantId} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                  <td className="px-5 py-2.5 font-medium text-gray-800 dark:text-gray-200">
                    {row.etudiant.prenom} {row.etudiant.nom}
                  </td>
                  <td className="px-5 py-2.5 text-gray-500 dark:text-gray-400 text-xs font-mono">
                    {row.etudiant.matricule ?? '—'}
                  </td>
                  <td className="px-5 py-2.5">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      step={0.25}
                      value={row.valeur}
                      onChange={(e) => updateRow(idx, e.target.value)}
                      placeholder="—"
                      className="w-full text-center px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div>
          {saveError && (
            <span className="text-red-600 dark:text-red-400 text-xs flex items-center gap-1">
              <AlertCircle size={12} /> {saveError}
            </span>
          )}
          {savedOk && (
            <span className="text-green-600 dark:text-green-400 text-xs flex items-center gap-1">
              <CheckCircle2 size={12} /> Sauvegardé !
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || rows.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl disabled:opacity-60 transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Sauvegarder les notes
        </button>
      </div>
    </div>
  );
}

function TeacherGradesView() {
  const [evaluations, setEvaluations] = useState<TeacherEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [ues, setUes] = useState<UE[]>([]);
  const [creating, setCreating] = useState(false);
  const [newEval, setNewEval] = useState({
    ueId: '',
    type: 'EXAMEN',
    ponderation: 40,
    session: 'S1',
    date: '',
  });

  const fetchEvaluations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [evalsRes, uesRes] = await Promise.all([
        api.get('/grades/evaluations'),
        api.get('/academic/ue'),
      ]);
      const rawEvals: any[] = Array.isArray(evalsRes.data)
        ? evalsRes.data
        : Array.isArray(evalsRes.data?.data)
        ? evalsRes.data.data
        : [];
      setEvaluations(rawEvals);

      const rawUes: any[] = Array.isArray(uesRes.data)
        ? uesRes.data
        : Array.isArray(uesRes.data?.data)
        ? uesRes.data.data
        : [];
      setUes(rawUes);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? 'Impossible de charger les évaluations.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  async function handleCreateEval(e: React.FormEvent) {
    e.preventDefault();
    if (!newEval.ueId) return;
    setCreating(true);
    try {
      await api.post('/grades/evaluations', newEval);
      setShowCreateForm(false);
      setNewEval({ ueId: '', type: 'EXAMEN', ponderation: 40, session: 'S1', date: '' });
      fetchEvaluations();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Erreur lors de la création de l'évaluation.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-500">
        <Loader2 size={36} className="animate-spin text-indigo-500" />
        <p>Chargement des évaluations…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button onClick={fetchEvaluations} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm">
          <RefreshCw size={14} /> Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {evaluations.length} évaluation(s) assignée(s)
        </p>
        <button
          onClick={() => setShowCreateForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
        >
          <Plus size={15} />
          Nouvelle évaluation
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateEval}
          className="bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-5 space-y-4"
        >
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Plus size={16} className="text-indigo-500" /> Créer une évaluation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                UE <span className="text-red-500">*</span>
              </label>
              <select
                value={newEval.ueId}
                onChange={(e) => setNewEval((p) => ({ ...p, ueId: e.target.value }))}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Sélectionner une UE…</option>
                {ues.map((ue) => (
                  <option key={ue.id} value={ue.id}>
                    {ue.code} – {ue.intitule}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Type d'évaluation
              </label>
              <select
                value={newEval.type}
                onChange={(e) => setNewEval((p) => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {['EXAMEN', 'CONTROLE_CONTINU', 'TP', 'PROJET', 'ORAL', 'RATTRAPAGE'].map(
                  (t) => <option key={t} value={t}>{t}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Session
              </label>
              <select
                value={newEval.session}
                onChange={(e) => setNewEval((p) => ({ ...p, session: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="S1">Semestre 1</option>
                <option value="S2">Semestre 2</option>
                <option value="RATTRAPAGE">Rattrapage</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Pondération (%)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={newEval.ponderation}
                onChange={(e) =>
                  setNewEval((p) => ({ ...p, ponderation: Number(e.target.value) }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Date (optionnel)
              </label>
              <input
                type="date"
                value={newEval.date}
                onChange={(e) => setNewEval((p) => ({ ...p, date: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-60"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Créer
            </button>
          </div>
        </form>
      )}

      {/* Evaluation panels */}
      {evaluations.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <BarChart3 size={48} className="mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">Aucune évaluation trouvée.</p>
          <p className="text-sm mt-1">Créez une évaluation pour commencer la saisie de notes.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {evaluations.map((ev) => (
            <GradeEntryPanel key={ev.id} evaluation={ev} onSaved={fetchEvaluations} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Admin / Scolarité View ────────────────────────────────────────────────────

interface AdminGrade extends Grade {
  evaluation?: Evaluation & { ue?: UE };
  etudiant?: User;
}

type WorkflowAction = 'valider' | 'publier' | 'verrouiller' | 'rejeter';

function AdminGradesView() {
  const [grades, setGrades] = useState<AdminGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatut, setFilterStatut] = useState<string>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/grades/admin/all');
      const raw: any[] = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setGrades(raw);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Impossible de charger les notes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  async function handleAction(gradeId: string, action: WorkflowAction) {
    setActionLoading(gradeId + action);
    try {
      await api.patch(`/grades/${gradeId}/${action}`);
      fetchGrades();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Erreur lors de l'action.");
    } finally {
      setActionLoading(null);
    }
  }

  const filtered =
    filterStatut === 'ALL'
      ? grades
      : grades.filter((g) => (g.statutPublication ?? g.statut) === filterStatut);

  const statuts: Array<{ value: string; label: string }> = [
    { value: 'ALL', label: 'Tous' },
    { value: 'BROUILLON', label: 'Brouillons' },
    { value: 'SOUMIS', label: 'Soumis' },
    { value: 'VALIDE', label: 'Validés' },
    { value: 'PUBLIE', label: 'Publiés' },
    { value: 'VERROUILLE', label: 'Verrouillés' },
  ];

  function WorkflowActions({ grade }: { grade: AdminGrade }) {
    const statut = (grade.statutPublication ?? grade.statut) as GradeStatut;
    return (
      <div className="flex items-center gap-1.5">
        {statut === 'SOUMIS' && (
          <>
            <button
              onClick={() => handleAction(grade.id, 'valider')}
              disabled={!!actionLoading}
              title="Valider"
              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
            >
              {actionLoading === grade.id + 'valider' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
            </button>
            <button
              onClick={() => handleAction(grade.id, 'rejeter')}
              disabled={!!actionLoading}
              title="Rejeter"
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              {actionLoading === grade.id + 'rejeter' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Ban size={14} />
              )}
            </button>
          </>
        )}
        {statut === 'VALIDE' && (
          <button
            onClick={() => handleAction(grade.id, 'publier')}
            disabled={!!actionLoading}
            title="Publier"
            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50"
          >
            {actionLoading === grade.id + 'publier' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Eye size={14} />
            )}
          </button>
        )}
        {statut === 'PUBLIE' && (
          <button
            onClick={() => handleAction(grade.id, 'verrouiller')}
            disabled={!!actionLoading}
            title="Verrouiller"
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {actionLoading === grade.id + 'verrouiller' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Lock size={14} />
            )}
          </button>
        )}
        {(statut === 'BROUILLON' || statut === 'VERROUILLE') && (
          <span className="text-xs text-gray-400 italic">—</span>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-500">
        <Loader2 size={36} className="animate-spin text-indigo-500" />
        <p>Chargement du workflow…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button onClick={fetchGrades} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm">
          <RefreshCw size={14} /> Réessayer
        </button>
      </div>
    );
  }

  // Stats
  const stats: Record<string, number> = {};
  grades.forEach((g) => {
    const s = g.statutPublication ?? g.statut;
    stats[s] = (stats[s] ?? 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(['BROUILLON', 'SOUMIS', 'VALIDE', 'PUBLIE', 'VERROUILLE'] as GradeStatut[]).map(
          (s) => (
            <div
              key={s}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-center"
            >
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats[s] ?? 0}
              </p>
              <StatutBadge statut={s} />
            </div>
          )
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {statuts.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilterStatut(s.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              filterStatut === s.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {s.label}
            <span className="ml-1.5 text-xs opacity-70">
              ({s.value === 'ALL' ? grades.length : (stats[s.value] ?? 0)})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Shield size={40} className="mx-auto mb-3 opacity-40" />
          <p>Aucune note dans cette catégorie.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-5 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Étudiant
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    UE
                  </th>
                  <th className="px-5 py-3 text-center font-medium text-gray-600 dark:text-gray-400">
                    Évaluation
                  </th>
                  <th className="px-5 py-3 text-center font-medium text-gray-600 dark:text-gray-400">
                    Note
                  </th>
                  <th className="px-5 py-3 text-center font-medium text-gray-600 dark:text-gray-400">
                    Statut
                  </th>
                  <th className="px-5 py-3 text-center font-medium text-gray-600 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {filtered.map((grade) => (
                  <tr
                    key={grade.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {grade.etudiant
                          ? `${grade.etudiant.prenom} ${grade.etudiant.nom}`
                          : grade.etudiantId}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        {grade.etudiant?.matricule ?? ''}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                      {grade.evaluation?.ue?.code ?? '—'}
                      <span className="text-xs text-gray-500 ml-1 hidden sm:inline">
                        {grade.evaluation?.ue?.intitule}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">
                      {grade.evaluation?.type ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {grade.valeur !== undefined && grade.valeur !== null ? (
                        <span className={`font-bold ${gradeColor(grade.valeur)}`}>
                          {grade.valeur}/20
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <StatutBadge statut={grade.statutPublication ?? grade.statut} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-center">
                        <WorkflowActions grade={grade} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page root ─────────────────────────────────────────────────────────────────

export default function GradesPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  const isStudent = user.role === 'ETUDIANT' || user.role === 'DELEGUE';
  const isTeacher = user.role === 'ENSEIGNANT' || user.role === 'RESPONSABLE_FILIERE';
  const isAdmin = user.role === 'ADMIN' || user.role === 'SCOLARITE';

  const roleLabel = isStudent
    ? 'Mes notes & résultats'
    : isTeacher
    ? 'Saisie & gestion des notes'
    : 'Validation des notes';

  const RoleIcon = isStudent ? GraduationCap : isTeacher ? BarChart3 : Shield;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <RoleIcon size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Notes &amp; Résultats
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{roleLabel}</p>
            </div>
          </div>
        </div>

        {/* Role-based view */}
        {isStudent && <StudentGradesView />}
        {isTeacher && <TeacherGradesView />}
        {isAdmin && <AdminGradesView />}
      </div>
    </div>
  );
}

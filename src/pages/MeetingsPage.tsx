import { useEffect, useState, useCallback } from 'react';
import {
  Video,
  Plus,
  X,
  Users,
  Clock,
  ExternalLink,
  Play,
  Calendar,
  ChevronRight,
  Wifi,
  Film,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import type { Meeting, Group, Recording } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'a_venir' | 'en_cours' | 'passees';

interface CreateMeetingForm {
  titre: string;
  groupeId: string;
  dateDebut: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ statut }: { statut: string }) {
  if (statut === 'EN_COURS') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
        </span>
        En cours
      </span>
    );
  }
  if (statut === 'PROGRAMMEE') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
        <Clock size={10} />
        Programmée
      </span>
    );
  }
  // TERMINEE
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
      Terminée
    </span>
  );
}

// ─── Recording row ─────────────────────────────────────────────────────────────

function RecordingRow({ recording }: { recording: Recording }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
      <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
        <Film size={13} className="text-slate-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 truncate">
          Enregistrement
          {recording.duree ? ` · ${formatDuration(recording.duree)}` : ''}
        </p>
        {recording.taille && (
          <p className="text-xs text-slate-400">
            {(recording.taille / (1024 * 1024)).toFixed(1)} Mo
          </p>
        )}
      </div>
      {recording.fichierUrl && (
        <a
          href={recording.fichierUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 flex-shrink-0"
        >
          <Play size={12} />
          Lire
        </a>
      )}
    </div>
  );
}

// ─── Meeting card ──────────────────────────────────────────────────────────────

interface MeetingCardProps {
  meeting: Meeting;
  onJoin: (meeting: Meeting) => Promise<void>;
  joiningId: string | null;
  showRecordings?: boolean;
}

function MeetingCard({ meeting, onJoin, joiningId, showRecordings }: MeetingCardProps) {
  const isLive = meeting.statut === 'EN_COURS';
  const isScheduled = meeting.statut === 'PROGRAMMEE';
  const canJoin = isLive || isScheduled;
  const participantCount = meeting.participations?.length ?? 0;

  return (
    <div
      className={`bg-white rounded-xl border transition-shadow hover:shadow-md overflow-hidden ${
        isLive ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-100'
      }`}
    >
      {/* Card header accent */}
      <div
        className={`h-1 w-full ${
          isLive ? 'bg-gradient-to-r from-red-500 to-rose-500' :
          isScheduled ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
          'bg-slate-200'
        }`}
      />

      <div className="p-4 md:p-5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isLive ? 'bg-red-100' : isScheduled ? 'bg-blue-100' : 'bg-slate-100'
              }`}
            >
              {isLive ? (
                <Wifi size={16} className="text-red-600" />
              ) : (
                <Video size={16} className={isScheduled ? 'text-blue-600' : 'text-slate-500'} />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-800 truncate text-sm md:text-base leading-tight">
                {meeting.titre}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Hôte :{' '}
                <span className="font-medium text-slate-600">
                  {meeting.hote
                    ? `${meeting.hote.prenom} ${meeting.hote.nom}`
                    : '—'}
                </span>
              </p>
            </div>
          </div>
          <StatusBadge statut={meeting.statut} />
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {formatDate(meeting.dateDebut)}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {formatTime(meeting.dateDebut)}
            {meeting.dateFin && ` – ${formatTime(meeting.dateFin)}`}
          </span>
          {participantCount > 0 && (
            <span className="flex items-center gap-1">
              <Users size={11} />
              {participantCount} participant{participantCount > 1 ? 's' : ''}
            </span>
          )}
          {meeting.group && (
            <span className="flex items-center gap-1 truncate max-w-[140px]">
              <ChevronRight size={11} />
              <span className="truncate">{meeting.group.nom}</span>
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          {canJoin ? (
            <button
              onClick={() => onJoin(meeting)}
              disabled={joiningId === meeting.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                isLive
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {joiningId === meeting.id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isLive ? (
                <Wifi size={14} />
              ) : (
                <Video size={14} />
              )}
              {isLive ? 'Rejoindre' : 'Rejoindre'}
            </button>
          ) : (
            <div />
          )}

          {meeting.lien && (
            <a
              href={meeting.lien}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ExternalLink size={12} />
              Lien direct
            </a>
          )}
        </div>

        {/* Recordings for past meetings */}
        {showRecordings && meeting.recordings && meeting.recordings.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <Film size={11} />
              Enregistrements ({meeting.recordings.length})
            </p>
            {meeting.recordings.map((rec) => (
              <RecordingRow key={rec.id} recording={rec} />
            ))}
          </div>
        )}

        {/* Enregistrée badge */}
        {meeting.enregistree && meeting.statut !== 'TERMINEE' && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-600">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Réunion enregistrée
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create modal ──────────────────────────────────────────────────────────────

interface CreateModalProps {
  groups: Group[];
  onClose: () => void;
  onCreated: (meeting: Meeting) => void;
}

function CreateModal({ groups, onClose, onCreated }: CreateModalProps) {
  const { user } = useAuth();
  const [form, setForm] = useState<CreateMeetingForm>({
    titre: '',
    groupeId: '',
    dateDebut: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set a default dateDebut 30 min from now
  useEffect(() => {
    const d = new Date(Date.now() + 30 * 60 * 1000);
    // Format to datetime-local value
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setForm((prev) => ({ ...prev, dateDebut: local }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim()) { setError('Le titre est requis.'); return; }
    if (!form.dateDebut) { setError('La date de début est requise.'); return; }
    setError(null);
    setLoading(true);
    try {
      const payload: Record<string, string> = {
        titre: form.titre.trim(),
        dateDebut: new Date(form.dateDebut).toISOString(),
      };
      if (form.groupeId) payload.groupeId = form.groupeId;
      const res = await api.post<Meeting>('/meetings', payload);
      onCreated(res.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Impossible de créer la réunion. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Video size={18} className="text-blue-600" />
            </div>
            <h2 className="text-base font-semibold text-slate-800">
              Nouvelle réunion
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Titre */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Titre *
            </label>
            <input
              type="text"
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              placeholder="Ex : Réunion de projet M2"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
              maxLength={120}
            />
          </div>

          {/* Groupe */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Groupe (optionnel)
            </label>
            <select
              value={form.groupeId}
              onChange={(e) => setForm({ ...form, groupeId: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
            >
              <option value="">— Aucun groupe —</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Heure */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Date et heure de début *
            </label>
            <input
              type="datetime-local"
              value={form.dateDebut}
              onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>

          {/* Hosted by */}
          {user && (
            <p className="text-xs text-slate-400">
              Hôte :{' '}
              <span className="font-medium text-slate-600">
                {user.prenom} {user.nom}
              </span>
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Plus size={15} />
              )}
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Skeleton loader ───────────────────────────────────────────────────────────

function MeetingCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="h-1 w-full bg-slate-200" />
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-200" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 bg-slate-200 rounded w-48" />
            <div className="h-3 bg-slate-100 rounded w-32" />
          </div>
          <div className="h-5 w-20 bg-slate-200 rounded-full" />
        </div>
        <div className="flex gap-4">
          <div className="h-3 bg-slate-100 rounded w-28" />
          <div className="h-3 bg-slate-100 rounded w-16" />
        </div>
        <div className="h-8 bg-slate-200 rounded-lg w-28" />
      </div>
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: Tab }) {
  const msgs: Record<Tab, { icon: string; text: string }> = {
    a_venir: { icon: '📅', text: 'Aucune réunion programmée' },
    en_cours: { icon: '🎙️', text: 'Aucune réunion en cours' },
    passees: { icon: '📼', text: 'Aucune réunion passée' },
  };
  const { icon, text } = msgs[tab];
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: 'a_venir', label: 'À venir' },
  { key: 'en_cours', label: 'En cours' },
  { key: 'passees', label: 'Passées' },
];

export default function MeetingsPage() {
  const { user } = useAuth();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tab, setTab] = useState<Tab>('a_venir');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // ── Fetch meetings & groups ──────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [meetingsRes, groupsRes] = await Promise.allSettled([
        api.get<Meeting[]>('/meetings'),
        api.get<Group[]>('/groups'),
      ]);
      if (meetingsRes.status === 'fulfilled') {
        const data = meetingsRes.value.data;
        setMeetings(Array.isArray(data) ? data : []);
      } else {
        setFetchError('Impossible de charger les réunions.');
      }
      if (groupsRes.status === 'fulfilled') {
        const data = groupsRes.value.data;
        setGroups(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  // ── Filter by tab ────────────────────────────────────────────────────────────
  const filtered = meetings.filter((m) => {
    if (tab === 'en_cours') return m.statut === 'EN_COURS';
    if (tab === 'passees') return m.statut === 'TERMINEE';
    // a_venir: PROGRAMMEE (or unknown)
    return m.statut === 'PROGRAMMEE';
  });

  // ── Tab counts ───────────────────────────────────────────────────────────────
  const counts: Record<Tab, number> = {
    a_venir: meetings.filter((m) => m.statut === 'PROGRAMMEE').length,
    en_cours: meetings.filter((m) => m.statut === 'EN_COURS').length,
    passees: meetings.filter((m) => m.statut === 'TERMINEE').length,
  };

  // ── Join meeting ─────────────────────────────────────────────────────────────
  const handleJoin = async (meeting: Meeting) => {
    if (joiningId) return;
    setJoiningId(meeting.id);
    try {
      await api.post(`/meetings/${meeting.id}/join`);
      if (meeting.lien) {
        window.open(meeting.lien, '_blank', 'noopener,noreferrer');
      }
    } catch {
      // Even on error, try to open the link if available
      if (meeting.lien) {
        window.open(meeting.lien, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setJoiningId(null);
    }
  };

  // ── After create ─────────────────────────────────────────────────────────────
  const handleCreated = (newMeeting: Meeting) => {
    setMeetings((prev) => [newMeeting, ...prev]);
    setShowCreate(false);
    setTab('a_venir');
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <Video size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Réunions</h1>
            <p className="text-xs text-slate-500">
              {meetings.length} réunion{meetings.length !== 1 ? 's' : ''} au total
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Créer une réunion</span>
          <span className="sm:hidden">Créer</span>
        </button>
      </div>

      {/* ── Live banner (when meetings en cours) ─────────────────────────────── */}
      {counts.en_cours > 0 && tab !== 'en_cours' && (
        <button
          onClick={() => setTab('en_cours')}
          className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-left hover:bg-red-100 transition-colors"
        >
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-sm font-semibold text-red-700">
            {counts.en_cours} réunion{counts.en_cours > 1 ? 's' : ''} en cours en ce moment
          </span>
          <ChevronRight size={14} className="ml-auto text-red-500" />
        </button>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="bg-slate-100 rounded-xl p-1 flex gap-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
            {counts[key] > 0 && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  tab === key
                    ? key === 'en_cours'
                      ? 'bg-red-100 text-red-700'
                      : key === 'a_venir'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-200 text-slate-600'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      {fetchError ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
          <AlertCircle size={36} className="text-red-400" />
          <p className="text-sm font-medium text-slate-600">{fetchError}</p>
          <button
            onClick={loadData}
            className="mt-1 text-sm text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2"
          >
            Réessayer
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <MeetingCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="space-y-4">
          {filtered.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              onJoin={handleJoin}
              joiningId={joiningId}
              showRecordings={tab === 'passees'}
            />
          ))}
        </div>
      )}

      {/* ── Create modal ─────────────────────────────────────────────────────── */}
      {showCreate && (
        <CreateModal
          groups={groups}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

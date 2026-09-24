import { useState } from 'react';
import { Bell, Check, Clock, Info, CheckCircle2, MessageSquare, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NotificationItem {
  id: string;
  titre: string;
  message: string;
  type: 'INFO' | 'NOTE' | 'MESSAGE' | 'BADGE';
  date: string;
  lu: boolean;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      titre: 'Publication officielle',
      message: 'Le calendrier des examens du second semestre est maintenant disponible sur le fil d actualité.',
      type: 'INFO',
      date: 'Il y a 10 minutes',
      lu: false,
    },
    {
      id: '2',
      titre: 'Nouvelle note saisie',
      message: 'Votre note pour le contrôle continu d Algorithmique Avancée a été validée.',
      type: 'NOTE',
      date: 'Il y a 2 heures',
      lu: false,
    },
    {
      id: '3',
      titre: 'Nouveau message dans votre groupe',
      message: 'Jean-Marc RAKOTO a partagé un document dans le canal Général de la classe.',
      type: 'MESSAGE',
      date: 'Hier à 16:45',
      lu: true,
    },
    {
      id: '4',
      titre: 'Nouveau badge obtenu !',
      message: 'Félicitations, vous avez obtenu le badge « Contributeur Actif » de l EMIT.',
      type: 'BADGE',
      date: 'Il y a 2 jours',
      lu: true,
    },
  ]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lu: true } : n)),
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'NOTE':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'MESSAGE':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'BADGE':
        return <Award className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Bell className="w-6 h-6" />
            </div>
            Centre de Notifications
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Restez informé de l actualité de l EMIT, de vos cours et de vos notes
          </p>
        </div>
        <button
          onClick={markAllAsRead}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
        >
          <Check className="w-4 h-4" />
          Tout marquer comme lu
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-slate-600">Aucune notification pour le moment</p>
            <p className="text-xs text-slate-400 mt-1">Vous êtes à jour !</p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => markAsRead(item.id)}
              className={`p-4 sm:p-5 flex items-start gap-4 cursor-pointer transition-colors ${
                item.lu ? 'bg-white hover:bg-slate-50/80' : 'bg-blue-50/40 hover:bg-blue-50/70'
              }`}
            >
              <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-100 shrink-0">
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className={`text-sm font-bold truncate ${item.lu ? 'text-slate-700' : 'text-slate-900'}`}>
                    {item.titre}
                  </h3>
                  <span className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {item.date}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
              </div>
              {!item.lu && (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

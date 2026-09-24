import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import {
  Send, Paperclip, Mic, Smile, Hash, Users, Search, Phone, Video,
  MoreVertical, Check, CheckCheck, Circle, Image, FileText, ChevronRight
} from 'lucide-react';
import type { Channel, Message, Group } from '../types';

export default function ChatPage() {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [search, setSearch] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordTimerRef = useRef<any>(null);

  // Load channels from groups
  useEffect(() => {
    const loadChannels = async () => {
      try {
        const groupsRes = await api.get('/groups');
        const allChannels: Channel[] = [];
        (groupsRes.data || []).forEach((g: Group) => {
          if (g.channels) {
            g.channels.forEach(c => allChannels.push({ ...c, nom: `${g.nom} - ${c.nom}` }));
          }
        });
        setChannels(allChannels);
        if (allChannels.length > 0 && !activeChannel) {
          setActiveChannel(allChannels[0]);
        }
      } catch (err) {
        console.error('Error loading channels:', err);
      }
    };
    loadChannels();
  }, []);

  // Load messages for active channel
  useEffect(() => {
    if (!activeChannel) return;
    const loadMessages = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/chat/channels/${activeChannel.id}/messages`);
        setMessages(res.data || []);
      } catch (err) {
        console.error('Error loading messages:', err);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, [activeChannel]);

  // Socket.IO listeners
  useEffect(() => {
    const socket = getSocket();

    socket.on('message:new', (msg: Message) => {
      if (msg.channelId === activeChannel?.id) {
        setMessages(prev => [...prev, msg]);
      }
    });

    socket.on('presence:update', (data: { userId: string; status: string }) => {
      if (data.status === 'online') {
        setOnlineUsers(prev => [...new Set([...prev, data.userId])]);
      } else {
        setOnlineUsers(prev => prev.filter(id => id !== data.userId));
      }
    });

    return () => {
      socket.off('message:new');
      socket.off('presence:update');
    };
  }, [activeChannel]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeChannel || !user) return;

    const payload = {
      channelId: activeChannel.id,
      auteurId: user.id,
      type: 'TEXTE' as const,
      contenu: inputText.trim(),
    };

    try {
      const res = await api.post(`/chat/channels/${activeChannel.id}/messages`, payload);
      setMessages(prev => [...prev, res.data]);
      setInputText('');

      const socket = getSocket();
      socket.emit('message:send', res.data);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleVoiceRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingTime(0);
      recordTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setIsRecording(false);
      clearInterval(recordTimerRef.current);
      // Simulate sending voice message
      if (activeChannel && user) {
        const dummyVoice = {
          channelId: activeChannel.id,
          auteurId: user.id,
          type: 'VOCAL' as const,
          voiceData: {
            fichierAudioUrl: 'https://example.com/audio.webm',
            dureeSecondes: recordingTime,
            formeOnde: JSON.stringify([10, 30, 60, 40, 70, 90, 50, 20]),
          },
        };
        api.post(`/chat/channels/${activeChannel.id}/messages`, dummyVoice).then(res => {
          setMessages(prev => [...prev, res.data]);
        });
      }
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    try {
      await api.post(`/chat/messages/${messageId}/reactions`, { emoji });
      // Update local state
      setMessages(prev =>
        prev.map(m => {
          if (m.id !== messageId) return m;
          const existing = m.reactions?.find(r => r.userId === user?.id && r.emoji === emoji);
          const newReactions = existing
            ? m.reactions?.filter(r => r !== existing)
            : [...(m.reactions || []), { id: Date.now().toString(), messageId, userId: user!.id, emoji }];
          return { ...m, reactions: newReactions };
        })
      );
    } catch (err) {
      console.error('Error reacting:', err);
    }
  };

  const filteredChannels = channels.filter(c =>
    c.nom.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Channels sidebar */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-base mb-3">Messages & Salons</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un canal..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Channel list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Canaux disponibles
          </div>
          {filteredChannels.length > 0 ? (
            filteredChannels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-medium transition-colors ${
                  activeChannel?.id === channel.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Hash size={14} className={activeChannel?.id === channel.id ? 'text-blue-600' : 'text-slate-400'} />
                <span className="truncate flex-1">{channel.nom}</span>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              Aucun canal disponible. Rejoignez un groupe !
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {activeChannel ? (
        <div className="flex-1 flex flex-col bg-slate-50">
          {/* Channel Header */}
          <div className="h-14 px-6 bg-white border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash size={18} className="text-slate-500" />
              <div>
                <h3 className="font-semibold text-sm text-slate-800">{activeChannel.nom}</h3>
                <p className="text-xs text-slate-400">{activeChannel.description || 'Canal de discussion'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                <Search size={16} />
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                <Users size={16} />
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Hash size={40} className="opacity-20 mb-2" />
                <p className="text-sm font-medium">Début du canal {activeChannel.nom}</p>
                <p className="text-xs mt-1">Soyez le premier à envoyer un message !</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.auteurId === user?.id;
                return (
                  <div key={msg.id} className={`flex gap-3 group ${isMe ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {msg.auteur?.prenom?.[0] || 'U'}
                    </div>

                    {/* Content */}
                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-700">
                          {isMe ? 'Moi' : `${msg.auteur?.prenom} ${msg.auteur?.nom}`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Message Bubble */}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm relative group/bubble ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                      }`}>
                        {msg.type === 'VOCAL' ? (
                          <div className="flex items-center gap-3">
                            <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                              ▶️
                            </button>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium">Message vocal</span>
                              <span className="text-[10px] opacity-80">{msg.voiceMessage?.dureeSecondes || 0}s</span>
                            </div>
                          </div>
                        ) : (
                          <p className="leading-relaxed">{msg.contenu}</p>
                        )}

                        {/* Emoji picker on hover */}
                        <div className="absolute right-0 -bottom-3 hidden group-hover/bubble:flex items-center bg-white border border-slate-200 rounded-full px-1.5 py-0.5 shadow-md gap-1 z-10">
                          {['👍', '❤️', '👏', '💡'].map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction(msg.id, emoji)}
                              className="text-xs hover:scale-125 transition-transform"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Reactions display */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(
                            msg.reactions.reduce((acc, r) => {
                              acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)
                          ).map(([emoji, count]) => (
                            <span
                              key={emoji}
                              className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2 py-0.5 text-[11px] shadow-xs"
                            >
                              <span>{emoji}</span>
                              <span className="text-slate-600 font-medium">{count}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-white border-t border-slate-200">
            {isRecording ? (
              <div className="flex items-center gap-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-ping" />
                <span className="text-xs font-medium text-red-600">
                  Enregistrement... {recordingTime}s (Opus / WebM)
                </span>
                <button
                  onClick={handleVoiceRecord}
                  className="ml-auto text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg"
                >
                  Terminer & Envoyer
                </button>
              </div>
            ) : (
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <button type="button" className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                  <Paperclip size={18} />
                </button>
                <input
                  type="text"
                  placeholder={`Envoyer un message dans #${activeChannel.nom}...`}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  className="flex-1 px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={handleVoiceRecord}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100"
                  title="Enregistrer un message vocal"
                >
                  <Mic size={18} />
                </button>
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
          <Hash size={48} className="opacity-20 mb-3" />
          <p className="text-sm font-medium">Sélectionnez un canal pour commencer à discuter</p>
        </div>
      )}
    </div>
  );
}

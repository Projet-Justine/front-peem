import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
  Folder, FolderOpen, FileText, Image, Video, Music, Archive,
  Upload, Plus, Search, Filter, Download, Trash2, Eye, MoreVertical
} from 'lucide-react';
import type { Folder as FolderType, FileItem } from '../types';

export default function FilesPage() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [activeFolder, setActiveFolder] = useState<FolderType | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');

  const loadFolders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/files/folders');
      setFolders(res.data || []);
      if (res.data && res.data.length > 0 && !activeFolder) {
        setActiveFolder(res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    if (!activeFolder) return;
    const loadFiles = async () => {
      try {
        const res = await api.get(`/files/folders/${activeFolder.id}/files`);
        setFiles(res.data || []);
      } catch (err) {
        console.error('Error loading files:', err);
        setFiles([]);
      }
    };
    loadFiles();
  }, [activeFolder]);

  const handleSimulatedUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName.trim() || !activeFolder || !user) return;

    try {
      const dummyFile: Partial<FileItem> = {
        nom: uploadFileName,
        chemin: `/uploads/${uploadFileName}`,
        taille: Math.floor(Math.random() * 5000000) + 100000,
        type: uploadFileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        version: 1,
        folderId: activeFolder.id,
        proprietaireId: user.id,
      };

      const res = await api.post(`/files/folders/${activeFolder.id}/files`, dummyFile);
      setFiles(prev => [...prev, res.data || dummyFile]);
      setShowUploadModal(false);
      setUploadFileName('');
    } catch (err) {
      console.error('Error uploading file:', err);
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf')) return <FileText size={24} className="text-red-500" />;
    if (fileName.match(/\.(png|jpg|jpeg|gif)$/i)) return <Image size={24} className="text-emerald-500" />;
    if (fileName.match(/\.(mp4|webm|mkv)$/i)) return <Video size={24} className="text-purple-500" />;
    if (fileName.match(/\.(mp3|ogg|wav)$/i)) return <Music size={24} className="text-blue-500" />;
    if (fileName.match(/\.(zip|rar|7z)$/i)) return <Archive size={24} className="text-amber-500" />;
    return <FileText size={24} className="text-slate-400" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / 1048576).toFixed(1)} Mo`;
  };

  const filteredFiles = files.filter(f =>
    f.nom.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Folder sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-sm">Dossiers & Matières</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {folders.length > 0 ? (
            folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors ${
                  activeFolder?.id === folder.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {activeFolder?.id === folder.id ? (
                  <FolderOpen size={16} className="text-blue-600" />
                ) : (
                  <Folder size={16} className="text-slate-400" />
                )}
                <span className="truncate flex-1">{folder.nom}</span>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">Aucun dossier disponible</div>
          )}
        </div>
      </div>

      {/* Main Files Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className="text-blue-600" />
            <h1 className="font-bold text-slate-800 text-sm md:text-base">
              {activeFolder ? activeFolder.nom : 'Espace Fichiers'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un fichier..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Upload size={14} />
              Déposer un fichier
            </button>
          </div>
        </div>

        {/* Files Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 max-w-md mx-auto mt-12">
              <Folder size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-semibold text-slate-700 text-sm">Ce dossier est vide</p>
              <p className="text-xs mt-1">Déposez des cours, supports ou devoirs dans ce dossier</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredFiles.map(file => (
                <div
                  key={file.id}
                  className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-shadow group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                      {getFileIcon(file.nom)}
                    </div>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                      v{file.version}
                    </span>
                  </div>

                  <div className="my-3">
                    <p className="font-semibold text-slate-800 text-xs truncate" title={file.nom}>
                      {file.nom}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatSize(file.taille)}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-400">
                    <button className="hover:text-blue-600 transition-colors p-1" title="Aperçu">
                      <Eye size={14} />
                    </button>
                    <button className="hover:text-blue-600 transition-colors p-1" title="Télécharger">
                      <Download size={14} />
                    </button>
                    <button className="hover:text-red-500 transition-colors p-1" title="Supprimer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800">Déposer un support de cours</h3>
            <form onSubmit={handleSimulatedUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nom du fichier</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Chapitre_1_Base_de_donnees.pdf"
                  value={uploadFileName}
                  onChange={e => setUploadFileName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center">
                <Upload size={24} className="mx-auto text-slate-400 mb-1" />
                <p className="text-xs text-slate-500">Glissez-déposez votre fichier ici (Max 50 Mo)</p>
                <p className="text-[10px] text-slate-400 mt-1">PDF, ZIP, DOCX, MP4, MP3</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
                >
                  Uploader
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

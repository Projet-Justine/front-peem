// Shared types matching backend entities

export type UserRole =
  | 'ADMIN'
  | 'SCOLARITE'
  | 'RESPONSABLE_FILIERE'
  | 'ENSEIGNANT'
  | 'ETUDIANT'
  | 'DELEGUE';

export interface User {
  id: string;
  matricule?: string;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  filiere?: string;
  niveau?: string;
  promotion?: string;
  photoUrl?: string;
  coverUrl?: string;
  actif: boolean;
  profile?: Profile;
  badges?: Badge[];
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  bio?: string;
  interests?: string;
  skills?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  disponibilite?: string;
  photoUrl?: string;
  coverUrl?: string;
}

export interface Badge {
  id: string;
  label: string;
  type: string;
  userId: string;
  obtainedAt: string;
}

export interface Group {
  id: string;
  nom: string;
  description?: string;
  type: string;
  modeAdhesion: string;
  codeInvitation?: string;
  proprietaireId: string;
  proprietaire?: User;
  members?: GroupMember[];
  channels?: Channel[];
  archivé: boolean;
  quota: number;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  user?: User;
  role: string;
  statut: string;
  dateAdhesion: string;
}

export interface Channel {
  id: string;
  groupId?: string;
  nom: string;
  type: string;
  description?: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  channelId: string;
  auteurId: string;
  auteur?: User;
  type: 'TEXTE' | 'VOCAL' | 'FICHIER' | 'SYSTEME';
  contenu?: string;
  fichierUrl?: string;
  reponseAId?: string;
  reponseA?: Message;
  modifie: boolean;
  epingle: boolean;
  voiceMessage?: VoiceMessage;
  reactions?: Reaction[];
  createdAt: string;
}

export interface VoiceMessage {
  id: string;
  messageId: string;
  fichierAudioUrl: string;
  dureeSecondes: number;
  tailleOctets: number;
  formeOnde: string;
  transcription?: string;
}

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  user?: User;
  emoji: string;
}

export interface Meeting {
  id: string;
  titre: string;
  hoteId: string;
  hote?: User;
  groupeId?: string;
  group?: Group;
  dateDebut: string;
  dateFin?: string;
  salleCode: string;
  lien: string;
  statut: string;
  enregistree: boolean;
  participations?: Participation[];
  recordings?: Recording[];
}

export interface Participation {
  id: string;
  meetingId: string;
  userId: string;
  user?: User;
  heureArrivee: string;
  heureDepart?: string;
}

export interface Recording {
  id: string;
  meetingId: string;
  fichierUrl?: string;
  duree?: number;
  taille?: number;
  visibilite: string;
}

export interface Post {
  id: string;
  auteurId: string;
  auteur?: User;
  type: string;
  titre: string;
  contenu: string;
  epingle: boolean;
  statut: string;
  datePublication?: string;
  dateExpiration?: string;
  commentairesActifs: boolean;
  cibles?: PostTarget[];
  commentaires?: PostComment[];
  reactions?: PostLike[];
  createdAt: string;
}

export interface PostTarget {
  id: string;
  postId: string;
  filiere?: string;
  niveau?: string;
}

export interface PostComment {
  id: string;
  postId: string;
  auteurId: string;
  auteur?: User;
  contenu: string;
  createdAt: string;
}

export interface PostLike {
  id: string;
  postId: string;
  userId: string;
  user?: User;
  type: string;
}

export interface UE {
  id: string;
  code: string;
  intitule: string;
  credits: number;
  coefficient: number;
  semestre: string;
  filiere: string;
  niveau: string;
  statut: string;
  responsableId?: string;
  responsable?: User;
  elementsConstitutifs?: MatiereEC[];
  evaluations?: Evaluation[];
  inscriptions?: Enrollment[];
}

export interface MatiereEC {
  id: string;
  ueId: string;
  intitule: string;
  coefficient: number;
  volumeHoraire?: number;
  enseignantId?: string;
  enseignant?: User;
}

export interface Enrollment {
  id: string;
  etudiantId: string;
  etudiant?: User;
  ueId: string;
  ue?: UE;
  annee: string;
  statut: string;
}

export interface Evaluation {
  id: string;
  ueId: string;
  ue?: UE;
  type: string;
  ponderation: number;
  date?: string;
  session: string;
  grades?: Grade[];
}

export interface Grade {
  id: string;
  evaluationId: string;
  etudiantId: string;
  etudiant?: User;
  valeur?: number;
  statut: string;
  statutPublication: string;
  createdAt: string;
}

export interface ResultatUE {
  id: string;
  etudiantId: string;
  ueId: string;
  ue?: UE;
  moyenne: number;
  credits: number;
  decision: string;
  session: string;
}

export interface Claim {
  id: string;
  gradeId: string;
  etudiantId: string;
  motif: string;
  statut: string;
  reponse?: string;
  createdAt: string;
}

export interface Friendship {
  id: string;
  userAId: string;
  userBId: string;
  userA?: User;
  userB?: User;
  type: string;
  statut: string;
  createdAt: string;
}

export interface WallPost {
  id: string;
  auteurId: string;
  auteur?: User;
  contenu: string;
  mediaUrls?: string;
  audience: string;
  epingle: boolean;
  createdAt: string;
}

export interface Story {
  id: string;
  auteurId: string;
  auteur?: User;
  contenu: string;
  mediaUrl?: string;
  audience: string;
  expiresAt: string;
  viewCount: number;
  createdAt: string;
}

export interface SocialPage {
  id: string;
  nom: string;
  description?: string;
  coverUrl?: string;
  responsableId: string;
  responsable?: User;
  valide: boolean;
  followerCount?: number;
  createdAt: string;
}

export interface SocialEvent {
  id: string;
  titre: string;
  description?: string;
  lieu?: string;
  dateDebut: string;
  dateFin?: string;
  lienMeet?: string;
  organisateurId: string;
  organisateur?: User;
  pageId?: string;
  createdAt: string;
}

export interface Listing {
  id: string;
  vendeurId: string;
  vendeur?: User;
  titre: string;
  description?: string;
  categorie: string;
  prix?: number;
  statut: string;
  imageUrl?: string;
  expiresAt: string;
  createdAt: string;
}

export interface QAQuestion {
  id: string;
  ueId?: string;
  auteurId: string;
  auteur?: User;
  titre: string;
  contenu: string;
  resolu: boolean;
  answers?: QAAnswer[];
  voteCount: number;
  createdAt: string;
}

export interface QAAnswer {
  id: string;
  questionId: string;
  auteurId: string;
  auteur?: User;
  contenu: string;
  solution: boolean;
  voteCount: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  titre: string;
  message: string;
  lu: boolean;
  lien?: string;
  createdAt: string;
}

export interface Folder {
  id: string;
  nom: string;
  groupId?: string;
  parentId?: string;
  proprietaireId: string;
  files?: FileItem[];
}

export interface FileItem {
  id: string;
  nom: string;
  chemin: string;
  taille: number;
  type: string;
  url?: string;
  version: number;
  folderId?: string;
  groupId?: string;
  proprietaireId: string;
  proprietaire?: User;
  createdAt: string;
}

// API Response types
export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

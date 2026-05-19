import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Play, 
  Music, 
  Activity as ActivityIcon,
  MessageSquare,
  Mail,
  Zap,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Download,
  Share2,
  Users,
  LayoutDashboard,
  Bell,
  User,
  ArrowUpRight,
  Settings,
  ChevronLeft,
  Lock,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  Send,
  X,
  Trash2,
  Edit3,
  Video,
  AlertCircle,
  Eye,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useMediaStore } from './context/MediaStoreContext';
import { useAudio } from './context/AudioContext';
import Shell from './components/Shell';
import AudioPlayer from './components/AudioPlayer';
import UploadZone from './components/UploadZone';
import TrackOptionsMenu from './components/TrackOptionsMenu';
import PromoPackModal from './components/PromoPackModal';
import EditTrackModal from './components/EditTrackModal';
import EditPlaylistModal from './components/EditPlaylistModal';
import AddTrackToPlaylistModal from './components/AddTrackToPlaylistModal';
import AddClientModal from './components/AddClientModal';
import EditClientModal from './components/EditClientModal';
import VideoGenerationModal from './components/VideoGenerationModal';
import VideoPreviewModal from './components/VideoPreviewModal';
import SharePortal from './components/SharePortal';
import ClientPortal from './components/ClientPortal';
import ShareModal from './components/ShareModal';
import { Track, ShareLink, Client, Playlist } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'tracks' | 'playlists' | 'clients' | 'messages' | 'sharing' | 'activity' | 'settings' | 'profile' | 'client-detail' | 'videos'>('dashboard');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedMessageClientId, setSelectedMessageClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [selectedTrackForPromo, setSelectedTrackForPromo] = useState<Track | null>(null);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedTrackForVideo, setSelectedTrackForVideo] = useState<Track | null>(null);
  const [selectedPlaylistForVideo, setSelectedPlaylistForVideo] = useState<Playlist | null>(null);
  const [selectedVideoForPreview, setSelectedVideoForPreview] = useState<any | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [clientPortalUser, setClientPortalUser] = useState<Client | null>(null);
  const [sharingAsset, setSharingAsset] = useState<{ track?: Track, playlist?: Playlist } | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [clientMessageDraft, setClientMessageDraft] = useState('');
  const [chatAttachment, setChatAttachment] = useState<string | null>(null);
  const [asyncSharedContent, setAsyncSharedContent] = useState<{ track?: Track, playlist?: Playlist, link: ShareLink } | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{ status: 'idle' | 'checking' | 'success' | 'error', message?: string } | null>(null);

  const checkDatabase = async () => {
    setDbStatus({ status: 'checking' });
    try {
      const res = await fetch('/api/test-db');
      const data = await res.json();
      if (data.success) {
        setDbStatus({ status: 'success', message: data.message });
        setTimeout(() => setDbStatus(null), 5000);
      } else {
        setDbStatus({ status: 'error', message: data.error });
      }
    } catch (e: any) {
      setDbStatus({ status: 'error', message: e.message || 'Network error' });
    }
  };

  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showAddTracksToPlaylist, setShowAddTracksToPlaylist] = useState(false);

  const { 
    tracks, playlists, clients, activities, messages, profile, loading, shareLinks, promoVideos,
    deleteTrack, updateTrack, addPlaylist, updatePlaylist, deletePlaylist, 
    addTrackToPlaylist, removeTrackFromPlaylist, addClient, updateClient, deleteClient, 
    updateProfile, addShareLink, addActivity, sendMessage, incrementShareLinkAccess, getShareContent
  } = useMediaStore();
  const hasIncrementedRef = React.useRef<string | null>(null);

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const selectedPlaylist = useMemo(() => playlists.find(p => p.id === selectedPlaylistId) || null, [playlists, selectedPlaylistId]);

  const { stop, playTrack, activeTrack } = useAudio();
  
  // Fetch Shared Content for Anon Users
  useEffect(() => {
    if (shareToken && !loading) {
       const fetchShared = async () => {
          const content = await getShareContent(shareToken);
          if (content) {
             setAsyncSharedContent(content);
          } else {
             setShareError("Invalid or unauthorized share token.");
          }
       };
       fetchShared();
    }
  }, [shareToken, loading, getShareContent]);
  
  // Analytics Logic
  const stats = useMemo(() => {
    const totalPlays = tracks.reduce((acc, t) => acc + (t.plays || 0), 0);
    const totalLikes = tracks.reduce((acc, t) => acc + (t.likes || 0), 0);
    const engagementRate = totalPlays > 0 ? (totalLikes / totalPlays) * 100 : 0;
    
    return {
      totalTracks: tracks.length,
      activeClients: clients.length,
      totalPlays,
      engagementRate: engagementRate.toFixed(1) + '%'
    };
  }, [tracks, clients]);

  const chartData = useMemo(() => [
    { name: 'Mon', plays: 400, engagement: 240 },
    { name: 'Tue', plays: 300, engagement: 139 },
    { name: 'Wed', plays: 200, engagement: 980 },
    { name: 'Thu', plays: 278, engagement: 390 },
    { name: 'Fri', plays: 189, engagement: 480 },
    { name: 'Sat', plays: 239, engagement: 380 },
    { name: 'Sun', plays: 349, engagement: 430 },
  ], []);

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
      c.company?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
      c.tags.some(t => t.toLowerCase().includes(clientSearchQuery.toLowerCase()))
    );
  }, [clients, clientSearchQuery]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const zipInputRef = React.useRef<HTMLInputElement>(null);
  const chatImageInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClients = () => {
    fileInputRef.current?.click();
  };

  const toggleClientSelection = (id: string) => {
    setSelectedClientIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = async (status: 'online' | 'offline' | 'away') => {
    for (const id of selectedClientIds) {
      await updateClient(id, { status });
    }
    setSelectedClientIds([]);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedClientIds.length} partners?`)) return;
    for (const id of selectedClientIds) {
      await deleteClient(id);
    }
    setSelectedClientIds([]);
  };

  const handleBulkTagAdd = async () => {
    const tag = prompt("Enter tag to assign to selected partners:");
    if (!tag) return;
    for (const id of selectedClientIds) {
      const client = clients.find(c => c.id === id);
      if (client && !client.tags.includes(tag)) {
        await updateClient(id, { tags: [...client.tags, tag] });
      }
    }
    setSelectedClientIds([]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      let importedClients: any[] = [];

      try {
        if (file.name.endsWith('.json')) {
          importedClients = JSON.parse(text);
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          importedClients = lines.slice(1).filter(line => line.trim()).map(line => {
            const values = line.split(',').map(v => v.trim());
            const client: any = {};
            headers.forEach((header, index) => {
              if (values[index]) client[header] = values[index];
            });
            return client;
          });
        }

        let count = 0;
        for (const client of importedClients) {
          if (client.email && !clients.find(c => c.email === client.email)) {
            await addClient({
              name: client.name || client.email.split('@')[0],
              email: client.email,
              status: 'online'
            });
            count++;
          }
        }
        alert(`${count} industry contacts imported successfully.`);
      } catch (err) {
        console.error("Import error:", err);
        alert("Failed to parse file. Please ensure it follows the CSV or JSON format.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset for next import
  };

  const handleDeleteTrack = async (id: string) => {
    console.log(`[App] handleDeleteTrack called for ID: ${id}`);
    
    // Stop audio if deleting active track
    if (activeTrack?.id === id) {
      console.log(`[App] Deleting active track, stopping audio.`);
      stop();
    }
    
    try {
      await deleteTrack(id);
      console.log(`[App] deleteTrack context call completed for ID: ${id}`);
    } catch (err) {
      console.error(`[App] Error in handleDeleteTrack for ID: ${id}:`, err);
    }
  };

  const handleChatImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setChatAttachment(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClient) return;

    if (!file.name.endsWith('.zip')) {
      alert("Please upload a .ZIP archive for delivery.");
      return;
    }

    // Isolate cloud directory branching
    const directoryPath = `client-deliveries/${selectedClient.email.replace(/[.@]/g, '_')}/${file.name}`;

    addActivity({
      type: 'system',
      user: 'OGBeatz',
      action: `Assembling master package...`,
    });

    const simulatedDelay = (ms: number) => new Promise(res => setTimeout(res, ms));
    
    // Simulate multi-step encrypted delivery
    await simulatedDelay(800);
    addActivity({
      type: 'system',
      user: 'OGBeatz',
      action: `Encrypted routing established: ${directoryPath}`,
    });

    await simulatedDelay(1200);
    const messageContent = `Master archive delivered: ${file.name}\nResource Path: https://vault.ogbeatz.com/${directoryPath}`;
    
    await sendMessage(selectedClient.id, messageContent);
    addActivity({
      type: 'download',
      user: 'OGBeatz',
      action: 'delivered package',
      target: file.name,
      client_id: selectedClient.id
    });

    alert(`Secure master package ${file.name} successfully branched to ${selectedClient.name}'s directory.`);
    
    e.target.value = '';
  };
  const handleDownload = (track: Track) => {
    if (track.file_url) {
      const link = document.createElement('a');
      link.href = track.file_url;
      link.download = `${track.name}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("Source master file not recovered from repository.");
    }
  };

  const handleShare = (track: Track) => {
    setSharingAsset({ track });
  };

  const handleSharePlaylist = (playlist: Playlist) => {
    setSharingAsset({ playlist });
  };

  const handleRemoveTrackFromPlaylist = async (trackId: string, playlistId: string) => {
    if (confirm("Remove this track from the collection? (Source file will remain in library)")) {
      if (activeTrack?.id === trackId) {
        stop();
      }
      await removeTrackFromPlaylist(trackId, playlistId);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('share');
    const portalClient = params.get('client_portal');

    if (token) setShareToken(token);
    if (portalClient && clients.length > 0) {
       const client = clients.find(c => c.id === portalClient);
       if (client) {
          setClientPortalUser(client);
       }
    }
  }, [clients]);

  const sharedContent = useMemo(() => {
    if (!shareToken || loading || tracks.length === 0 || shareLinks.length === 0) return null;
    
    const link = shareLinks.find(l => l.token === shareToken);
    if (!link) return { invalid: true };

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
       return { expired: true };
    }

    if (link.track_id) {
       const track = tracks.find(t => t.id === link.track_id);
       if (track) return { track, link };
    } else if (link.playlist_id) {
       const playlist = playlists.find(p => p.id === link.playlist_id);
       if (playlist) return { playlist, link };
    }

    return { invalid: true };
  }, [shareToken, tracks, playlists, shareLinks, loading]);

  useEffect(() => {
    if (sharedContent?.link && hasIncrementedRef.current !== sharedContent.link.id) {
      incrementShareLinkAccess(sharedContent.link.id);
      hasIncrementedRef.current = sharedContent.link.id;
    }
  }, [sharedContent, incrementShareLinkAccess]);

  if (shareToken) {
    const displayContent = sharedContent?.link ? sharedContent : asyncSharedContent;

    if (displayContent && displayContent.link) {
      return <SharePortal track={displayContent.track} playlist={displayContent.playlist} shareLink={displayContent.link} />;
    }
    
    if (loading || (!asyncSharedContent && !shareError)) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-6">
          <div className="w-16 h-16 rounded-[2rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Music className="w-8 h-8 text-orange-500 animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white">Initializing Secure Portal</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Establishing cryptographic handshake...</p>
          </div>
        </div>
      );
    }
    // If not loading and no content, maybe link is dead. We can either show an error or fall through.
    // Let's show a clean error for better UX.
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-8 p-8 selection:bg-orange-500 selection:text-black">
        <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8 shadow-[0_0_100px_rgba(239,68,68,0.2)]">
          <Lock className="w-10 h-10 text-red-500" />
        </div>
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Access Token Invalid</h2>
          <p className="text-zinc-500 text-sm font-medium">
             {sharedContent?.expired ? "This share link has expired and self-destructed. Please request a new reference link from the producer." : (shareError || "This share link is invalid or has been revoked by the production team.")}
          </p>
        </div>
        <button 
          onClick={() => window.location.href = window.location.origin}
          className="mt-8 px-8 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors text-white"
        >
          Return Home
        </button>
      </div>
    );
  }

  if (clientPortalUser) {
    if (loading) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-6">
          <div className="w-16 h-16 rounded-[2rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Music className="w-8 h-8 text-orange-500 animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white">Loading Client Portal</h2>
          </div>
        </div>
      );
    }
    return <ClientPortal client={clientPortalUser} />;
  }

  const filteredTracks = useMemo(() => {
    return tracks.filter(t => {
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    });
  }, [tracks, searchQuery]);

  const renderVideos = () => (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase">Promo Archive</h1>
          <p className="text-zinc-500 text-sm font-medium">All AI-generated social assets and motion graphics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {promoVideos.length > 0 ? (
          promoVideos.map((video) => {
            const track = tracks.find(t => t.id === video.track_id);
            const playlist = playlists.find(p => p.id === video.playlist_id);
            const sourceName = track?.name || playlist?.name || 'Unknown Asset';
            
            return (
              <motion.div 
                key={video.id}
                layoutId={video.id}
                onClick={() => setSelectedVideoForPreview(video)}
                className="group relative bg-zinc-950 border border-zinc-900 rounded-[2.5rem] overflow-hidden cursor-pointer hover:border-orange-500/50 transition-all shadow-xl"
              >
                <div className="aspect-square relative overflow-hidden">
                  <img 
                    src={video.thumbnail_url} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70"
                    alt={sourceName}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="w-12 h-12 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                     </div>
                  </div>

                  <div className="absolute top-4 left-4">
                    <div className="px-3 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-[8px] font-black uppercase tracking-widest text-orange-500">
                      {video.style}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                   <h3 className="text-lg font-black italic uppercase tracking-tighter truncate">{sourceName}</h3>
                   <div className="flex justify-between items-center mt-2">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                        {new Date(video.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">READY</span>
                      </div>
                   </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full py-32 bg-zinc-950/50 border border-zinc-900 rounded-[3.5rem] flex flex-col items-center justify-center text-center space-y-6">
             <div className="w-20 h-20 rounded-[2rem] bg-zinc-900 flex items-center justify-center text-zinc-700">
                <Video className="w-10 h-10" />
             </div>
             <div className="space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tighter">Archive is empty</h3>
                <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Generate motion assets from the Tracks or Playlists menu.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="p-8 space-y-8">
      {/* Header Area */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase">Dashboard</h1>
          <p className="text-zinc-500 text-sm font-medium">Welcome back, OG. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={checkDatabase}
            disabled={dbStatus?.status === 'checking'}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border",
              dbStatus?.status === 'success' ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" : 
              dbStatus?.status === 'error' ? "bg-red-500/10 border-red-500 text-red-500" :
              "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white"
            )}
          >
            {dbStatus?.status === 'checking' ? <Zap className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
            {dbStatus?.status === 'checking' ? 'Testing DB...' : 
             dbStatus?.status === 'success' ? 'Connected' : 
             dbStatus?.status === 'error' ? 'Connection Error' : 'Test DB'}
          </button>
          <button 
            onClick={() => alert("Notification center synchronizing...")}
            className="p-2 text-zinc-500 hover:text-white transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <div className="absolute top-2 right-2.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-black" />
          </button>
          <button 
            onClick={() => setActiveView('profile')}
            className="flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-zinc-800 transition-all border border-zinc-800"
          >
            <User className="w-4 h-4 text-orange-500" /> Profile
          </button>
        </div>
      </div>

      {dbStatus?.message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-6 rounded-3xl border flex flex-col gap-4",
            dbStatus.status === 'success' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
          )}
        >
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", dbStatus.status === 'success' ? "bg-emerald-500" : "bg-red-500")} />
            <p className={cn("text-xs font-black uppercase tracking-widest", dbStatus.status === 'success' ? "text-emerald-500" : "text-red-500")}>
              {dbStatus.message}
            </p>
          </div>
          
          {dbStatus.status === 'error' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/40 p-4 rounded-2xl border border-white/5">
              {['tracks', 'playlists', 'clients', 'share_links', 'activities', 'messages', 'promo_videos', 'profiles', 'promo_packs', 'todos'].map(table => (
                <div key={table} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">{table}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Tracks', value: stats.totalTracks, icon: Music, trend: '+12%', color: 'text-orange-500' },
          { label: 'Active Clients', value: stats.activeClients, icon: Users, trend: '+5%', color: 'text-blue-500' },
          { label: 'Total Plays', value: stats.totalPlays.toLocaleString(), icon: Play, trend: '+18.2%', color: 'text-emerald-500' },
          { label: 'Engagement', value: stats.engagementRate, icon: TrendingUp, trend: '+2.4%', color: 'text-purple-500' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-zinc-950 border border-zinc-900 p-6 rounded-[2rem] hover:border-zinc-800 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:scale-110 transition-transform", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">{stat.trend}</span>
            </div>
            <div className="space-y-1">
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 space-y-8">
          <div className="flex items-center justify-between">
             <div>
                <h2 className="text-xl font-black tracking-tight uppercase">Performance Overview</h2>
                <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mt-1">Play trends vs Engagement metrics</p>
             </div>
             <select className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
             </select>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPlays" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#52525b', fontSize: 10, fontWeight: 900 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #18181b', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="plays" 
                  stroke="#f97316" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPlays)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Recent Activity */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 flex flex-col">
          <h2 className="text-xl font-black tracking-tight uppercase mb-8">Pulse Feed</h2>
          <div className="space-y-6 flex-1 overflow-y-auto max-h-[350px] pr-2 scrollbar-hide">
             {activities.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8).map((act) => {
               const { Icon, color, bg } = getActivityIcon(act.type);
               return (
                 <div key={act.id} className="flex gap-4 items-start group">
                   <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border border-white/5 shadow-xl shrink-0 transition-transform group-hover:scale-110", bg)}>
                     <Icon className={cn("w-5 h-5", color)} />
                   </div>
                   <div className="flex flex-col min-w-0">
                      <p className="text-[11px] leading-tight flex flex-wrap items-center">
                        <span className="font-black text-white">{act.user || 'System'}</span>
                        <span className="text-zinc-500 mx-1.5">{getActivityVerb(act.type)}</span>
                        <span className="font-black text-orange-500 hover:underline cursor-pointer truncate">
                          {getActivityLabel(act)}
                        </span>
                      </p>
                      <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mt-1.5">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                   </div>
                 </div>
               );
             })}
             {activities.length === 0 && (
               <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                  <ActivityIcon className="w-12 h-12 mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">No recent transaction logs</p>
               </div>
             )}
          </div>
          <button onClick={() => setActiveView('activity')} className="w-full mt-8 pt-6 border-t border-zinc-900 text-center text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
            Full Audit Path
          </button>
        </div>
      </div>

      {/* Track Stats Table / Secondary Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 overflow-hidden">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black uppercase tracking-tight">Top Performance</h3>
              <button onClick={() => setActiveView('tracks')} className="text-[10px] font-black uppercase tracking-widest text-orange-500">View Library</button>
           </div>
           <div className="space-y-4">
              {tracks.slice(0, 4).map(track => (
                <div key={track.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 group hover:bg-zinc-900 transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                     <div className="w-10 h-10 rounded-xl overflow-hidden border border-zinc-800">
                        <img src={track.image_url!} className="w-full h-full object-cover" />
                     </div>
                     <div className="min-w-0">
                        <p className="text-xs font-black uppercase truncate">{track.name}</p>
                        <p className="text-[10px] text-zinc-500 font-medium">{track.artist}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-6">
                     <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black">{track.plays}</span>
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Plays</span>
                     </div>
                     <button 
                       onClick={() => playTrack(track, tracks)}
                       className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                     >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                     </button>
                  </div>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 overflow-hidden">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black uppercase tracking-tight">System Status</h3>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Cloud Sync Active</span>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Database Latency', value: '18ms', status: 'optimal' },
                { label: 'Storage Usage', value: '42%', status: 'optimal' },
                { label: 'API Uptime', value: '99.9%', status: 'optimal' },
                { label: 'Active Sessions', value: stats.activeClients, status: 'optimal' },
              ].map(item => (
                <div key={item.label} className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex flex-col items-center text-center space-y-2">
                   <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{item.label}</span>
                   <span className="text-xl font-mono font-bold">{item.value}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );

  const renderTracks = () => (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">MASTER LIBRARY</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage and distribute your high-fidelity references.</p>
        </div>
        <button 
          onClick={() => setShowUpload(true)}
          className="bg-white text-black px-6 py-3 rounded-full font-black tracking-widest uppercase text-xs flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" /> Add New Master
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by name, artist, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-orange-500 transition-all"
          />
        </div>
        <button className="px-6 py-3 border border-zinc-900 rounded-2xl flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      {showUpload && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <UploadZone onSuccess={() => setShowUpload(false)} />
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTracks.map(track => (
          <div key={track.id} className="group relative bg-zinc-950 border border-zinc-900 rounded-[2rem] overflow-hidden hover:border-zinc-700 transition-all duration-500 shadow-2xl shadow-black/50 hover:shadow-orange-500/5">
              <div className="aspect-square relative overflow-hidden bg-zinc-900 flex items-center justify-center">
                {track.image_url ? (
                  <img src={track.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-zinc-800 group-hover:text-zinc-700 transition-colors">
                    <Music className="w-20 h-20" />
                    <span className="text-[10px] font-black tracking-widest uppercase opacity-40">NO ARTWORK</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <button 
                    onClick={() => playTrack(track, filteredTracks)}
                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black shadow-2xl shadow-white/10 hover:scale-110 transition-transform active:scale-95"
                  >
                    <Play className="w-8 h-8 fill-current ml-1" />
                  </button>
                </div>

                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                   <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-black tracking-widest uppercase text-white shadow-lg">
                      {track.status}
                   </div>
                    <div className="flex items-center gap-2">
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         handleDownload(track);
                       }}
                       className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
                       title="Download Track"
                     >
                       <Download className="w-5 h-5" />
                     </button>
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         setEditingTrack(track);
                       }}
                       className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
                       title="Edit Track"
                     >
                       <Edit3 className="w-5 h-5" />
                     </button>
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         handleDeleteTrack(track.id);
                       }}
                       className="w-10 h-10 rounded-full bg-rose-500/20 backdrop-blur-md border border-rose-500/30 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                       title="Delete Track"
                     >
                       <Trash2 className="w-5 h-5" />
                     </button>
                     <TrackOptionsMenu 
                      track={track}
                      onEdit={() => setEditingTrack(track)}
                      onShare={() => handleShare(track)}
                      onDownload={() => handleDownload(track)}
                      onDelete={() => handleDeleteTrack(track.id)}
                      onCreatePromo={() => setSelectedTrackForPromo(track)}
                      onCreateVideo={() => setSelectedTrackForVideo(track)}
                      onAddToPlaylist={(plId) => addTrackToPlaylist(track.id, plId)}
                      playlists={playlists}
                      className="bg-black/40 backdrop-blur-md rounded-full border border-white/10"
                     />
                   </div>
                </div>
             </div>

             <div className="p-6 space-y-4">
                <div>
                   <h3 className="text-xl font-bold tracking-tight text-white">{track.name}</h3>
                   <p className="text-zinc-500 text-sm">{track.artist}</p>
                </div>

                {track.tags && track.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {track.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[8px] font-black uppercase tracking-widest text-zinc-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 border-t border-zinc-900 pt-4">
                   <div className="text-center">
                      <p className="text-[10px] font-black text-zinc-600 uppercase">BPM</p>
                      <p className="text-sm font-mono text-zinc-300">{track.bpm}</p>
                   </div>
                   <div className="text-center border-x border-zinc-900">
                      <p className="text-[10px] font-black text-zinc-600 uppercase">Key</p>
                      <p className="text-sm font-mono text-zinc-300">{track.key_signature}</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[10px] font-black text-zinc-600 uppercase">Plays</p>
                      <p className="text-sm font-mono text-zinc-300">{(track.plays / 1000).toFixed(1)}k</p>
                   </div>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderClients = () => (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">Institutional Partners</h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Bridge the gap between feedback and final masters.</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedClientIds.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mr-2"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 mr-2">
                {selectedClientIds.length} Selected
              </span>
              <div className="h-4 w-px bg-orange-500/20 mx-1" />
              <button 
                onClick={() => handleBulkStatusUpdate('online')}
                className="text-[9px] font-black uppercase tracking-widest text-orange-500 hover:text-white transition-colors"
              >
                Set Online
              </button>
              <button 
                onClick={handleBulkTagAdd}
                className="text-[9px] font-black uppercase tracking-widest text-orange-500 hover:text-white transition-colors"
                title="Bulk Tag"
              >
                Add Tag
              </button>
              <button 
                onClick={handleBulkDelete}
                className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors"
              >
                Delete
              </button>
              <button 
                onClick={() => setSelectedClientIds([])}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input 
              type="text"
              placeholder="SEARCH PARTNERS..."
              value={clientSearchQuery}
              onChange={(e) => setClientSearchQuery(e.target.value)}
              className="bg-zinc-950 border border-zinc-900 rounded-full py-2.5 pl-12 pr-6 text-[10px] font-black uppercase tracking-widest outline-none focus:border-orange-500/50 transition-all w-64"
            />
          </div>
          <button 
            onClick={handleImportClients}
            className="px-6 py-3 border border-zinc-900 rounded-full text-[10px] font-black uppercase tracking-widest hover:border-zinc-700 transition-all text-zinc-400 hover:text-white"
          >
            Bulk Ingest
          </button>
          <button 
            onClick={() => setShowAddClient(true)}
            className="bg-white text-black px-6 py-3 rounded-full font-black tracking-widest uppercase text-xs flex items-center gap-2 hover:scale-105 transition-transform shadow-xl shadow-white/5"
          >
            <Plus className="w-4 h-4" /> Initialize Contact
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredClients.length > 0 ? filteredClients.map(client => (
          <div 
            key={client.id} 
            onClick={() => toggleClientSelection(client.id)}
            className={cn(
              "bg-zinc-950 border rounded-3xl p-6 transition-all group relative cursor-pointer",
              selectedClientIds.includes(client.id) ? "border-orange-500 ring-1 ring-orange-500/50" : "border-zinc-900 hover:border-zinc-800"
            )}
          >
            {selectedClientIds.includes(client.id) && (
              <div className="absolute top-4 right-4 z-10">
                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-black">
                  <Zap className="w-3 h-3 fill-current" />
                </div>
              </div>
            )}
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center text-3xl font-black text-orange-500 border border-zinc-800 group-hover:bg-orange-500 group-hover:text-black transition-all overflow-hidden">
                  {client.avatar_url ? (
                    <img src={client.avatar_url} className="w-full h-full object-cover" />
                  ) : client.name[0]}
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">{client.name}</h3>
                  <p className="text-zinc-500 text-sm flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> {client.email}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                     <span className={cn(
                       "flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                       client.status === 'online' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-zinc-900 text-zinc-600 border border-zinc-800"
                     )}>
                       <div className={cn("w-1.5 h-1.5 rounded-full", client.status === 'online' ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-zinc-700")} />
                       {client.status}
                     </span>
                     <span className="text-[10px] text-zinc-700 font-mono">ID: {client.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => {
                    setSelectedMessageClientId(client.id);
                    setActiveView('messages');
                  }}
                  className="p-3 rounded-2xl bg-zinc-900 hover:bg-orange-500 hover:text-black transition-all text-zinc-500 group-hover:shadow-lg group-hover:shadow-orange-500/10"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingClient(client)}
                    className="p-2 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 text-zinc-600 hover:text-white transition-all"
                    title="Edit Partner"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if(confirm("DANGER: This will purge all distribution logic for this contact. Continue?")) {
                        deleteClient(client.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-zinc-900/50 hover:bg-rose-500/20 text-zinc-600 hover:text-rose-500 transition-all"
                    title="Delete Partner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-zinc-900 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
               <div className="flex items-center gap-2">
                 <button 
                   onClick={() => setActiveView('sharing')}
                   className="px-4 py-2 bg-zinc-900 rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-white hover:text-black transition-all"
                 >
                   View Links
                 </button>
                 <button 
                   onClick={() => {
                     setSelectedClient(client);
                     setActiveView('client-detail');
                   }}
                   className="px-4 py-2 border border-zinc-800 rounded-xl text-[10px] font-black tracking-widest uppercase hover:border-zinc-600 transition-all text-zinc-500 hover:text-white"
                 >
                   Profile
                 </button>
               </div>
               <p className="text-[10px] text-zinc-700 uppercase font-bold">
                 Last Activity: {new Date(client.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </p>
            </div>
          </div>
        )) : (
          <div className="col-span-2 py-20 bg-zinc-950 border border-dashed border-zinc-900 rounded-3xl flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-zinc-900 rounded-2xl text-zinc-700 mb-4">
               <Users className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold">
              {clientSearchQuery ? "No Matching Partners" : "No Clients Registered"}
            </h3>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto mt-2 leading-relaxed">
              {clientSearchQuery 
                ? "Refine your search parameters to locate specific database entries."
                : "Import your industry contacts to start sharing track-restricted previews."
              }
            </p>
            {!clientSearchQuery && (
              <button 
                onClick={handleImportClients}
                className="mt-8 px-8 py-3 bg-white text-black rounded-full font-black tracking-widest uppercase text-xs hover:scale-105 transition-transform"
              >
                Import Clients
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderPlaylists = () => (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-6">
            {selectedPlaylist && (
              <button 
                onClick={() => setSelectedPlaylistId(null)}
                className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all shrink-0"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            )}
            {selectedPlaylist?.image_url && (
              <div className="w-20 h-20 rounded-3xl overflow-hidden border border-zinc-800 shrink-0 shadow-2xl">
                <img src={selectedPlaylist.image_url} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase">
                {selectedPlaylist ? selectedPlaylist.name : 'Collections Engine'}
              </h1>
              <p className="text-zinc-500 text-sm mt-1">
                {selectedPlaylist ? (selectedPlaylist.description || 'Master collection view.') : 'Organize your repertoire with persistent dynamic themes.'}
              </p>
            </div>
         </div>
        <div className="flex items-center gap-3">
          {selectedPlaylist && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSelectedPlaylistForVideo(selectedPlaylist)}
                className="px-6 py-3 border border-zinc-900 rounded-full text-xs font-black uppercase tracking-widest hover:border-zinc-700 transition-all text-zinc-400 hover:text-white flex items-center gap-2"
              >
                <Video className="w-4 h-4 text-orange-500" /> Promo Clip
              </button>
              <button 
                onClick={() => handleSharePlaylist(selectedPlaylist)}
                className="px-6 py-3 border border-zinc-900 rounded-full text-xs font-black uppercase tracking-widest hover:border-zinc-700 transition-all text-zinc-400 hover:text-white flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" /> Share Collection
              </button>
            </div>
          )}
          {!selectedPlaylist && (
            <button 
              onClick={() => setShowCreatePlaylist(true)}
              className="bg-white text-black px-6 py-3 rounded-full font-black tracking-widest uppercase text-xs flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4" /> Create Collection
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {selectedPlaylist ? (
          // Inner playlist view
          <div className="col-span-full space-y-4">
            <div className="flex justify-between items-center bg-zinc-950 border border-zinc-900 rounded-3xl p-6 mb-8">
               <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-600">
                    <Music className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">Compilation Logic</h3>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{selectedPlaylist.track_ids.length} Linked Assets</p>
                  </div>
               </div>
               <button 
                 onClick={() => setShowAddTracksToPlaylist(true)}
                 className="px-6 py-3 bg-orange-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-orange-500/20"
               >
                 Assemble Assets
               </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tracks.filter(t => selectedPlaylist.track_ids.includes(t.id)).length > 0 ? (
                tracks.filter(t => selectedPlaylist.track_ids.includes(t.id)).map(track => (
                  <div 
                    key={track.id} 
                    className="group relative h-80 rounded-[2.5rem] overflow-hidden border border-zinc-800 transition-all hover:border-zinc-700 hover:shadow-2xl hover:shadow-orange-500/5 bg-zinc-950"
                  >
                    <div className="absolute inset-0">
                        <img 
                          src={track.image_url!} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    </div>
                    
                    <div className="absolute top-6 right-6 flex items-center gap-2">
                       <TrackOptionsMenu 
                         track={track}
                         onEdit={() => setEditingTrack(track)}
                         onShare={() => handleShare(track)}
                         onDownload={() => handleDownload(track)}
                         onDelete={() => handleDeleteTrack(track.id)}
                         onCreatePromo={() => setSelectedTrackForPromo(track)}
                         onCreateVideo={() => setSelectedTrackForVideo(track)}
                         onAddToPlaylist={(plId) => addTrackToPlaylist(track.id, plId)}
                         playlists={playlists}
                         className="bg-black/40 backdrop-blur-md rounded-full border border-white/10"
                       />
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           handleRemoveTrackFromPlaylist(track.id, selectedPlaylist.id);
                         }}
                         title="Remove from Playlist"
                         className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                       >
                         <X className="w-5 h-5" />
                       </button>
                    </div>

                    <div className="absolute inset-0 flex flex-col justify-end p-8">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight truncate leading-none">{track.name}</h3>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-2">{track.artist}</p>
                        
                        <div className="flex items-center gap-3 mt-6">
                          <button 
                            onClick={() => playTrack(track, tracks.filter(t => selectedPlaylist.track_ids.includes(t.id)))}
                            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                          >
                            <Play className="w-5 h-5 fill-black ml-1" />
                          </button>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{track.bpm} BPM • {track.key_signature}</span>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{(track.plays / 1000).toFixed(1)}k Plays</span>
                          </div>
                        </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-32 bg-zinc-950 border border-dashed border-zinc-900 rounded-[3rem] flex flex-col items-center justify-center text-center">
                  <Music className="w-12 h-12 mb-4 opacity-20" />
                  <h3 className="text-xl font-bold uppercase italic tracking-tight">Empty Collection</h3>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest max-w-xs mx-auto mt-2 leading-relaxed">
                    This reference set currently lacks mapped audio assets.
                  </p>
                  <button 
                    onClick={() => setShowAddTracksToPlaylist(true)}
                    className="mt-8 px-8 py-3 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                  >
                    Linked Masters
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
           // Main playlists list
           playlists.map(pl => (
             <div 
               key={pl.id} 
               className="group relative h-80 rounded-[3rem] overflow-hidden border border-zinc-900 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-2xl hover:shadow-black/80"
               onClick={() => setSelectedPlaylistId(pl.id)}
             >
               <div className="absolute inset-0">
                  {pl.image_url ? (
                    <>
                      <img src={pl.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
                    </>
                  ) : (
                    <div 
                      className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity"
                      style={{ background: `linear-gradient(135deg, ${pl.start_color}, ${pl.end_color})` }}
                    />
                  )}
               </div>
              <div className="absolute top-8 right-8 flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSharePlaylist(pl);
                  }}
                  className="p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-white/60 hover:text-white transition-all opacity-0 group-hover:opacity-100 active:scale-95"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingPlaylist(pl);
                  }}
                  className="p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-white/60 hover:text-white transition-all opacity-0 group-hover:opacity-100 active:scale-95"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-10 space-y-3">
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-lg shadow-orange-500/50" />
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">{pl.track_ids.length} Tracks Inscribed</span>
                 </div>
                 <h3 className="text-4xl font-black tracking-tighter text-white leading-none uppercase italic">{pl.name}</h3>
                 <p className="text-white/60 text-[10px] font-black uppercase tracking-widest line-clamp-1 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                    {pl.description || 'Reference vault collection'}
                 </p>
              </div>
            </div>
          ))
        )}
        
        {!selectedPlaylist && (
          <button 
            onClick={() => setShowCreatePlaylist(true)}
            className="h-80 rounded-[2.5rem] border-2 border-dashed border-zinc-800 bg-zinc-950/50 flex flex-col items-center justify-center p-8 text-center group hover:border-zinc-700 transition-all"
          >
             <div className="w-16 h-16 rounded-3xl bg-zinc-900 flex items-center justify-center text-zinc-500 group-hover:bg-zinc-800 group-hover:text-white transition-all mb-4">
               <Plus className="w-8 h-8" />
             </div>
             <p className="text-zinc-500 font-bold uppercase tracking-tight text-sm">Add Reference Set</p>
          </button>
        )}
      </div>

      {showCreatePlaylist && (
         <EditPlaylistModal 
           playlist={{}} 
           isNew={true}
           onClose={() => setShowCreatePlaylist(false)}
           onSave={(data) => addPlaylist(data)}
         />
      )}
    </div>
  );

  const getActivityVerb = (type: string) => {
    switch (type) {
      case 'share': return 'shared';
      case 'upload': return 'uploaded';
      case 'analyze': return 'analyzed';
      case 'thumbs_up': return 'gave a thumbs up to';
      case 'thumbs_down': return 'gave a thumbs down to';
      case 'comment': return 'commented on';
      case 'zip_upload': return 'sent';
      case 'download': return 'downloaded';
      case 'play': return 'played';
      case 'view': return 'viewed';
      default: return 'interaction on';
    }
  };

  const getActivityLabel = (act: any) => {
    if (act.type === 'comment' && act.target && act.details) {
      return `${act.target} - ${act.details}`;
    }
    if (act.track_id && act.playlist_id) {
      const t = tracks.find(track => track.id === act.track_id);
      const p = playlists.find(pl => pl.id === act.playlist_id);
      if (t && p) return `${t.name} (${p.name})`;
    }
    return act.target || act.details || 'System Asset';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'share': return { Icon: Share2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      case 'upload': return { Icon: Download, color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'analyze': return { Icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' };
      case 'thumbs_up': return { Icon: ThumbsUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      case 'thumbs_down': return { Icon: ThumbsDown, color: 'text-rose-500', bg: 'bg-rose-500/10' };
      case 'comment': return { Icon: MessageSquare, color: 'text-orange-500', bg: 'bg-orange-500/10' };
      case 'zip_upload': return { Icon: Send, color: 'text-white', bg: 'bg-white/10' };
      default: return { Icon: ActivityIcon, color: 'text-zinc-500', bg: 'bg-zinc-500/10' };
    }
  };

  const renderActivity = () => (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">Audit Trail</h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Full transparency on master interactions and distribution.</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Live Stream Enabled</span>
        </div>
      </div>

      {activities.length > 0 ? (
        <div className="bg-zinc-950 border border-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-900 bg-zinc-900/20">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">Event Transaction</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">Asset Identity</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">Entity / Authority</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">Temporal Stamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              {activities.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((act) => {
                const { Icon, color, bg } = getActivityIcon(act.type);
                return (
                  <tr key={act.id} className="hover:bg-zinc-900/40 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", bg)}>
                          <Icon className={cn("w-5 h-5", color)} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-400">
                             {getActivityVerb(act.type)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-black italic uppercase text-zinc-300 truncate max-w-[300px]">
                        {getActivityLabel(act)}
                    </td>
                    <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center text-[8px] font-black text-zinc-500">
                                {(act.user || 'System')[0]}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{act.user || 'System'}</span>
                        </div>
                    </td>
                    <td className="px-8 py-6">
                        <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest font-mono">
                            {new Date(act.timestamp).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-40 bg-zinc-950 border border-dashed border-zinc-900 rounded-[4rem] flex flex-col items-center justify-center text-center px-12">
            <div className="w-20 h-20 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center text-zinc-800 mb-8 border border-zinc-800 shadow-xl">
                <ActivityIcon className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-black tracking-tighter uppercase italic mb-3">Silent Ledger</h3>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                Your operational nexus is currently empty. Initialize distribution links or upload masters to begin logging the audit trail.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-12">
                <button 
                  onClick={() => setActiveView('sharing')}
                  className="px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-transform shadow-xl"
                >
                  Generate Share
                </button>
                <button 
                  onClick={() => setActiveView('tracks')}
                  className="px-8 py-4 bg-zinc-900 text-white border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all"
                >
                  Upload Masters
                </button>
            </div>
        </div>
      )}
    </div>
  );

  const renderMessages = () => {
    const activeChatClient = clients.find(c => c.id === selectedMessageClientId);
    const activeChatMessages = messages.filter(m => m.client_id === selectedMessageClientId);

    const handleSendClientMessage = async () => {
      if ((!clientMessageDraft.trim() && !chatAttachment) || !selectedMessageClientId) return;
      await sendMessage(selectedMessageClientId, clientMessageDraft.trim(), chatAttachment);
      setClientMessageDraft("");
      setChatAttachment(null);
    };

    return (
      <div className="flex h-[calc(100vh-140px)] bg-black overflow-hidden border-t border-zinc-900 rounded-b-[4rem]">
        {/* Split-Pane Sidebar */}
        <div className="w-80 lg:w-96 bg-zinc-950 border-r border-zinc-900 flex flex-col">
          <div className="p-8 border-b border-zinc-900 bg-zinc-900/10">
            <h2 className="text-2xl font-black tracking-tighter uppercase italic">Communications</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mt-1">Studio-to-Partner Distribution Directives</p>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 scrollbar-hide">
            {clients.map(client => {
              const lastMsg = messages.filter(m => m.client_id === client.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
              return (
                <button 
                  key={client.id}
                  onClick={() => setSelectedMessageClientId(client.id)}
                  className={cn(
                    "w-full p-5 rounded-3xl flex items-center gap-4 transition-all group relative border",
                    selectedMessageClientId === client.id 
                      ? "bg-zinc-900 border-orange-500/50 shadow-xl shadow-orange-500/5" 
                      : "bg-transparent border-transparent hover:bg-zinc-900/40"
                  )}
                >
                  <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-center text-lg font-black text-orange-500 italic shrink-0 shadow-lg overflow-hidden">
                    {client.avatar_url ? (
                        <img src={client.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                        client.name[0]
                    )}
                  </div>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-black text-white truncate">{client.name}</span>
                      {lastMsg && (
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                          {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 font-bold truncate w-full uppercase tracking-widest mt-1 opacity-70">
                      {lastMsg ? lastMsg.content : 'Initialize production loop...'}
                    </p>
                  </div>
                  {client.status === 'online' && (
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Focused Chat Pane */}
        <div className="flex-1 flex flex-col relative">
          {activeChatClient ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-orange-500/20 flex items-center justify-center text-xl font-black text-orange-500 italic shadow-xl overflow-hidden">
                    {activeChatClient.avatar_url ? (
                        <img src={activeChatClient.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                        activeChatClient.name[0]
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight italic text-white leading-none">{activeChatClient.name}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                       <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{activeChatClient.company || 'Private Authorized Personnel'}</span>
                       <div className="flex items-center gap-1.5">
                          <div className={cn("w-1.5 h-1.5 rounded-full", activeChatClient.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700')} />
                          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{activeChatClient.status}</span>
                       </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <button className="p-3 text-zinc-600 hover:text-white transition-colors">
                      <Settings className="w-4 h-4" />
                   </button>
                </div>
              </div>

              {/* Message History Feed */}
              <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
                {activeChatMessages.map((msg, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={msg.id} 
                    className={cn(
                      "max-w-[75%] p-6 rounded-[2.5rem] text-sm leading-relaxed relative group",
                      msg.direction === 'outbound' 
                          ? "bg-orange-500 text-black font-bold self-end rounded-br-none ml-auto shadow-2xl shadow-orange-500/10" 
                          : "bg-zinc-900 text-zinc-300 font-medium self-start rounded-bl-none border border-zinc-800"
                    )}
                  >
                    {msg.image_url && (
                        <div className="mb-4 rounded-3xl overflow-hidden border border-black/10">
                            <img src={msg.image_url} alt="Attachment" className="max-w-full h-auto" />
                        </div>
                    )}
                    {msg.content}
                    <div className={cn(
                        "mt-3 text-[9px] font-black uppercase tracking-tighter opacity-40",
                        msg.direction === 'outbound' ? "text-black text-right" : "text-zinc-500"
                    )}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </motion.div>
                ))}
                {activeChatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center py-40 opacity-30">
                     <MessageSquare className="w-16 h-16 text-zinc-800 mb-6" />
                     <p className="text-[10px] font-black uppercase tracking-[0.25em]">Awaiting secure input...</p>
                  </div>
                )}
              </div>

              {/* Input Interaction Tray */}
              <div className="p-10 border-t border-zinc-900 bg-zinc-950/50 backdrop-blur-md">
                <div className="max-w-4xl mx-auto relative">
                  {chatAttachment && (
                      <div className="absolute bottom-full left-0 mb-6 p-3 bg-zinc-950 border border-zinc-900 rounded-[2rem] flex items-center gap-4 shadow-2xl">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-black border border-zinc-900">
                              <img src={chatAttachment} className="w-full h-full object-cover" />
                          </div>
                          <button 
                              onClick={() => setChatAttachment(null)}
                              className="p-2 hover:text-rose-500 transition-colors"
                          >
                              <X className="w-5 h-5" />
                          </button>
                      </div>
                  )}
                  <textarea 
                    value={clientMessageDraft}
                    onChange={(e) => setClientMessageDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendClientMessage())}
                    placeholder="Draft master direct..."
                    className="w-full bg-black border border-zinc-900 rounded-[2.5rem] p-6 pr-20 text-sm font-medium outline-none focus:border-orange-500 focus:shadow-2xl focus:shadow-orange-500/10 transition-all resize-none h-32 scrollbar-hide"
                  />
                  <div className="absolute right-4 bottom-4 flex gap-2">
                      <button 
                          onClick={() => chatImageInputRef.current?.click()}
                          className="p-3 text-zinc-500 hover:text-white transition-all hover:rotate-45"
                      >
                          <Paperclip className="w-6 h-6" />
                      </button>
                      <input 
                          type="file"
                          ref={chatImageInputRef}
                          onChange={handleChatImageUpload}
                          accept="image/*"
                          className="hidden"
                      />
                      <button 
                          onClick={handleSendClientMessage}
                          className="p-4 bg-orange-500 rounded-[1.25rem] text-black shadow-2xl shadow-orange-500/20 hover:scale-110 active:scale-95 transition-all"
                      >
                          <Send className="w-6 h-6" />
                      </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
               <div className="w-32 h-32 bg-zinc-950 border border-zinc-900 rounded-[3.5rem] flex items-center justify-center text-zinc-800 mb-10 shadow-2xl relative overflow-hidden group">
                 <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <MessageSquare className="w-12 h-12 opacity-10 group-hover:opacity-30 transition-all group-hover:scale-110" />
               </div>
               <h3 className="text-3xl font-black tracking-tighter uppercase italic mb-3">Communication Nexus</h3>
               <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.25em] max-w-sm mx-auto leading-loose opacity-60">
                 Select an active studio partner from the vertical directory to initialize bidirectional directive exchange.
               </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSharing = () => (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">Access Control</h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Manage active portal links and distribution verification.</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Distribution Logic Online</span>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-900 bg-zinc-900/20">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">Distribution Link</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">Recipient / Client</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">Usage Metrics</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">Expiration</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/50">
            {shareLinks.map(link => {
              const track = tracks.find(t => t.id === link.track_id);
              const playlist = playlists.find(p => p.id === link.playlist_id);
              const assetName = track ? track.name : playlist ? playlist.name : 'Unknown Asset';
              const client = clients.find(c => c.id === link.client_id);
              
              return (
                <tr key={link.id} className="hover:bg-zinc-900/40 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black italic uppercase text-white truncate max-w-[200px]">{assetName}</span>
                      <span className="text-[9px] font-bold text-zinc-600 font-mono mt-1">ID: {link.token}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-[10px] font-black text-orange-500 italic border border-zinc-800">
                        {(client?.name || link.recipient_email || '?')[0]}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{client?.name || link.recipient_email || 'Public Link'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <TrendingUp className="w-3 h-3 text-emerald-500" />
                       <span className="text-sm font-black">{link.access_count}</span>
                       <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 ml-1">Accesses</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 italic">
                      {link.expires_at ? new Date(link.expires_at).toLocaleDateString() : 'ELITE ACCESS'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <button className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-rose-500 transition-all hover:scale-110">
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {shareLinks.length === 0 && (
              <tr>
                <td colSpan={5} className="py-40 text-center opacity-30">
                  <Share2 className="w-12 h-12 mx-auto mb-4 text-zinc-800" />
                  <p className="text-[10px] font-black uppercase tracking-[0.25em]">No active distribution links generated.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateProfile({ avatar_url: url });
    }
  };

  const renderProfile = () => {
    if (!profile) return null;
    return (
      <div className="p-8 space-y-12 max-w-4xl">
        <div className="flex items-end gap-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-2 border-orange-500/20 group-hover:border-orange-500 transition-colors">
              <img src={profile.avatar_url} className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-orange-500 text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              <Plus className="w-4 h-4" />
            </button>
            <input 
              type="file" 
              ref={avatarInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarChange} 
            />
          </div>
          <div className="pb-2">
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">{profile.artist_name}</h1>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] bg-zinc-900 px-3 py-1 rounded-full inline-block mt-2">Master Engineer & Producer</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Artist Bio</h3>
              <textarea 
                value={profile.bio}
                onChange={(e) => updateProfile({ bio: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-900 rounded-3xl p-6 text-sm font-medium leading-relaxed outline-none focus:border-orange-500/50 transition-colors h-40 resize-none"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Contact Integration</h3>
              <div className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input 
                    value={profile.email}
                    onChange={(e) => updateProfile({ email: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold outline-none focus:border-orange-500/50 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Network Presence</h3>
              <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 space-y-6">
                {[
                  { label: 'Instagram', value: profile.social_links.instagram, key: 'instagram' },
                  { label: 'Spotify', value: profile.social_links.spotify, key: 'spotify' },
                  { label: 'SoundCloud', value: profile.social_links.soundcloud, key: 'soundcloud' },
                ].map((link) => (
                  <div key={link.label} className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">{link.label}</label>
                    <input 
                      value={link.value || ''}
                      onChange={(e) => updateProfile({ 
                        social_links: { ...profile.social_links, [link.key]: e.target.value } 
                      })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-orange-500/50 transition-all"
                      placeholder={`Enter ${link.label} handle...`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] flex items-center gap-6">
               <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-orange-500" />
               </div>
               <div>
                  <h3 className="text-xl font-black uppercase tracking-tight italic">Elite Producer Account</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Authorized access to OGBeatz Proprietary Hub</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderClientDetail = () => {
    if (!selectedClient) return null;

    const clientActivities = activities.filter(a => a.client_id === selectedClient.id);
    const clientMessages = messages.filter(m => m.client_id === selectedClient.id);
    
    const feedbackCounts = {
        likes: clientActivities.filter(a => a.type === 'like').length,
        dislikes: clientActivities.filter(a => a.type === 'comment' && a.details?.toLowerCase().includes('dislike')).length,
        comments: clientActivities.filter(a => a.type === 'comment').length
    };

    const handleSendMessage = async () => {
        if (!clientMessageDraft.trim() && !chatAttachment) return;
        await sendMessage(selectedClient.id, clientMessageDraft, chatAttachment);
        setClientMessageDraft('');
        setChatAttachment(null);
    };

    return (
      <div className="p-8 space-y-12">
        <div className="flex items-center gap-4 text-zinc-500 mb-4">
          <button 
            onClick={() => setActiveView('clients')}
            className="flex items-center gap-2 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
          >
            <ChevronLeft className="w-4 h-4" /> Network Directory
          </button>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-[2.5rem] bg-zinc-950 border border-orange-500/20 flex items-center justify-center text-4xl font-black text-orange-500 italic shadow-2xl relative overflow-hidden">
              {selectedClient.avatar_url ? (
                  <img src={selectedClient.avatar_url} className="w-full h-full object-cover" />
              ) : (
                  selectedClient.name[0]
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-zinc-950 border-4 border-black flex items-center justify-center">
                 <div className={`w-2 h-2 rounded-full ${selectedClient.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tighter uppercase italic">{selectedClient.name}</h1>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                   <Mail className="w-3 h-3 text-orange-500" /> {selectedClient.email}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                   <Users className="w-3 h-3 text-orange-500" /> Authorized Partner
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="grid grid-cols-3 gap-3 mr-6">
                {[
                    { label: 'Likes', icon: ThumbsUp, color: 'text-emerald-500', value: feedbackCounts.likes },
                    { label: 'Dislikes', icon: ThumbsDown, color: 'text-rose-500', value: feedbackCounts.dislikes },
                    { label: 'Feedback', icon: MessageSquare, color: 'text-orange-500', value: feedbackCounts.comments },
                ].map(stat => (
                    <div key={stat.label} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-3 text-center min-w-[80px]">
                        <stat.icon className={cn("w-4 h-4 mx-auto mb-1", stat.color)} />
                        <p className="text-xl font-black">{stat.value}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{stat.label}</p>
                    </div>
                ))}
             </div>
             <div className="flex gap-3">
                <button 
                    onClick={() => {
                       const url = `${window.location.origin}/?client_portal=${selectedClient.id}`;
                       window.open(url, '_blank');
                    }}
                    className="border border-zinc-800 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-orange-500 hover:text-orange-500 transition-colors"
                >
                    View Portal
                </button>
                <button 
                    onClick={() => zipInputRef.current?.click()}
                    className="bg-orange-500 text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-orange-500/20"
                >
                    Ship Masters
                </button>
                <input 
                    type="file" 
                    ref={zipInputRef} 
                    onChange={handleSendZip} 
                    accept=".zip" 
                    className="hidden" 
                />
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Activity Timeline</h3>
              <div className="bg-zinc-950 border border-zinc-900 rounded-[3rem] overflow-hidden p-8">
                <div className="max-h-[400px] overflow-y-auto pr-4 scrollbar-hide relative">
                    {clientActivities.length > 0 ? (
                        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent">
                            {clientActivities.map((act, index) => (
                                <div key={act.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    {/* Icon */}
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-zinc-950 bg-zinc-900 text-orange-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110">
                                        {act.type === 'play' && <Play className="w-4 h-4 fill-current" />}
                                        {act.type === 'like' && <ThumbsUp className="w-4 h-4" />}
                                        {act.type === 'download' && <Download className="w-4 h-4" />}
                                        {act.type === 'social' && <MessageSquare className="w-4 h-4" />}
                                        {!['play', 'like', 'download', 'social'].includes(act.type) && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                                    </div>
                                    
                                    {/* Activity Card */}
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-zinc-900 bg-zinc-950/50 hover:bg-zinc-900/50 transition-colors shadow-xl group-hover:border-zinc-800">
                                        <div className="flex flex-col space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-white">{act.action}</span>
                                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{new Date(act.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <span className="text-xs italic font-black uppercase text-zinc-500 truncate">{act.target || 'System Port'}</span>
                                            {act.details && (
                                                <p className="text-xs text-zinc-400 mt-2">{act.details}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 rounded-3xl bg-zinc-900 flex items-center justify-center text-zinc-700 mb-4">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                                No historical logs found for this entity.
                            </p>
                        </div>
                    )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Communication Terminal</h3>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 italic">Live Stream Enabled</span>
                    </div>
                </div>
                <div className="bg-zinc-950 border border-zinc-900 rounded-[3rem] p-8 flex flex-col h-[500px]">
                    <div className="flex-1 overflow-y-auto space-y-6 pr-4 mb-8 scrollbar-hide">
                        {clientMessages.length > 0 ? clientMessages.map(msg => (
                            <div key={msg.id} className={cn(
                                "max-w-[80%] p-5 rounded-3xl text-sm leading-relaxed",
                                msg.direction === 'outbound' 
                                    ? "bg-orange-500 text-black font-bold self-end rounded-br-none ml-auto" 
                                    : "bg-zinc-900 text-zinc-300 font-medium self-start rounded-bl-none"
                            )}>
                                {msg.image_url && (
                                    <div className="mb-3 rounded-2xl overflow-hidden border border-black/10">
                                        <img src={msg.image_url} alt="Attachment" className="max-w-full h-auto" />
                                    </div>
                                )}
                                {msg.content}
                                <div className={cn(
                                    "mt-2 text-[8px] font-black uppercase tracking-widest",
                                    msg.direction === 'outbound' ? "text-black/40" : "text-zinc-600"
                                )}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <MessageSquare className="w-12 h-12 text-zinc-900 mb-4" />
                                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Initialization successful. Awaiting first transmission.</p>
                            </div>
                        )}
                    </div>
                    <div className="relative">
                        {chatAttachment && (
                            <div className="absolute bottom-full left-0 mb-4 p-2 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-black border border-zinc-800">
                                    <img src={chatAttachment} className="w-full h-full object-cover" />
                                </div>
                                <button 
                                    onClick={() => setChatAttachment(null)}
                                    className="p-1 hover:text-rose-500 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <textarea 
                            value={clientMessageDraft}
                            onChange={(e) => setClientMessageDraft(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                            placeholder="Draft production update..."
                            className="w-full bg-black border border-zinc-900 rounded-2xl p-5 pr-16 text-sm font-medium outline-none focus:border-orange-500 focus:shadow-xl focus:shadow-orange-500/5 transition-all resize-none h-24"
                        />
                        <div className="absolute right-4 bottom-4 flex gap-2">
                            <button 
                                onClick={() => chatImageInputRef.current?.click()}
                                className="p-3 text-zinc-600 hover:text-white transition-colors"
                            >
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <input 
                                type="file"
                                ref={chatImageInputRef}
                                onChange={handleChatImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            <button 
                                onClick={handleSendMessage}
                                className="p-3 bg-orange-500 rounded-xl text-black shadow-lg shadow-orange-500/20 hover:scale-110 active:scale-95 transition-all"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <div className="space-y-12">
             <div className="space-y-6">
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Intelligence Briefing</h3>
                 <div className="p-8 bg-zinc-950 border border-zinc-900 rounded-[3rem] space-y-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Primary Hub</label>
                      <p className="text-lg font-black uppercase italic tracking-tight">{selectedClient.company || 'Private Agent'}</p>
                   </div>
                   
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Assigned Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedClient.tags.length > 0 ? selectedClient.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[9px] font-black uppercase tracking-widest text-orange-500">{tag}</span>
                        )) : <span className="text-zinc-700 italic text-xs">No tags allocated</span>}
                      </div>
                   </div>

                   <div className="pt-8 border-t border-zinc-900">
                      <div className="flex justify-between items-end mb-3">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Relational Strength</p>
                            <p className="text-2xl font-black italic">ELITE</p>
                        </div>
                        <span className="text-3xl font-black italic text-orange-500">92%</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                        <div className="h-full bg-orange-500 rounded-full w-[92%] shadow-lg shadow-orange-500/50" />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-zinc-900/50 border border-zinc-900 rounded-2xl">
                         <p className="text-[8px] font-black uppercase text-zinc-600 tracking-widest mb-1">Downloads</p>
                         <p className="text-lg font-black">{clientActivities.filter(a => a.type === 'download').length}</p>
                      </div>
                      <div className="p-4 bg-zinc-900/50 border border-zinc-900 rounded-2xl">
                         <p className="text-[8px] font-black uppercase text-zinc-600 tracking-widest mb-1">Streams</p>
                         <p className="text-lg font-black">{clientActivities.filter(a => a.type === 'play').length}</p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Active Access Nodes</h3>
                <div className="bg-zinc-950 border border-zinc-900 rounded-[3rem] p-8 space-y-4">
                  {shareLinks.filter(l => l.client_id === selectedClient.id).length > 0 ? (
                    shareLinks.filter(l => l.client_id === selectedClient.id).map(link => {
                      const track = tracks.find(t => t.id === link.track_id);
                      const playlist = playlists.find(p => p.id === link.playlist_id);
                      const name = track?.name || playlist?.name || 'Unknown Hub';
                      
                      return (
                        <div key={link.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-between group hover:border-orange-500/50 transition-all font-sans">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-black border border-zinc-800 flex items-center justify-center text-orange-500">
                                {track ? <Music className="w-5 h-5" /> : <LayoutDashboard className="w-5 h-5" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[120px]">{name}</span>
                              <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5 font-mono">
                                {link.expires_at ? `EXPIRES: ${new Date(link.expires_at).toLocaleDateString()}` : 'ELITE STATUS'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black">{link.access_count}</p>
                            <p className="text-[6px] font-black text-zinc-600 uppercase tracking-widest">Accesses</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center opacity-30">
                       <Share2 className="w-8 h-8 mb-3" />
                       <p className="text-[8px] font-black uppercase tracking-widest">No dedicated nodes active.</p>
                    </div>
                  )}
                </div>
             </div>

             <div className="p-10 bg-orange-500 rounded-[3.5rem] text-black space-y-8 shadow-2xl shadow-orange-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                <div className="w-16 h-16 bg-black rounded-[2rem] flex items-center justify-center shadow-2xl relative z-10">
                   <Lock className="w-8 h-8 text-orange-500" />
                </div>
                <div className="relative z-10">
                   <h4 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Security<br/>Handshake</h4>
                   <p className="text-sm font-bold leading-tight mt-4 opacity-80 max-w-[200px]">
                        Cryptographic stream verification is active for this partner identity.
                   </p>
                </div>
                <button 
                   onClick={() => alert("Credentials rotated successfully.")}
                   className="w-full py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all relative z-10"
                >
                   Rotate Access Key
                </button>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Shell activeView={activeView} onViewChange={(v) => setActiveView(v)}>
      <div className="pb-24">
        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'tracks' && renderTracks()}
        {activeView === 'clients' && renderClients()}
        {activeView === 'playlists' && renderPlaylists()}
        {activeView === 'videos' && renderVideos()}
        {activeView === 'activity' && renderActivity()}
        {activeView === 'messages' && renderMessages()}
        {activeView === 'sharing' && renderSharing()}
        {activeView === 'profile' && renderProfile()}
        {activeView === 'client-detail' && renderClientDetail()}
        {/* Settings View */}
        {activeView === 'settings' && (
          <div className="p-8 space-y-8 max-w-2xl">
             <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase text-white">System Configuration</h1>
                <p className="text-zinc-500 text-sm mt-1">Calibrate your production environment and security protocols.</p>
             </div>
             
             <div className="space-y-6">
                <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl space-y-4">
                   <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Account Security</h3>
                   <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                      <div className="space-y-1">
                        <p className="text-sm font-bold">Two-Factor Authentication</p>
                        <p className="text-xs text-zinc-500">Protect your master assets with extra logic.</p>
                      </div>
                      <div className="w-12 h-6 bg-zinc-800 rounded-full relative cursor-pointer">
                         <div className="absolute right-1 top-1 w-4 h-4 bg-orange-500 rounded-full" />
                      </div>
                   </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl space-y-4">
                   <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Storage Profile</h3>
                   <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase">
                        <span>Vault Usage</span>
                        <span>4.2GB / 10GB</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                         <div className="h-full bg-orange-500 w-[42%]" />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      <AudioPlayer onEdit={(track) => setEditingTrack(track)} />
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".csv,.json" 
        className="hidden" 
      />

      <AnimatePresence>
        {selectedTrackForPromo && (
           <PromoPackModal 
             track={selectedTrackForPromo} 
             onClose={() => setSelectedTrackForPromo(null)} 
           />
        )}
        {editingTrack && (
          <EditTrackModal 
            track={editingTrack}
            onClose={() => setEditingTrack(null)}
            onSave={updateTrack}
            onDelete={handleDeleteTrack}
          />
        )}
        {editingPlaylist && (
          <EditPlaylistModal 
            playlist={editingPlaylist}
            onClose={() => setEditingPlaylist(null)}
            onSave={(updates) => updatePlaylist(editingPlaylist.id, updates)}
            onDelete={(id) => {
              deletePlaylist(id);
              if (selectedPlaylistId === id) setSelectedPlaylistId(null);
            }}
          />
        )}
        {editingClient && (
          <EditClientModal 
            client={editingClient}
            onClose={() => setEditingClient(null)}
          />
        )}
        {(selectedTrackForVideo || selectedPlaylistForVideo) && (
          <VideoGenerationModal 
            track={selectedTrackForVideo || undefined}
            playlist={selectedPlaylistForVideo || undefined}
            onClose={() => {
              setSelectedTrackForVideo(null);
              setSelectedPlaylistForVideo(null);
            }}
          />
        )}
        {showAddClient && (
          <AddClientModal onClose={() => setShowAddClient(false)} />
        )}
        {selectedPlaylist && showAddTracksToPlaylist && (
          <AddTrackToPlaylistModal 
            playlist={selectedPlaylist}
            onClose={() => setShowAddTracksToPlaylist(false)}
          />
        )}
        {sharingAsset && (
          <ShareModal 
            track={sharingAsset.track}
            playlist={sharingAsset.playlist}
            onClose={() => setSharingAsset(null)}
          />
        )}
        {selectedVideoForPreview && (
          <VideoPreviewModal 
            video={selectedVideoForPreview}
            onClose={() => setSelectedVideoForPreview(null)}
          />
        )}
      </AnimatePresence>
    </Shell>
  );
}

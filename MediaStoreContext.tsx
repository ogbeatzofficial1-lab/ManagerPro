import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Track, Playlist, Client, Activity, ShareLink, UserProfile, Message, PromoVideo } from '@/src/types';
import { getSupabaseClient } from "@/src/lib/supabase";

interface MediaStoreContextType {
  tracks: Track[];
  playlists: Playlist[];
  clients: Client[];
  activities: Activity[];
  profile: UserProfile | null;
  loading: boolean;
  addTrack: (track: Partial<Track>) => Promise<Track>;
  updateTrack: (id: string, updates: Partial<Track>) => Promise<void>;
  deleteTrack: (id: string) => Promise<void>;
  addPlaylist: (playlist: Partial<Playlist>) => Promise<void>;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addTrackToPlaylist: (trackId: string, playlistId: string) => Promise<void>;
  removeTrackFromPlaylist: (trackId: string, playlistId: string) => Promise<void>;
  addClient: (client: Partial<Client>) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  shareLinks: ShareLink[];
  addShareLink: (link: Partial<ShareLink>) => Promise<ShareLink>;
  getShareContent: (token: string) => Promise<{ track?: Track, playlist?: Playlist, link: ShareLink } | null>;
  addActivity: (activity: Partial<Activity>) => Promise<void>;
  analyzeTrack: (name: string) => Promise<{ bpm: number, key: string, duration?: number }>;
  messages: Message[];
  sendMessage: (clientId: string, content: string, image_url?: string | null) => Promise<void>;
  promoVideos: PromoVideo[];
  addPromoVideo: (video: Partial<PromoVideo>) => Promise<void>;
  deletePromoVideo: (id: string) => Promise<void>;
  incrementShareLinkAccess: (id: string) => Promise<void>;
  uploadFile: (bucket: string, file: File) => Promise<string | null>;
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  connected: boolean;
}

const UUID_TRACK_1 = "11111111-1111-1111-1111-111111111111";
const UUID_TRACK_2 = "22222222-2222-2222-2222-222222222222";
const UUID_TRACK_3 = "33333333-3333-3333-3333-333333333333";
const UUID_TRACK_4 = "44444444-4444-4444-4444-444444444444";

const UUID_PLAYLIST_1 = "55555555-5555-5555-5555-555555555555";
const UUID_PLAYLIST_2 = "66666666-6666-6666-6666-666666666666";

const UUID_CLIENT_1 = "77777777-7777-7777-7777-777777777777";
const UUID_CLIENT_2 = "88888888-8888-8888-8888-888888888888";

const UUID_MSG_1 = "99999999-9999-9999-9999-999999999991";
const UUID_MSG_2 = "99999999-9999-9999-9999-999999999992";
const UUID_MSG_3 = "99999999-9999-9999-9999-999999999993";

const UUID_ACT_1 = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1";
const UUID_ACT_2 = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2";
const UUID_ACT_3 = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3";

const UUID_PROFILE = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

const MOCK_TRACKS: Track[] = [
  {
    id: UUID_TRACK_1,
    name: "Tokyo Drift Vibe",
    artist: "OG BEATZ",
    bpm: 140,
    key_signature: "F#m",
    duration: 182,
    tags: ["Trap", "Dark", "Heavy", "Car Music"],
    status: 'ready' as const,
    size: 4200000,
    type: "audio/mpeg",
    file_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    image_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop",
    plays: 247,
    likes: 84,
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: UUID_TRACK_2,
    name: "Midnight Coffee",
    artist: "OG BEATZ",
    bpm: 85,
    key_signature: "Am",
    duration: 210,
    tags: ["Lofi", "Chill", "Relaxed", "Study"],
    status: 'ready' as const,
    size: 5100000,
    type: "audio/mpeg",
    file_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    image_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=300&auto=format&fit=crop",
    plays: 412,
    likes: 195,
    created_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: UUID_TRACK_3,
    name: "Chrome Plated",
    artist: "OG BEATZ",
    bpm: 142,
    key_signature: "D#m",
    duration: 165,
    tags: ["Drill", "Aggressive", "Gritty", "Industrial"],
    status: 'ready' as const,
    size: 3800000,
    type: "audio/mpeg",
    file_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    image_url: "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=300&auto=format&fit=crop",
    plays: 139,
    likes: 56,
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: UUID_TRACK_4,
    name: "Acoustic Sunset",
    artist: "OG BEATZ",
    bpm: 112,
    key_signature: "G",
    duration: 195,
    tags: ["Acoustic", "Melodic", "Organic", "Guitar"],
    status: 'ready' as const,
    size: 4500000,
    type: "audio/mpeg",
    file_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    image_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop",
    plays: 89,
    likes: 34,
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  }
];

const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: UUID_PLAYLIST_1,
    name: "Unreleased Master Vol. 1",
    description: "Premium beats curated for label executives and A&R review.",
    image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop",
    track_ids: [UUID_TRACK_1, UUID_TRACK_3],
    start_color: "#f97316",
    end_color: "#ea580c",
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: UUID_PLAYLIST_2,
    name: "Late Night Chill Sessions",
    description: "Lofi and acoustic beats perfect for songwriting and mood setting.",
    image_url: "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?q=80&w=300&auto=format&fit=crop",
    track_ids: [UUID_TRACK_2, UUID_TRACK_4],
    start_color: "#8b5cf6",
    end_color: "#6d28d9",
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
  }
];

const MOCK_CLIENTS: Client[] = [
  {
    id: UUID_CLIENT_1,
    name: "Marcus Cole",
    email: "marcus@epicrecords.com",
    status: "online",
    last_active: new Date().toISOString(),
    tags: ["A&R", "Epic Records", "Billboard"],
    company: "Epic Records",
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: UUID_CLIENT_2,
    name: "Sarah Jenkins",
    email: "sarah@independent.io",
    status: "offline",
    last_active: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    tags: ["Vocalist", "Independent Artist", "Collab"],
    company: "Independent",
    created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  }
];

const MOCK_MESSAGES: Message[] = [
  {
    id: UUID_MSG_1,
    client_id: UUID_CLIENT_1,
    recipient_id: "producer@ogbeatz.com",
    content: "Yo! Just listened to 'Tokyo Drift Vibe'. This is perfect for the new album project. Can we discuss licensing?",
    direction: "inbound",
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    is_read: false
  },
  {
    id: UUID_MSG_2,
    client_id: UUID_CLIENT_1,
    recipient_id: "marcus@epicrecords.com",
    content: "Let me know when you are free for a call. I need the track stems draft as well.",
    direction: "inbound",
    timestamp: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
    is_read: false
  },
  {
    id: UUID_MSG_3,
    client_id: UUID_CLIENT_2,
    recipient_id: "producer@ogbeatz.com",
    content: "Hey, the 'Late Night' beats packet is beautiful! Working on some vocal melodies tonight.",
    direction: "inbound",
    timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    is_read: true
  }
];

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: UUID_ACT_1,
    type: "play",
    user: "Marcus Cole",
    action: "listened to",
    target: "Tokyo Drift Vibe",
    details: "Played 100% of track",
    track_id: UUID_TRACK_1,
    client_id: UUID_CLIENT_1,
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: UUID_ACT_2,
    type: "download",
    user: "Sarah Jenkins",
    action: "downloaded",
    target: "Midnight Coffee",
    details: "Standard WAV license",
    track_id: UUID_TRACK_2,
    client_id: UUID_CLIENT_2,
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
  },
  {
    id: UUID_ACT_3,
    type: "share",
    user: "OG BEATZ",
    action: "generated links for",
    target: "Unreleased Master Vol. 1",
    playlist_id: UUID_PLAYLIST_1,
    timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
  }
];

const MOCK_PROFILE: UserProfile = {
  id: UUID_PROFILE,
  name: "OG BEATZ",
  artist_name: "OG BEATZ",
  email: "producer@ogbeatz.com",
  avatar_url: "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=300&auto=format&fit=crop",
  bio: "Master Recording Engineer, Multi-Platinum Producer, & Architect of OG BEATZ vault.",
  social_links: {
    instagram: "ogbeatz_prod",
    spotify: "ogbeatz",
    twitter: "ogbeatz"
  }
};

const MediaStoreContext = createContext<MediaStoreContextType | undefined>(undefined);

export function MediaStoreProvider({ children }: { children: React.ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>(() => {
    try {
      const cached = localStorage.getItem('ogbeatz_tracks');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) return parsed;
      }
      return MOCK_TRACKS;
    } catch {
      return MOCK_TRACKS;
    }
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const cached = localStorage.getItem('ogbeatz_playlists');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) return parsed;
      }
      return MOCK_PLAYLISTS;
    } catch {
      return MOCK_PLAYLISTS;
    }
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const cached = localStorage.getItem('ogbeatz_clients');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) return parsed;
      }
      return MOCK_CLIENTS;
    } catch {
      return MOCK_CLIENTS;
    }
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    try {
      const cached = localStorage.getItem('ogbeatz_activities');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) return parsed;
      }
      return MOCK_ACTIVITIES;
    } catch {
      return MOCK_ACTIVITIES;
    }
  });

  const [shareLinks, setShareLinks] = useState<ShareLink[]>(() => {
    try {
      const cached = localStorage.getItem('ogbeatz_share_links');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const cached = localStorage.getItem('ogbeatz_messages');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) return parsed;
      }
      return MOCK_MESSAGES;
    } catch {
      return MOCK_MESSAGES;
    }
  });

  const [promoVideos, setPromoVideos] = useState<PromoVideo[]>(() => {
    try {
      const cached = localStorage.getItem('ogbeatz_promo_videos');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem('ogbeatz_profile');
      return cached ? JSON.parse(cached) : MOCK_PROFILE;
    } catch {
      return MOCK_PROFILE;
    }
  });

  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = uuidv4();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Sync to local storage whenever states change (only after loading is complete to protect cached data from startup blank states)
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem('ogbeatz_tracks', JSON.stringify(tracks));
        localStorage.setItem('ogbeatz_playlists', JSON.stringify(playlists));
        localStorage.setItem('ogbeatz_clients', JSON.stringify(clients));
        localStorage.setItem('ogbeatz_activities', JSON.stringify(activities));
        localStorage.setItem('ogbeatz_share_links', JSON.stringify(shareLinks));
        localStorage.setItem('ogbeatz_messages', JSON.stringify(messages));
        localStorage.setItem('ogbeatz_promo_videos', JSON.stringify(promoVideos));
        if (profile) {
          localStorage.setItem('ogbeatz_profile', JSON.stringify(profile));
        }
      } catch (e) {
        console.warn("Could not sync to localStorage:", e);
      }
    }
  }, [tracks, playlists, clients, activities, shareLinks, messages, promoVideos, profile, loading]);

  useEffect(() => {
    async function init() {
      try {
        // Run getSupabaseClient with an automatic connection timeout of 15 seconds
        const activeSupabase = await Promise.race([
          getSupabaseClient(),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Supabase connection timeout")), 15000))
        ]).catch(err => {
          console.warn("Supabase initialization timed out; utilizing offline schema fallback:", err);
          return null;
        });

        if (activeSupabase) {
          setSupabase(activeSupabase);
          setConnected(true);
          try {
            const fetchSafely = async (table: string) => {
              // Wrap fetch queries with a loose 15-second timeout to handle cold starts and sleep states gracefully
              return Promise.race([
                activeSupabase.from(table).select('*'),
                new Promise<any>((_, reject) => setTimeout(() => reject(new Error(`Fetch timed out for table ${table}`)), 15000))
              ]).then(({ data, error }) => {
                if (error) {
                  console.warn(`Error fetching ${table}:`, error);
                  return null;
                }
                return data;
              }).catch(err => {
                console.warn(`Fetch timed out or failed for ${table}:`, err);
                return null;
              });
            };

            // Initiate parallel fetches and coordinate seeding for empty Postgres database tables
            const [
              fetchedTracks,
              fetchedPlaylists,
              fetchedClients,
              fetchedShares,
              fetchedActivities,
              fetchedMessages,
              fetchedPromoVideos
            ] = await Promise.all([
              fetchSafely('tracks'),
              fetchSafely('playlists'),
              fetchSafely('clients'),
              fetchSafely('share_links'),
              fetchSafely('activities'),
              fetchSafely('messages'),
              fetchSafely('promo_videos')
            ]);

            if (fetchedTracks) {
              if (fetchedTracks.length === 0) {
                console.log("Seeding tracks table in Supabase...");
                await activeSupabase.from('tracks').insert(MOCK_TRACKS);
                setTracks(MOCK_TRACKS);
              } else {
                setTracks(fetchedTracks);
              }
            }

            if (fetchedPlaylists) {
              if (fetchedPlaylists.length === 0) {
                console.log("Seeding playlists table in Supabase...");
                await activeSupabase.from('playlists').insert(MOCK_PLAYLISTS);
                setPlaylists(MOCK_PLAYLISTS);
              } else {
                setPlaylists(fetchedPlaylists);
              }
            }

            if (fetchedClients) {
              if (fetchedClients.length === 0) {
                console.log("Seeding clients table in Supabase...");
                await activeSupabase.from('clients').insert(MOCK_CLIENTS);
                setClients(MOCK_CLIENTS);
              } else {
                setClients(fetchedClients);
              }
            }

            if (fetchedShares) {
              setShareLinks(fetchedShares);
            }

            if (fetchedActivities) {
              if (fetchedActivities.length === 0) {
                await activeSupabase.from('activities').insert(MOCK_ACTIVITIES);
                setActivities(MOCK_ACTIVITIES);
              } else {
                setActivities(fetchedActivities);
              }
            }

            if (fetchedMessages) {
              if (fetchedMessages.length === 0) {
                await activeSupabase.from('messages').insert(MOCK_MESSAGES);
                setMessages(fetchedMessages);
              } else {
                setMessages(fetchedMessages);
              }
            }

            if (fetchedPromoVideos) {
              setPromoVideos(fetchedPromoVideos);
            }
            
            let profData = null;
            const { data: existingProf, error: profError } = await Promise.race([
              activeSupabase.from('profiles').select('*').single(),
              new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Profile fetch timeout')), 15000))
            ]).catch(err => {
              console.warn("Profile fetch timed out:", err);
              return { data: null, error: err };
            });

            if (profError && profError.code !== 'PGRST116') {
              console.warn("Profile fetch error:", profError);
            }
            
            if (existingProf) {
              profData = existingProf;
            } else if (!existingProf && (profError?.code === 'PGRST116' || !profError)) {
              // No profile row in the DB: create a starting master producer profile
              const defaultProf: UserProfile = {
                id: uuidv4(),
                name: "OG BEATZ",
                artist_name: "OG BEATZ",
                bio: "Master Recording Engineer, Multi-Platinum Producer, & Architect of OG BEATZ vault.",
                email: "producer@ogbeatz.com",
                avatar_url: "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=300&auto=format&fit=crop",
                social_links: {
                  instagram: "ogbeatz_prod",
                  spotify: "ogbeatz",
                  twitter: "ogbeatz"
                }
              };
              const { error: insertError } = await Promise.race([
                activeSupabase.from('profiles').insert(defaultProf),
                new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Profile creation timeout')), 15000))
              ]).catch(err => {
                console.warn("Profile creation timed out:", err);
                return { error: err };
              });

              if (!insertError) {
                profData = defaultProf;
              } else {
                console.error("Error creating default profile in Supabase:", insertError);
              }
            }
            
            setProfile(profData || profile || {
              id: "default-id",
              name: "OG BEATZ",
              artist_name: "OG BEATZ",
              bio: "Master Recording Engineer, Multi-Platinum Producer, & Architect of OG BEATZ vault.",
              email: "producer@ogbeatz.com",
              avatar_url: "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=300&auto=format&fit=crop",
              social_links: {
                instagram: "ogbeatz_prod",
                spotify: "ogbeatz",
                twitter: "ogbeatz"
              }
            });

          } catch (e) {
            console.error("Supabase load error:", e);
          }
        }
      } catch (err) {
        console.error("Error during MediaStore init:", err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);
  const addTrack = async (track: Partial<Track>) => {
    const newTrack: Track = {
      id: uuidv4(),
      name: track.name || "Untitled",
      artist: track.artist || "OGBeatz",
      duration: track.duration || 0,
      bpm: track.bpm || 120,
      key_signature: track.key_signature || "C",
      tags: track.tags || [],
      file_url: track.file_url || null,
      image_url: track.image_url || null,
      size: track.size || 0,
      type: track.type || "audio/mpeg",
      plays: 0,
      likes: 0,
      status: "ready",
      created_at: new Date().toISOString(),
      ...track
    };

    setTracks(prev => [newTrack, ...prev]);
    
    if (supabase) {
      const dbTrack = { ...newTrack } as any;
      delete dbTrack.file_data;
      delete dbTrack.image_data;
      const { error } = await supabase.from('tracks').insert(dbTrack);
      if (error) {
        console.error("Error inserting track into Supabase:", error);
        addToast(`Failed to save track to database: ${error.message}`, 'error');
      } else {
        addToast(`Successfully saved track "${newTrack.name}" to database!`, 'success');
      }
    } else {
      addToast(`Track "${newTrack.name}" added locally. Database is offline.`, 'info');
    }

    addActivity({
      type: 'upload',
      user: 'OGBeatz',
      action: 'uploaded',
      target: newTrack.name,
      timestamp: new Date().toISOString()
    });

    return newTrack;
  };

  const updateTrack = async (id: string, updates: Partial<Track>) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    
    if (supabase) {
      const dbUpdates = { ...updates } as any;
      delete dbUpdates.file_data;
      delete dbUpdates.image_data;
      const { error } = await supabase.from('tracks').update(dbUpdates).eq('id', id);
      if (error) {
        console.error("Error updating track in Supabase:", error);
        addToast(`Failed to update track in database: ${error.message}`, 'error');
      } else {
        addToast(`Successfully updated track in database!`, 'success');
      }
    }
  };

  const deleteTrack = async (id: string) => {
    console.log(`[MediaStore] Initializing deletion for track: ${id}`);
    try {
      // States are updated via Realtime or immediately here
      setTracks(prev => prev.filter(t => t.id !== id));
      setPlaylists(prev => prev.map(pl => ({
        ...pl,
        track_ids: (pl.track_ids || []).filter(tid => tid !== id)
      })));
      setPromoVideos(prev => prev.filter(v => v.track_id !== id));
      setShareLinks(prev => prev.filter(l => l.track_id !== id));

      if (supabase) {
        const { error } = await supabase.from('tracks').delete().eq('id', id);
        if (error) {
          console.error("Error deleting track:", error);
          addToast(`Failed to delete track from backend: ${error.message}`, 'error');
        } else {
          addToast("Track purged from database successfully.", 'success');
        }
      }

      addActivity({
        type: 'system',
        user: 'OGBeatz',
        action: `Purged asset ${id} from reference library`,
        timestamp: new Date().toISOString()
      });
      
      console.log(`[MediaStore] Successfully deleted track: ${id}`);
    } catch (error: any) {
      console.error("[MediaStore] Deletion Failure:", error);
      addToast(`Deletion Failed: ${error.message || error}`, 'error');
    }
  };

  const addTrackToPlaylist = async (trackId: string, playlistId: string) => {
    let newTrackIds: string[] = [];
    setPlaylists(prev => {
      const updated = prev.map(pl => {
        if (pl.id === playlistId) {
          if (pl.track_ids.includes(trackId)) return pl;
          newTrackIds = [...pl.track_ids, trackId];
          return { ...pl, track_ids: newTrackIds };
        }
        return pl;
      });
      return updated;
    });
    
    if (supabase && newTrackIds.length > 0) {
      const { error } = await supabase.from('playlists').update({ track_ids: newTrackIds }).eq('id', playlistId);
      if (error) {
        console.error(error);
        addToast(`Failed to add track to database playlist: ${error.message}`, 'error');
      } else {
        addToast("Added track to playlist in database!", "success");
      }
    }
  };

  const removeTrackFromPlaylist = async (trackId: string, playlistId: string) => {
    let newTrackIds: string[] = [];
    setPlaylists(prev => {
      const updated = prev.map(pl => {
        if (pl.id === playlistId) {
          newTrackIds = pl.track_ids.filter(tid => tid !== trackId);
          return { ...pl, track_ids: newTrackIds };
        }
        return pl;
      });
      return updated;
    });
    
    if (supabase) {
      const { error } = await supabase.from('playlists').update({ track_ids: newTrackIds }).eq('id', playlistId);
      if (error) {
        console.error(error);
        addToast(`Failed to remove track from database playlist: ${error.message}`, 'error');
      } else {
        addToast("Removed track from playlist in database!", "success");
      }
    }
  };

  const updatePlaylist = async (id: string, updates: Partial<Playlist>) => {
    setPlaylists(prev => prev.map(pl => pl.id === id ? { ...pl, ...updates } : pl));
    
    if (supabase) {
      const { error } = await supabase.from('playlists').update(updates).eq('id', id);
      if (error) {
        console.error(error);
        addToast(`Failed to update playlist: ${error.message}`, 'error');
      } else {
        addToast("Playlist updated in database!", "success");
      }
    }
  };

  const deletePlaylist = async (id: string) => {
    setPlaylists(prev => prev.filter(pl => pl.id !== id));
    if (supabase) {
      const { error } = await supabase.from('playlists').delete().eq('id', id);
      if (error) {
        console.error(error);
        addToast(`Failed to delete playlist from database: ${error.message}`, 'error');
      } else {
        addToast("Playlist deleted from database!", "success");
      }
    }
  };

  const addPlaylist = async (playlist: Partial<Playlist>) => {
    const newPl: Playlist = {
      id: uuidv4(),
      name: playlist.name || "New Playlist",
      description: playlist.description || "",
      image_url: playlist.image_url || "",
      track_ids: [],
      start_color: playlist.start_color || "#f97316",
      end_color: playlist.end_color || "#ea580c",
      created_at: new Date().toISOString()
    };
    setPlaylists(prev => [...prev, newPl]);
    if (supabase) {
      const { error } = await supabase.from('playlists').insert(newPl);
      if (error) {
        console.error(error);
        addToast(`Failed to create playlist in database: ${error.message}`, 'error');
      } else {
        addToast(`Playlist "${newPl.name}" saved to database!`, 'success');
      }
    }
  };

  const addClient = async (client: Partial<Client>) => {
    const rawEmail = client.email || "unknown@client.com";
    const normalizedEmail = rawEmail.trim().toLowerCase();
    
    const deriveDisplayNameFromEmail = (email: string) => {
      const localPart = email.split('@')[0];
      return localPart
        .split(/[._-]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    let existingId: string | null = null;
    let updatesToApply: any = null;
    let newClientToInsert: Client | null = null;

    setClients(prev => {
      const existingClient = prev.find(c => c.email.toLowerCase() === normalizedEmail);
      if (existingClient) {
        existingId = existingClient.id;
        updatesToApply = {
          name: client.name || existingClient.name,
          status: 'online' as const,
          last_active: new Date().toISOString(),
        };
        return prev.map(c => c.id === existingClient.id ? { ...c, ...updatesToApply } : c);
      } else {
        newClientToInsert = {
          id: uuidv4(),
          name: client.name || deriveDisplayNameFromEmail(normalizedEmail),
          email: normalizedEmail,
          status: client.status || "online",
          last_active: new Date().toISOString(),
          tags: client.tags || [],
          created_at: new Date().toISOString(),
          ...client
        };
        return [...prev, newClientToInsert];
      }
    });

    if (supabase) {
      if (existingId && updatesToApply) {
        const { error } = await supabase.from('clients').update(updatesToApply).eq('id', existingId);
        if (error) {
          console.error(error);
          addToast(`Failed to update client in database: ${error.message}`, 'error');
        } else {
          addToast("Client logged in & updated!", 'success');
        }
      } else if (newClientToInsert) {
        const { error } = await supabase.from('clients').insert(newClientToInsert);
        if (error) {
          console.error(error);
          addToast(`Failed to register client in database: ${error.message}`, 'error');
        } else {
          addToast(`Client "${newClientToInsert.name}" registered in database!`, 'success');
        }
      }
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    if (supabase) {
      const { error } = await supabase.from('clients').update(updates).eq('id', id);
      if (error) {
        console.error(error);
        addToast(`Failed to update client: ${error.message}`, 'error');
      } else {
        addToast("Client profile updated in database!", 'success');
      }
    }
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    if (supabase) {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) {
        console.error(error);
        addToast(`Failed to delete client: ${error.message}`, 'error');
      } else {
        addToast("Client removed from database!", 'success');
      }
    }
    
    addActivity({
      type: 'system',
      user: 'OGBeatz',
      action: `Removed client ${id}`,
      timestamp: new Date().toISOString()
    });
  };

  const sendMessage = async (clientId: string, content: string, image_url?: string | null) => {
    const newMessage: Message = {
      id: uuidv4(),
      client_id: clientId,
      recipient_id: '',
      content,
      image_url: image_url || null,
      direction: 'outbound',
      timestamp: new Date().toISOString(),
      is_read: false
    };

    let clientName = 'Client';

    setClients(prevClients => {
      const client = prevClients.find(c => c.id === clientId);
      if (client) {
        newMessage.recipient_id = client.email;
        clientName = client.name;
      }
      return prevClients;
    });
    
    if (!newMessage.recipient_id) return;

    setMessages(prev => [...prev, newMessage]);

    if (supabase) {
      const { error } = await supabase.from('messages').insert(newMessage);
      if (error) {
        console.error(error);
        addToast(`Message sending failed in DB: ${error.message}`, 'error');
      } else {
        addToast("Message successfully sent and persisted!", 'success');
      }
    }

    addActivity({
      type: 'social',
      user: 'OGBeatz',
      action: `Sent message to ${clientName}`,
      details: content,
      client_id: clientId
    });
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    setProfile(updated);
    if (supabase) {
      const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);
      if (error) {
        console.error(error);
        addToast(`Failed to save profile: ${error.message}`, 'error');
      } else {
        addToast("Profile settings saved to database!", 'success');
      }
    }
  };

  const addShareLink = async (link: Partial<ShareLink>) => {
    const secureToken = Array.from(window.crypto.getRandomValues(new Uint8Array(20)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const newLink: ShareLink = {
      id: uuidv4(),
      token: secureToken,
      download_enabled: link.download_enabled ?? true,
      expires_at: link.expires_at || null,
      access_count: 0,
      created_at: new Date().toISOString(),
      ...link
    };
    
    setShareLinks(prev => [...prev, newLink]);

    if (supabase) {
      const { error } = await supabase.from('share_links').insert(newLink);
      if (error) {
        console.error(error);
        addToast(`Failed to create database share link: ${error.message}`, 'error');
      } else {
        addToast("Share link synced to live database!", 'success');
      }
    }
    return newLink;
  };

  const getShareContent = async (token: string) => {
    if (!supabase) return null;

    try {
      const { data: linkData, error: linkError } = await supabase
        .from('share_links')
        .select('*')
        .eq('token', token)
        .single();

      if (linkError || !linkData) return null;

      const link = linkData as ShareLink;

      let track: Track | undefined;
      let playlist: Playlist | undefined;

      if (link.track_id) {
        const { data: tr } = await supabase
          .from('tracks')
          .select('*')
          .eq('id', link.track_id)
          .single();
        if (tr) track = tr as Track;
      } else if (link.playlist_id) {
        const { data: pl } = await supabase
          .from('playlists')
          .select('*')
          .eq('id', link.playlist_id)
          .single();
        
        if (pl) {
           playlist = pl as Playlist;
           const { data: playlistTracks } = await supabase
             .from('tracks')
             .select('*')
             .in('id', playlist.track_ids);
           
           if (playlistTracks) {
              setTracks(prev => {
                const uniqueNew = playlistTracks.filter(nt => !prev.some(et => et.id === nt.id));
                return [...prev, ...uniqueNew];
              });
           }
        }
      }

      return { track, playlist, link };
    } catch (e) {
      console.error("getShareContent Failure:", e);
      return null;
    }
  };

  const addActivity = async (activity: Partial<Activity>) => {
    const newActivity: Activity = {
      id: uuidv4(),
      type: activity.type || 'system',
      user: activity.user || 'Unknown',
      action: activity.action || 'Performed action',
      timestamp: new Date().toISOString(),
      ...activity
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 50));
    if (supabase) {
      const { error } = await supabase.from('activities').insert(newActivity);
      if (error) console.error(error);
    }
  };

  const incrementShareLinkAccess = async (id: string) => {
    let newCount = 0;
    setShareLinks(prev => {
      const link = prev.find(l => l.id === id);
      if (!link) return prev;
      newCount = (link.access_count || 0) + 1;
      return prev.map(l => l.id === id ? { ...l, access_count: newCount } : l);
    });
    
    if (supabase && newCount > 0) {
      const { error } = await supabase
        .from('share_links')
        .update({ access_count: newCount })
        .eq('id', id);
      if (error) console.error(error);
    }
  };

  const addPromoVideo = async (video: Partial<PromoVideo>) => {
    const newVideo: PromoVideo = {
      id: uuidv4(),
      video_url: video.video_url || '',
      thumbnail_url: video.thumbnail_url || '',
      style: video.style || 'minimalist',
      status: video.status || 'processing',
      created_at: new Date().toISOString(),
      ...video
    };
    setPromoVideos(prev => [...prev, newVideo]);
    if (supabase) {
      const dbVideo = { ...newVideo } as any;
      // Strip out non-serializable binary data before inserting into database table
      delete dbVideo.video_data;
      delete dbVideo.thumbnail_data;
      const { error } = await supabase.from('promo_videos').insert(dbVideo);
      if (error) {
        console.error("Error inserting promo video:", error);
        addToast(`Failed to register promo asset in database: ${error.message}`, 'error');
      } else {
        addToast("Promo video asset added to database!", 'success');
      }
    }
  };

  const deletePromoVideo = async (id: string) => {
    setPromoVideos(prev => prev.filter(v => v.id !== id));
    if (supabase) {
      const { error } = await supabase.from('promo_videos').delete().eq('id', id);
      if (error) {
        console.error(error);
        addToast(`Failed to purge promo video from database: ${error.message}`, 'error');
      } else {
        addToast("Promo video purged from database!", 'success');
      }
    }
  };

  const analyzeTrack = async (name: string): Promise<{ bpm: number, key: string, duration?: number, tags?: string[] }> => {
    const cleanName = name.replace(/\.[^/.]+$/, ""); // Remove extension
    const cleanLower = cleanName.toLowerCase();

    // 1. BPM Heuristic
    let bpm = 120;
    const bpmMatch = cleanLower.match(/(\d{2,3})\s*(?:bpm|BPM)/);
    if (bpmMatch) {
      bpm = parseInt(bpmMatch[1], 10);
    } else {
      const numbers = cleanLower.match(/\b\d{2,3}\b/g);
      if (numbers) {
        for (const numStr of numbers) {
          const num = parseInt(numStr, 10);
          if (num >= 60 && num <= 200) {
            bpm = num;
            break;
          }
        }
      }
    }

    // 2. Key Signature Heuristic
    let key = "C Major";
    const standardKeys = [
      "Am", "Bm", "Cm", "Dm", "Em", "Fm", "Gm",
      "A#m", "C#m", "D#m", "F#m", "G#m",
      "Abm", "Bbm", "Ebm",
      "A", "B", "C", "D", "E", "F", "G",
      "A#", "C#", "D#", "F#", "G#"
    ];
    const sortedKeys = [...standardKeys].sort((a, b) => b.length - a.length);
    const words = cleanName.split(/[\s_\-\[\]\(\)]+/);
    for (const word of words) {
      if (sortedKeys.includes(word)) {
        key = word;
        break;
      }
      const matchedKey = sortedKeys.find(k => k.toLowerCase() === word.toLowerCase());
      if (matchedKey) {
        key = matchedKey;
        break;
      }
    }

    // 3. Duration Heuristic (between 130s and 230s based on title length)
    const duration = 120 + (cleanName.length * 3) % 111;

    // 4. Tags Heuristic
    const tags: string[] = [];
    const genreKeywords = [
      { keys: ["trap", "808"], tags: ["Trap", "Dark", "Heavy"] },
      { keys: ["drill", "grime", "uk"], tags: ["Drill", "Aggressive", "Gritty"] },
      { keys: ["lofi", "lo-fi", "chillhop", "study"], tags: ["Lofi", "Chill", "Relaxed"] },
      { keys: ["boombap", "boom bap", "90s", "eastcoast"], tags: ["BoomBap", "Classic", "Groovy"] },
      { keys: ["chill", "ambient", "cloud", "smooth"], tags: ["Chill", "Ambient", "Smooth"] },
      { keys: ["guitar", "acoustic", "guitarra"], tags: ["Acoustic", "Melodic", "Organic"] },
      { keys: ["piano", "keys", "emotional", "sad"], tags: ["Piano", "Emotional", "Soulful"] },
      { keys: ["synth", "retro", "wave", "cyber"], tags: ["Synth", "Futuristic", "Electronic"] },
      { keys: ["soul", "r&b", "rb", "motown"], tags: ["R&B", "Soulful", "Smooth"] },
      { keys: ["pop", "upbeat", "dance", "synthpop"], tags: ["Pop", "Upbeat", "Dance"] }
    ];

    for (const item of genreKeywords) {
      if (item.keys.some(k => cleanLower.includes(k))) {
        tags.push(...item.tags);
      }
    }

    const uniqueTags = Array.from(new Set(tags)).slice(0, 4);
    if (uniqueTags.length === 0) {
      uniqueTags.push("Instrumental", "OGBeatz", "Producer Mode");
    }

    return { bpm, key, duration, tags: uniqueTags };
  };

  const uploadFile = async (bucket: string, file: File): Promise<string | null> => {
    if (!supabase) {
      console.warn("Supabase not initialized for uploading.");
      return null;
    }
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file
      let { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);

      // If bucket doesn't exist, create it and retry once
      if (uploadError && (uploadError.message === 'Bucket not found' || (uploadError as any).status === 404)) {
        console.log(`Bucket '${bucket}' not found. Attempting auto-creation...`);
        const { error: bucketError } = await supabase.storage.createBucket(bucket, { public: true });
        if (!bucketError) {
          const { error: retryError } = await supabase.storage.from(bucket).upload(filePath, file);
          if (retryError) throw retryError;
        } else {
          console.error("Failed to auto-create bucket:", bucketError);
          throw uploadError;
        }
      } else if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return data?.publicUrl || null;
    } catch (e) {
      console.error(`Supabase file upload error in bucket '${bucket}':`, e);
      return null;
    }
  };

  return (
    <MediaStoreContext.Provider value={{
      tracks, playlists, clients, activities, profile, loading, shareLinks, messages, promoVideos,
      addTrack, updateTrack, deleteTrack, addPlaylist, updatePlaylist, deletePlaylist, addTrackToPlaylist, removeTrackFromPlaylist,
      addClient, updateClient, deleteClient, updateProfile, addShareLink, getShareContent, addActivity, analyzeTrack, sendMessage, addPromoVideo, deletePromoVideo, incrementShareLinkAccess,
      uploadFile,
      toasts, addToast, removeToast, connected
    }}>
      {children}
    </MediaStoreContext.Provider>
  );
}

export function useMediaStore() {
  const context = useContext(MediaStoreContext);
  if (!context) throw new Error('useMediaStore must be used within MediaStoreProvider');
  return context;
}

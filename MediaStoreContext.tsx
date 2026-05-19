import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import localforage from 'localforage';
import { Track, Playlist, Client, Activity, ShareLink, UserProfile, Message, PromoVideo } from '../types';
import { supabase } from "../lib/supabase";


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
}

const MediaStoreContext = createContext<MediaStoreContextType | undefined>(undefined);

export function MediaStoreProvider({ children }: { children: React.ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [promoVideos, setPromoVideos] = useState<PromoVideo[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      if (supabase) {
        try {
          const fetchSafely = async (table: string) => {
            const { data, error } = await supabase!.from(table).select('*');
            if (error) {
              console.warn(`Error fetching ${table}:`, error);
              return null;
            }
            return data;
          };

          const trData = await fetchSafely('tracks');
          const plData = await fetchSafely('playlists');
          const clData = await fetchSafely('clients');
          const slData = await fetchSafely('share_links');
          const actData = await fetchSafely('activities');
          const msgData = await fetchSafely('messages');
          const pvData = await fetchSafely('promo_videos');

          // Fallback + Migration
          let apiDb: any = null;
          try {
            const res = await fetch('/api/media');
            if (res.ok) apiDb = await res.json();
          } catch (e) {}

          const safeParseList = async (tableData: any, localKey: string, tableName: string) => {
            if (tableData && tableData.length > 0) return tableData;

            // Supabase table is empty, try to get from localForage
            let locally = await localforage.getItem(localKey);
            
            // If localForage is empty, try apiDb (mock data)
            if (!locally || (Array.isArray(locally) && locally.length === 0)) {
               const collectionName = localKey.replace('mm_', '');
               if (apiDb && apiDb[collectionName] && apiDb[collectionName].length > 0) {
                  locally = apiDb[collectionName];
               }
            }

            if (locally && Array.isArray(locally) && locally.length > 0) {
              console.log(`Migrating ${locally.length} items to Supabase table ${tableName}`);
              // Try migrating to Supabase - sanitize first to remove non-DB fields
              const sanitizedDbItems = locally.map(item => {
                const copy = { ...item };
                Object.keys(copy).forEach(key => {
                  if (key.startsWith('_') || key.endsWith('_data')) {
                    delete (copy as any)[key];
                  }
                });
                return copy;
              });
              const { error } = await supabase!.from(tableName).insert(sanitizedDbItems);
              if (error) {
                console.error(`🔴 Failed to migrate ${tableName} to Supabase:`, error.message, error.details);
              } else {
                console.log(`✅ Successfully migrated ${locally.length} items to Supabase table ${tableName}`);
              }
              return locally;
            }
            return [];
          };

          setTracks(await safeParseList(trData, 'mm_tracks', 'tracks'));
          setPlaylists(await safeParseList(plData, 'mm_playlists', 'playlists'));
          setClients(await safeParseList(clData, 'mm_clients', 'clients'));
          setShareLinks(await safeParseList(slData, 'mm_share_links', 'share_links'));
          setActivities(await safeParseList(actData, 'mm_activities', 'activities'));
          setMessages(await safeParseList(msgData, 'mm_messages', 'messages'));
          setPromoVideos(await safeParseList(pvData, 'mm_promo_videos', 'promo_videos'));
          
          const { data: profData, error: profError } = await supabase.from('profiles').select('*').single();
          if (profError && profError.code !== 'PGRST116') { // Ignore zero rows error for profile
            console.warn("Profile fetch error:", profError);
          }
          if (profData) {
            setProfile(profData);
          } else {
             let locallyProf = await localforage.getItem<UserProfile>('mm_profile');
             if (!locallyProf && apiDb && apiDb.profile) {
                locallyProf = apiDb.profile;
             }
             if (locallyProf) {
                console.log(`Migrating profile to Supabase...`);
                // Try migrating profile
                const sanitizedProf = { ...locallyProf };
                Object.keys(sanitizedProf).forEach(key => {
                  if (key.startsWith('_') || key.endsWith('_data')) {
                    delete (sanitizedProf as any)[key];
                  }
                });
                const { error } = await supabase.from('profiles').insert(sanitizedProf);
                if (error) {
                  console.error("🔴 Failed to migrate profile to Supabase:", error.message);
                } else {
                  console.log("✅ Successfully migrated profile to Supabase");
                }
                setProfile(locallyProf);
             } else {
                setProfile(null);
             }
          }

        } catch (e) {
          console.error("Supabase load error:", e);
          await loadFromLocal();
        }
      } else {
        await loadFromLocal();
      }
      setLoading(false);
    }

    async function loadFromLocal() {
      const loadKey = async <T,>(key: string): Promise<T | null> => {
        let val: T | null = null;
        try {
          val = await localforage.getItem<T>(key);
        } catch (e) {
          console.warn(`LocalForage getItem error for ${key}:`, e);
        }
        
        // Migrate from localStorage if localForage is empty
        if (val == null || (Array.isArray(val) && val.length === 0)) {
          const lsVal = localStorage.getItem(key);
          if (lsVal) {
            try {
              const parsed = JSON.parse(lsVal) as T;
              if ((Array.isArray(parsed) && parsed.length > 0) || (!Array.isArray(parsed) && parsed)) {
                val = parsed;
                localforage.setItem(key, parsed).catch(() => {});
              }
            } catch (e) {}
          }
        }
        return val;
      };

      let apiDb: any = null;
      try {
        const res = await fetch('/api/media');
        if (res.ok) {
          apiDb = await res.json();
        }
      } catch (e) {
        console.warn("API GET failed, using localForage fallback", e);
      }

      const getApiOrLocal = async <T,>(apiData: any, localKey: string): Promise<T | null> => {
         if (apiData && (Array.isArray(apiData) ? apiData.length > 0 : !!apiData)) return apiData;
         return await loadKey<T>(localKey);
      };

      const localTracks = await getApiOrLocal<any[]>(apiDb?.tracks, 'mm_tracks');
      const localPlaylists = await getApiOrLocal<any[]>(apiDb?.playlists, 'mm_playlists');
      const localClients = await getApiOrLocal<any[]>(apiDb?.clients, 'mm_clients');
      const localShareLinks = await getApiOrLocal<any[]>(apiDb?.share_links, 'mm_share_links');
      const localMessages = await getApiOrLocal<any[]>(apiDb?.messages, 'mm_messages');
      const localPromoVideos = await getApiOrLocal<any[]>(apiDb?.promo_videos, 'mm_promo_videos');
      const localActivities = await getApiOrLocal<any[]>(apiDb?.activities, 'mm_activities');
      const localProfile = await getApiOrLocal<UserProfile>(apiDb?.profile, 'mm_profile');
      
      let parsedTracks = localTracks || [];
      
      const cleanedTracks = parsedTracks.map((t: Track) => {
        if (t.file_data && t.file_data instanceof Blob) {
           t.file_url = URL.createObjectURL(t.file_data);
           t._brokenBlob = false;
        } else if (t.file_url?.startsWith('blob:')) {
          delete t.file_url;
          t._brokenBlob = true; 
        }
        if (t.image_data && t.image_data instanceof Blob) {
           t.image_url = URL.createObjectURL(t.image_data);
        }
        return t;
      });
      setTracks(cleanedTracks);

      setPlaylists(localPlaylists || []);
      setClients(localClients || []);
      setMessages(localMessages || []);
      setShareLinks(localShareLinks || []);
      
      const parsedVideos = localPromoVideos || [];
      const cleanedVideos = parsedVideos.map((v: PromoVideo) => {
        if (v.video_data && v.video_data instanceof Blob) {
           v.video_url = URL.createObjectURL(v.video_data);
           v._brokenBlob = false;
        } else if (v.video_url?.startsWith('blob:')) {
          delete (v as any).video_url;
          v._brokenBlob = true;
        }
        if (v.thumbnail_data && v.thumbnail_data instanceof Blob) {
           v.thumbnail_url = URL.createObjectURL(v.thumbnail_data);
        }
        return v;
      });
      setPromoVideos(cleanedVideos);
      
      setActivities(localActivities || []);
      
      const defaultProfile: UserProfile = {
        id: 'd86412e8-0888-444a-8f64-96695368a44b', // Valid UUID
        name: 'OG Beatz',
        artist_name: 'OGBeatz',
        bio: 'Premium sound architecture and master engineering.',
        email: 'og@beatz.com',
        avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=400&fit=crop',
        social_links: {
          instagram: '@ogbeatz',
          spotify: 'ogbeatz-official'
        }
      };
      setProfile(localProfile || defaultProfile);
    }

    init();
  }, []);

  // Realtime Subscriptions
  useEffect(() => {
    if (!supabase) return;

    const handleChanges = (payload: any, setter: React.Dispatch<React.SetStateAction<any[]>>, label: string) => {
      console.log(`📡 [Realtime] ${label} change:`, payload.eventType);
      
      if (payload.eventType === 'INSERT') {
        setter(prev => {
          if (prev.some(item => item.id === payload.new.id)) return prev;
          return [payload.new, ...prev];
        });
      } else if (payload.eventType === 'UPDATE') {
        setter(prev => prev.map(item => item.id === payload.new.id ? { ...item, ...payload.new } : item));
      } else if (payload.eventType === 'DELETE') {
        setter(prev => prev.filter(item => item.id === payload.old.id));
      }
    };

    const channel = supabase
      .channel('public-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracks' }, (p) => handleChanges(p, setTracks, 'Tracks'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'playlists' }, (p) => handleChanges(p, setPlaylists, 'Playlists'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, (p) => handleChanges(p, setActivities, 'Activities'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (p) => handleChanges(p, setClients, 'Clients'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (p) => handleChanges(p, setMessages, 'Messages'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'share_links' }, (p) => handleChanges(p, setShareLinks, 'ShareLinks'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promo_videos' }, (p) => handleChanges(p, setPromoVideos, 'PromoVideos'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
          if (payload.eventType === 'UPDATE' && profile && payload.new.id === profile.id) {
            setProfile(prev => prev ? { ...prev, ...payload.new } : payload.new);
          }
      })
      .subscribe((status) => {
        console.log(`📶 [Realtime] Subscription Status: ${status}`);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, profile?.id]);


  const safeSave = async (key: string, data: any) => {
    try {
      await localforage.setItem(key, data);
    } catch (e) {
      console.warn(`LocalForage save error for ${key}:`, e);
    }
    try {
      const collectionName = key.replace('mm_', '');
      await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection: collectionName, data })
      });
    } catch (e) {
      console.warn(`Express API save error for ${key}:`, e);
    }
  };

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

    setTracks(prev => {
      const updated = [newTrack, ...prev]; // Latest track at top
      safeSave('mm_tracks', updated);
      return updated;
    });
    
    if (supabase) {
      const dbTrack = { ...newTrack } as any;
      delete dbTrack.file_data;
      delete dbTrack.image_data;
      const { error } = await supabase.from('tracks').insert(dbTrack);
      if (error) console.error(error);
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
    setTracks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      safeSave('mm_tracks', updated);
      return updated;
    });
    
    if (supabase) {
      const dbUpdates = { ...updates } as any;
      delete dbUpdates.file_data;
      delete dbUpdates.image_data;
      const { error } = await supabase.from('tracks').update(dbUpdates).eq('id', id);
      if (error) console.error(error);
    }
  };

  const deleteTrack = async (id: string) => {
    console.log(`[MediaStore] Initializing deletion for track: ${id}`);
    try {
      // 1. Update React states using functional updates to ensure consistency
      setTracks(prev => prev.filter(t => t.id !== id));
      setPlaylists(prev => prev.map(pl => ({
        ...pl,
        track_ids: (pl.track_ids || []).filter(tid => tid !== id)
      })));
      setPromoVideos(prev => prev.filter(v => v.track_id !== id));
      setShareLinks(prev => prev.filter(l => l.track_id !== id));

      // 2. Persist to local storage (or DB if available)
      if (supabase) {
        await Promise.all([
          supabase.from('share_links').delete().eq('track_id', id),
          supabase.from('promo_videos').delete().eq('track_id', id),
          supabase.from('tracks').delete().eq('id', id)
        ]);
      } else {
        // Compute and save to local storage immediately
        const localTracks = await localforage.getItem<any[]>('mm_tracks') || [];
        await safeSave('mm_tracks', localTracks.filter((t: any) => t.id !== id));
        
        const localPlaylists = await localforage.getItem<any[]>('mm_playlists') || [];
        await safeSave('mm_playlists', localPlaylists.map((pl: any) => ({
          ...pl,
          track_ids: (pl.track_ids || []).filter((tid: any) => tid !== id)
        })));
        
        const localVideos = await localforage.getItem<any[]>('mm_promo_videos') || [];
        await safeSave('mm_promo_videos', localVideos.filter((v: any) => v.track_id !== id));
        
        const localLinks = await localforage.getItem<any[]>('mm_share_links') || [];
        await safeSave('mm_share_links', localLinks.filter((l: any) => l.track_id !== id));
      }

      addActivity({
        type: 'system',
        user: 'OGBeatz',
        action: `Purged asset ${id} from reference library`,
        timestamp: new Date().toISOString()
      });
      
      console.log(`[MediaStore] Successfully deleted track: ${id}`);
    } catch (error) {
      console.error("[MediaStore] Deletion Failure:", error);
      alert("Terminal delete operation failed. Please check network connectivity or permissions.");
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
      safeSave('mm_playlists', updated);
      return updated;
    });
    
    if (supabase && newTrackIds.length > 0) {
      const { error } = await supabase.from('playlists').update({ track_ids: newTrackIds }).eq('id', playlistId);
      if (error) console.error(error);
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
      safeSave('mm_playlists', updated);
      return updated;
    });
    
    if (supabase) {
      const { error } = await supabase.from('playlists').update({ track_ids: newTrackIds }).eq('id', playlistId);
      if (error) console.error(error);
    }
  };

  const updatePlaylist = async (id: string, updates: Partial<Playlist>) => {
    setPlaylists(prev => {
      const updated = prev.map(pl => pl.id === id ? { ...pl, ...updates } : pl);
      safeSave('mm_playlists', updated);
      return updated;
    });
    
    if (supabase) {
      const { error } = await supabase.from('playlists').update(updates).eq('id', id);
      if (error) console.error(error);
    }
  };

  const deletePlaylist = async (id: string) => {
    setPlaylists(prev => {
      const updated = prev.filter(pl => pl.id !== id);
      safeSave('mm_playlists', updated);
      return updated;
    });
    if (supabase) {
      const { error } = await supabase.from('playlists').delete().eq('id', id);
      if (error) console.error(error);
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
    setPlaylists(prev => {
      const updated = [...prev, newPl];
      safeSave('mm_playlists', updated);
      return updated;
    });
    if (supabase) {
      const { error } = await supabase.from('playlists').insert(newPl);
      if (error) console.error(error);
    }
  };

  const addClient = async (client: Partial<Client>) => {
    const rawEmail = client.email || "unknown@client.com";
    const normalizedEmail = rawEmail.trim().toLowerCase();
    
    // Helper to derive name from email
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
        const updatedClients = prev.map(c => c.id === existingClient.id ? { ...c, ...updatesToApply } : c);
        safeSave('mm_clients', updatedClients);
        return updatedClients;
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
        const updated = [...prev, newClientToInsert];
        safeSave('mm_clients', updated);
        return updated;
      }
    });

    if (supabase) {
      if (existingId && updatesToApply) {
        const { error } = await supabase.from('clients').update(updatesToApply).eq('id', existingId);
        if (error) console.error(error);
      } else if (newClientToInsert) {
        const { error } = await supabase.from('clients').insert(newClientToInsert);
        if (error) console.error(error);
      }
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    setClients(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...updates } : c);
      safeSave('mm_clients', updated);
      return updated;
    });
    if (supabase) {
      const { error } = await supabase.from('clients').update(updates).eq('id', id);
      if (error) console.error(error);
    }
  };

  const deleteClient = async (id: string) => {
    setClients(prev => {
      const updated = prev.filter(c => c.id !== id);
      safeSave('mm_clients', updated);
      return updated;
    });
    if (supabase) {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) console.error(error);
    }
    
    // Also cleanup activity references if needed, or just let them stay with null references
    addActivity({
      type: 'system',
      user: 'OGBeatz',
      action: `Removed client ${id}`,
      timestamp: new Date().toISOString()
    });
  };

  const sendMessage = async (clientId: string, content: string, image_url?: string | null) => {
    // We don't have direct access to clients array here without putting it in prev wrapper,
    // so let's just create the message and update messages array.
    const newMessage: Message = {
      id: uuidv4(),
      client_id: clientId,
      // We will look up the email below
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
    
    if (!newMessage.recipient_id) return; // Client not found

    setMessages(prev => {
      const updated = [...prev, newMessage];
      safeSave('mm_messages', updated);
      return updated;
    });

    if (supabase) {
      const { error } = await supabase.from('messages').insert(newMessage);
      if (error) console.error(error);
    }

    // Also add to activity log
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
    safeSave('mm_profile', updated);
    if (supabase) {
      const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);
      if (error) console.error(error);
    }
  };

  const addShareLink = async (link: Partial<ShareLink>) => {
    // Cryptographically secure token generation
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
    
    setShareLinks(prev => {
      const updated = [...prev, newLink];
      safeSave('mm_share_links', updated);
      return updated;
    });

    if (supabase) {
      const { error } = await supabase.from('share_links').insert(newLink);
      if (error) console.error(error);
    }
    return newLink;
  };

  const getShareContent = async (token: string) => {
    if (!supabase) return null;

    try {
      // 1. Fetch the share link
      const { data: linkData, error: linkError } = await supabase
        .from('share_links')
        .select('*')
        .eq('token', token)
        .single();

      if (linkError || !linkData) return null;

      const link = linkData as ShareLink;

      // 2. Fetch the target asset
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
           // Also fetch tracks inside the playlist if they aren't loaded
           const { data: playlistTracks } = await supabase
             .from('tracks')
             .select('*')
             .in('id', playlist.track_ids);
           
           if (playlistTracks) {
              // Merge into global tracks if not already present
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
    setActivities(prev => {
      const updated = [newActivity, ...prev].slice(0, 50); // Keep last 50
      safeSave('mm_activities', updated);
      return updated;
    });
    if (supabase) {
      const { error } = await supabase.from('activities').insert(newActivity);
      if (error) console.error(error);
    }
  };

  const deleteActivity = (id: string) => {
    // ...
  };

  const incrementShareLinkAccess = async (id: string) => {
    let newCount = 0;
    setShareLinks(prev => {
      const link = prev.find(l => l.id === id);
      if (!link) return prev;
      newCount = (link.access_count || 0) + 1;
      const updated = prev.map(l => 
        l.id === id ? { ...l, access_count: newCount } : l
      );
      safeSave('mm_share_links', updated);
      return updated;
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
    setPromoVideos(prev => {
      const updated = [...prev, newVideo];
      safeSave('mm_promo_videos', updated);
      return updated;
    });
    if (supabase) {
      const { error } = await supabase.from('promo_videos').insert(newVideo);
      if (error) console.error(error);
    }
  };

  const deletePromoVideo = async (id: string) => {
    setPromoVideos(prev => {
      const updated = prev.filter(v => v.id !== id);
      safeSave('mm_promo_videos', updated);
      return updated;
    });
    if (supabase) {
      const { error } = await supabase.from('promo_videos').delete().eq('id', id);
      if (error) console.error(error);
    }
  };

  const analyzeTrack = async (name: string): Promise<{ bpm: number, key: string, duration?: number, tags?: string[] }> => {
    try {
      const response = await fetch("/api/analyze-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: name }),
      });
      
      if (!response.ok) throw new Error("Server analysis failed");
      
      return await response.json();
    } catch (e) {
      console.error("AI Analysis failed:", e);
      return { bpm: 120, key: "C", tags: [] };
    }
  };

  return (
    <MediaStoreContext.Provider value={{
      tracks, playlists, clients, activities, profile, loading, shareLinks, messages, promoVideos,
      addTrack, updateTrack, deleteTrack, addPlaylist, updatePlaylist, deletePlaylist, addTrackToPlaylist, removeTrackFromPlaylist,
      addClient, updateClient, deleteClient, updateProfile, addShareLink, addActivity, analyzeTrack, sendMessage, addPromoVideo, deletePromoVideo, incrementShareLinkAccess
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

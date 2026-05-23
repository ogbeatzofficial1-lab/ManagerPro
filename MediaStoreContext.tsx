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
}

const MediaStoreContext = createContext<MediaStoreContextType | undefined>(undefined);

export function MediaStoreProvider({ children }: { children: React.ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>(() => {
    try {
      const cached = localStorage.getItem('ogbeatz_tracks');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const cached = localStorage.getItem('ogbeatz_playlists');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const cached = localStorage.getItem('ogbeatz_clients');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    try {
      const cached = localStorage.getItem('ogbeatz_activities');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
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
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
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
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<any>(null);
  const [connected, setConnected] = useState(false);

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
        // Run getSupabaseClient with an automatic connection timeout of 2.5 seconds
        const activeSupabase = await Promise.race([
          getSupabaseClient(),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Supabase connection timeout")), 2500))
        ]).catch(err => {
          console.warn("Supabase initialization timed out; utilizing offline schema fallback:", err);
          return null;
        });

        if (activeSupabase) {
          setSupabase(activeSupabase);
          setConnected(true);
          try {
            const fetchSafely = async (table: string) => {
              // Wrap fetch queries with a 2-second timeout to prevent sluggish database issues from hanging the app
              return Promise.race([
                activeSupabase.from(table).select('*'),
                new Promise<any>((_, reject) => setTimeout(() => reject(new Error(`Fetch timed out for table ${table}`)), 2000))
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

            // Fetch table data concurrently in parallel
            const [
              trData,
              plData,
              clData,
              slData,
              actData,
              msgData,
              pvData
            ] = await Promise.all([
              fetchSafely('tracks'),
              fetchSafely('playlists'),
              fetchSafely('clients'),
              fetchSafely('share_links'),
              fetchSafely('activities'),
              fetchSafely('messages'),
              fetchSafely('promo_videos')
            ]);

            if (trData) setTracks(trData);
            if (plData) setPlaylists(plData);
            if (clData) setClients(clData);
            if (slData) setShareLinks(slData);
            if (actData) setActivities(actData);
            if (msgData) setMessages(msgData);
            if (pvData) setPromoVideos(pvData);
            
            let profData = null;
            const { data: existingProf, error: profError } = await Promise.race([
              activeSupabase.from('profiles').select('*').single(),
              new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Profile fetch timeout')), 2000))
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
                new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Profile creation timeout')), 2500))
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
            
            setProfile(profData || null);

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
    setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    
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
      // States are updated via Realtime or immediately here
      setTracks(prev => prev.filter(t => t.id !== id));
      setPlaylists(prev => prev.map(pl => ({
        ...pl,
        track_ids: (pl.track_ids || []).filter(tid => tid !== id)
      })));
      setPromoVideos(prev => prev.filter(v => v.track_id !== id));
      setShareLinks(prev => prev.filter(l => l.track_id !== id));

      if (supabase) {
        await Promise.all([
          supabase.from('share_links').delete().eq('track_id', id),
          supabase.from('promo_videos').delete().eq('track_id', id),
          supabase.from('tracks').delete().eq('id', id)
        ]);
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
      return updated;
    });
    
    if (supabase) {
      const { error } = await supabase.from('playlists').update({ track_ids: newTrackIds }).eq('id', playlistId);
      if (error) console.error(error);
    }
  };

  const updatePlaylist = async (id: string, updates: Partial<Playlist>) => {
    setPlaylists(prev => prev.map(pl => pl.id === id ? { ...pl, ...updates } : pl));
    
    if (supabase) {
      const { error } = await supabase.from('playlists').update(updates).eq('id', id);
      if (error) console.error(error);
    }
  };

  const deletePlaylist = async (id: string) => {
    setPlaylists(prev => prev.filter(pl => pl.id !== id));
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
    setPlaylists(prev => [...prev, newPl]);
    if (supabase) {
      const { error } = await supabase.from('playlists').insert(newPl);
      if (error) console.error(error);
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
        if (error) console.error(error);
      } else if (newClientToInsert) {
        const { error } = await supabase.from('clients').insert(newClientToInsert);
        if (error) console.error(error);
      }
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    if (supabase) {
      const { error } = await supabase.from('clients').update(updates).eq('id', id);
      if (error) console.error(error);
    }
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    if (supabase) {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) console.error(error);
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
      if (error) console.error(error);
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
      if (error) console.error(error);
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
      if (error) console.error(error);
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
      const { error } = await supabase.from('promo_videos').insert(newVideo);
      if (error) console.error(error);
    }
  };

  const deletePromoVideo = async (id: string) => {
    setPromoVideos(prev => prev.filter(v => v.id !== id));
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
      addClient, updateClient, deleteClient, updateProfile, addShareLink, addActivity, analyzeTrack, sendMessage, addPromoVideo, deletePromoVideo, incrementShareLinkAccess,
      uploadFile
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

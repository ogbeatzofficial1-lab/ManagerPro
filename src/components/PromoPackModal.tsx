import React from 'react';
import { X } from 'lucide-react';
import { Track } from '../types';

export default function PromoPackModal({ track, onClose }: { track: Track; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-zinc-900 flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase tracking-tight">Marketing Portal: {track.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-full transition-colors"><X/></button>
        </div>
        <div className="p-8">
          <p className="text-zinc-500 text-sm italic uppercase tracking-widest">Generating promotional assets for {track.artist}...</p>
          <div className="mt-8 space-y-4">
             <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
                <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest">YouTube Metadata</span>
                <p className="mt-2 text-xs font-mono text-zinc-400">[PENDING GENERATION]</p>
             </div>
             <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
                <span className="text-[10px] font-black uppercase text-purple-500 tracking-widest">Instagram Copy</span>
                <p className="mt-2 text-xs font-mono text-zinc-400">[PENDING GENERATION]</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

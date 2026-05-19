import React from 'react';
import { Music, MessageSquare } from 'lucide-react';
import { Client } from '../types';

export default function ClientPortal({ client }: { client: Client }) {
  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center space-y-8">
      <div className="w-24 h-24 rounded-[2rem] bg-orange-500 flex items-center justify-center shadow-[0_0_50px_rgba(249,115,22,0.3)]">
        <Music className="w-10 h-10 text-black" />
      </div>
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">OG BEATZ MASTER HUB</h1>
        <p className="text-zinc-500 text-sm font-black uppercase tracking-[0.3em]">SECURE PORTAL FOR {client.name}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <div className="p-8 bg-zinc-950 border border-zinc-900 rounded-[3rem] space-y-6">
           <h2 className="text-xl font-black uppercase tracking-tight">Active Deliveries</h2>
           <div className="py-20 text-center opacity-30">
              <Music className="w-12 h-12 mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">No active collections found</p>
           </div>
        </div>
        <div className="p-8 bg-zinc-950 border border-zinc-900 rounded-[3rem] space-y-6">
           <h2 className="text-xl font-black uppercase tracking-tight">Encrypted Messaging</h2>
           <div className="py-20 text-center opacity-30">
              <MessageSquare className="w-12 h-12 mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">Secure line established</p>
           </div>
        </div>
      </div>
    </div>
  );
}

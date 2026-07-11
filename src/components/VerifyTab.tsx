import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Registration } from '../types';
import { Search, ShieldCheck, AlertCircle, Calendar, MapPin, CheckCircle2, User } from 'lucide-react';

interface VerifyTabProps {
  registrations: Registration[];
  embedded?: boolean;
}

export default function VerifyTab({ registrations, embedded = false }: VerifyTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<Registration | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(false);

    // Simulated quick search
    setTimeout(() => {
      const found = registrations.find(
        (r) => 
          r.communityId.toLowerCase() === searchQuery.trim().toLowerCase() ||
          r.mobileNumber === searchQuery.trim()
      );
      setSearchResult(found || null);
      setIsSearching(false);
      setHasSearched(true);
    }, 600);
  };

  return (
    <div className={`${embedded ? 'max-w-3xl' : 'max-w-2xl'} mx-auto py-6 space-y-8`}>
      {/* Title block */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          Public Registry Verifier
        </div>
        <h2 className="font-sans text-2xl md:text-3xl font-bold text-slate-900">Verify Registration</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {embedded
            ? 'Search by Community ID or registered mobile number to verify a member record (admin only).'
            : 'Verify the authenticity of any Global Namdev Community member. Sensitive private data remains completely hidden.'}
        </p>
      </div>

      {/* Verification Input form */}
      <form onSubmit={handleVerify} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            required
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter Community ID or Mobile Number..."
            className="w-full bg-transparent pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
        >
          {isSearching ? <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" /> : 'Verify Credentials'}
        </button>
      </form>

      {/* Skeletons while loading */}
      {isSearching && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-3 animate-pulse">
          <div className="h-4 w-24 bg-slate-200 rounded" />
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="h-16 bg-slate-50 rounded-2xl" />
        </div>
      )}

      {/* Verification results display */}
      <AnimatePresence mode="wait">
        {hasSearched && !isSearching && (
          searchResult ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6"
            >
              {/* Header Status Stamp */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-geist text-slate-400 uppercase tracking-wider font-bold">Verification Status</p>
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-sans text-sm font-bold">Officially Verified Record</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-right">
                  <p className="text-[9px] font-geist text-slate-400 uppercase tracking-wider font-bold">Community ID</p>
                  <p className="font-geist text-xs font-bold text-slate-800 tracking-wider font-mono">{searchResult.communityId}</p>
                </div>
              </div>

              {/* General Allowed Fields (NON SENSITIVE ONLY) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-geist text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-primary" /> Member Full Name
                  </p>
                  <p className="font-sans text-base font-bold text-slate-800">{searchResult.fullName}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-geist text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" /> Registration Date
                  </p>
                  <p className="font-sans text-sm font-semibold text-slate-700">{searchResult.registrationDate}</p>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <p className="text-[10px] font-geist text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> Registered Location
                  </p>
                  <p className="font-sans text-sm font-semibold text-slate-700">
                    {searchResult.city}, {searchResult.state}, {searchResult.country}
                  </p>
                </div>
              </div>

              {/* Privacy protection notice */}
              <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-[10px] text-slate-500 leading-normal">
                  **Privacy Protection Policy Activated**: Personal details such as parents' names, phone numbers, exact age, education, gotras, and village tags are hidden for security reasons.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center text-center space-y-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <AlertCircle className="w-8 h-8 stroke-1 text-slate-400" />
              </div>
              <div>
                <h4 className="font-sans text-base font-bold text-slate-900">Record Not Verified</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  No registered community member record matches "{searchQuery}". Please verify that the Community ID or Mobile Number is entered correctly.
                </p>
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}

// Small helper loader component
function RefreshCwIcon({ className }: { className?: string }) {
  return <Search className={`${className} animate-spin`} />;
}

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Registration } from '../types';
import {
  Map as MapIcon, Globe, ArrowLeft, Users, Building2,
  Sparkles, MapPin
} from 'lucide-react';
import MemberLeafletMap from './MemberLeafletMap';
import { resolveRegistrationCoords } from '../lib/geo';
import { buildWorldStats, buildCountryRegionStats, StateStat } from '../lib/memberGeoStats';
import { Language } from '../lib/languages';
import { getTranslations } from '../lib/translations';

interface MapTabProps {
  registrations: Registration[];
  language: Language;
}

export default function MapTab({ registrations, language }: MapTabProps) {
  const t = getTranslations(language);
  const [mapMode, setMapMode] = useState<'analytics' | 'live-map'>('analytics');
  const [drilldown, setDrilldown] = useState<'world' | 'country'>('world');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [activeInfoWindowId, setActiveInfoWindowId] = useState<string | null>(null);

  const worldStats = useMemo(() => buildWorldStats(registrations), [registrations]);

  const countryRegionStats = useMemo(
    () => (selectedCountry ? buildCountryRegionStats(registrations, selectedCountry) : {}),
    [registrations, selectedCountry]
  );

  const openCountryDrilldown = useCallback(
    (country: string) => {
      if ((worldStats[country] ?? 0) > 0) {
        setSelectedCountry(country);
        setSelectedState(null);
        setDrilldown('country');
      }
    },
    [worldStats]
  );

  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const COUNTRY_POSITIONS: Record<string, { x: number; y: number; r: number }> = {
    India: { x: 670, y: 320, r: 60 },
    'United States': { x: 240, y: 220, r: 35 },
    Canada: { x: 220, y: 150, r: 24 },
    'United Kingdom': { x: 480, y: 160, r: 20 },
    Australia: { x: 840, y: 440, r: 22 },
  };

  // SVG Coordinates for Country Nodes — only countries with registered members
  const countriesData = useMemo(
    () =>
      Object.entries(worldStats)
        .filter(([, count]) => Number(count) > 0)
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .map(([name, count], index) => {
          const pos = COUNTRY_POSITIONS[name] ?? {
            x: 180 + (index % 4) * 180,
            y: 140 + Math.floor(index / 4) * 120,
            r: 20,
          };
          return {
            name,
            x: pos.x,
            y: pos.y,
            r: pos.r,
            count,
            isClickable: (count as number) > 0,
          };
        }),
    [worldStats]
  );

  const findCountryAtPoint = useCallback(
    (svg: SVGSVGElement, clientX: number, clientY: number) => {
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;

      const svgPt = pt.matrixTransform(ctm.inverse());
      let closest: string | null = null;
      let closestDist = Infinity;

      for (const c of countriesData) {
        const dist = Math.hypot(svgPt.x - c.x, svgPt.y - c.y);
        const threshold = c.r + 22;
        if (dist <= threshold && dist < closestDist) {
          closestDist = dist;
          closest = c.name;
        }
      }

      return closest;
    },
    [countriesData]
  );

  const handleWorldMapMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const country = findCountryAtPoint(e.currentTarget, e.clientX, e.clientY);
      setHoveredCountry((prev) => (prev === country ? prev : country));
    },
    [findCountryAtPoint]
  );

  const handleWorldMapMouseLeave = useCallback(() => {
    setHoveredCountry(null);
  }, []);

  const handleWorldMapClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const country = findCountryAtPoint(e.currentTarget, e.clientX, e.clientY);
      if (country && (worldStats[country] ?? 0) > 0) {
        setSelectedCountry(country);
        setSelectedState(null);
        setDrilldown('country');
      }
    },
    [findCountryAtPoint, worldStats]
  );
  const indiaStatesData = [
    { name: 'Madhya Pradesh', path: 'M 180 180 L 320 180 L 300 240 L 160 230 Z', color: '#FFF1E6', border: '#FFD8BE', fill: '#FF6B00', x: 240, y: 205 },
    { name: 'Maharashtra', path: 'M 150 240 L 300 250 L 260 330 L 120 310 Z', color: '#FFF7ED', border: '#FED7AA', fill: '#FF6B00', x: 210, y: 280 },
    { name: 'Gujarat', path: 'M 60 190 L 170 190 L 150 250 L 70 240 Z', color: '#FFF8E7', border: '#FFEFC6', fill: '#FF6B00', x: 115, y: 215 },
    { name: 'Rajasthan', path: 'M 110 110 L 220 120 L 180 180 L 80 170 Z', color: '#FFF7ED', border: '#FFEDD5', fill: '#FF6B00', x: 150, y: 145 },
    { name: 'Delhi', path: 'M 225 105 L 255 105 L 255 125 L 225 125 Z', color: '#FFF1E6', border: '#FF6B00', fill: '#FF6B00', x: 240, y: 115 },
    { name: 'Karnataka', path: 'M 130 320 L 210 325 L 180 410 L 110 380 Z', color: '#FFF8E7', border: '#FFE2B3', fill: '#FF6B00', x: 165, y: 360 },
  ];

  const visibleIndiaStates = useMemo(
    () =>
      indiaStatesData.filter(
        (state) => (countryRegionStats[state.name]?.members ?? 0) > 0
      ),
    [countryRegionStats]
  );

  const selectedCountryMemberCount = selectedCountry ? (worldStats[selectedCountry] ?? 0) : 0;

  const totalWorldMembers = registrations.length;

  const mapMarkers = useMemo(() => {
    return registrations.map((r) => ({
      ...r,
      position: resolveRegistrationCoords(r.city, r.state, r.country, r.id),
    }));
  }, [registrations]);

  return (
    <div className="space-y-6 py-4">
      {/* Top Header Controls with toggles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-geist font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {t.liveMemberMaps}
          </span>
          <h2 className="font-sans text-3xl font-bold text-slate-950 mt-0.5">
            {t.interactiveMemberMapping}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.mapsSubtitle}
          </p>
        </div>

        {/* View Toggle Controller */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
          <button
            onClick={() => setMapMode('analytics')}
            className={`px-4 py-2 text-xs font-geist font-bold rounded-lg transition-all cursor-pointer ${
              mapMode === 'analytics' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.analyticsMapButton}
          </button>
          <button
            onClick={() => setMapMode('live-map')}
            className={`px-4 py-2 text-xs font-geist font-bold rounded-lg transition-all cursor-pointer ${
              mapMode === 'live-map'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.mapLiveMemberMap}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mapMode === 'analytics' ? (
          <motion.div
            key="analytics-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {drilldown === 'country' && selectedCountry && (
              <button
                onClick={() => {
                  setDrilldown('world');
                  setSelectedCountry(null);
                  setSelectedState(null);
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-geist text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t.backToWorldMap}
              </button>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* MAP STAGE (Left / 8 cols) */}
              <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm overflow-hidden relative">
                {drilldown === 'world' ? (
                  <div className="relative flex flex-col items-center text-center">
                    <div className="w-full max-w-2xl mx-auto space-y-4 mb-6">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/70 shadow-sm">
                        <Globe className="w-4 h-4 text-primary" />
                        <span className="font-geist text-xs font-bold uppercase tracking-widest text-primary">
                          Global Member Coverage
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-sans text-xl md:text-2xl font-bold text-slate-950 tracking-tight">
                          Worldwide Namdev Community Reach
                        </h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                          {t.mapExploreWorld}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md mx-auto">
                        <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200/80">
                          <p className="text-[10px] font-geist font-bold uppercase tracking-wider text-slate-400">{t.mapTotalMembers}</p>
                          <p className="font-sans text-lg font-bold text-primary">{totalWorldMembers.toLocaleString()}</p>
                        </div>
                        <div
                          className={`px-4 py-2 rounded-2xl border min-h-[68px] flex flex-col justify-center transition-colors duration-200 ${
                            hoveredCountry
                              ? 'bg-orange-50 border-orange-200/80'
                              : 'bg-slate-50/50 border-slate-200/60'
                          }`}
                        >
                          <p className={`text-[10px] font-geist font-bold uppercase tracking-wider ${hoveredCountry ? 'text-primary' : 'text-slate-400'}`}>
                            {hoveredCountry || 'Country Focus'}
                          </p>
                          <p className={`font-sans text-lg font-bold ${hoveredCountry ? 'text-slate-900' : 'text-slate-300'}`}>
                            {hoveredCountry
                              ? `${(worldStats[hoveredCountry] || 0).toLocaleString()} members`
                              : t.mapHoverCountry}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="relative w-full max-w-3xl mx-auto rounded-3xl border border-orange-100/80 bg-gradient-to-b from-orange-50/40 via-white to-slate-50/60 p-4 md:p-6 shadow-inner">
                      <div className="absolute inset-0 rounded-3xl opacity-30 pointer-events-none bg-[radial-gradient(circle_at_50%_40%,rgba(249,115,22,0.15),transparent_65%)]" />
                      <div className="absolute inset-0 opacity-[0.04] pointer-events-none rounded-3xl bg-[radial-gradient(#0f172a_1.5px,transparent_1.5px)] [background-size:18px_18px]" />

                      <svg
                        viewBox="0 0 1000 550"
                        className="relative w-full h-auto mx-auto drop-shadow-sm cursor-default"
                        onMouseMove={handleWorldMapMouseMove}
                        onMouseLeave={handleWorldMapMouseLeave}
                        onClick={handleWorldMapClick}
                      >
                        <defs>
                          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#fb923c" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
                          </radialGradient>
                        </defs>

                        <path d="M 120 100 Q 280 120 300 240 Q 250 310 200 290 Q 150 250 120 100 Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
                        <path d="M 440 120 Q 640 100 850 180 Q 880 320 720 360 Q 620 400 520 340 L 440 220 Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
                        <path d="M 280 320 Q 320 380 350 480 Q 310 520 270 480 Q 250 380 280 320 Z" fill="#FAFAFA" stroke="#F1F5F9" strokeWidth="1" />
                        <path d="M 800 400 Q 880 400 900 480 Q 840 500 800 400 Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
                        <path
                          d="M 640 280 L 710 280 L 690 350 L 670 380 L 650 350 Z"
                          fill="#FFEDD5"
                          stroke="#FDBA74"
                          strokeWidth="1.5"
                          pointerEvents="none"
                        />

                        {countriesData.map((c) => {
                          const isHovered = hoveredCountry === c.name;
                          return (
                            <g key={c.name} pointerEvents="none">
                              {isHovered && (
                                <circle cx={c.x} cy={c.y} r={c.r + 20} fill="url(#nodeGlow)" />
                              )}
                              <circle
                                cx={c.x}
                                cy={c.y}
                                r={c.r + 10}
                                fill="#FF6B00"
                                fillOpacity={isHovered ? 0.22 : 0.12}
                              />
                              <circle
                                cx={c.x}
                                cy={c.y}
                                r={c.r / 2 + 3}
                                fill={isHovered ? '#ea580c' : '#FF6B00'}
                                stroke="#fff"
                                strokeWidth="2"
                              />
                              <text
                                x={c.x}
                                y={c.y - c.r - 12}
                                textAnchor="middle"
                                fill={isHovered ? '#ea580c' : '#334155'}
                                className="font-sans text-xs font-bold"
                              >
                                {c.name}
                              </text>
                            </g>
                          );
                        })}
                      </svg>

                      <p className="relative mt-4 text-[10px] text-slate-400 font-geist">
                        Click any country node to inspect state / region breakdown from registered members.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex flex-col items-center text-center">
                    <div className="w-full max-w-xl mx-auto space-y-3 mb-6">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/70 shadow-sm">
                        <MapIcon className="w-4 h-4 text-primary" />
                        <span className="font-geist text-xs font-bold uppercase tracking-widest text-primary">
                          {selectedCountry} Member Breakdown
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        States and regions shown from registered member profiles only
                        {selectedCountryMemberCount > 0 && ` · ${selectedCountryMemberCount.toLocaleString()} members in ${selectedCountry}`}
                      </p>
                    </div>

                    {Object.keys(countryRegionStats).length === 0 ? (
                      <div className="py-16 text-center text-slate-400 space-y-2">
                        <MapIcon className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
                        <p className="font-sans text-sm font-bold text-slate-700">No regional data yet</p>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Registrations in {selectedCountry} need a state or region to appear here.
                        </p>
                      </div>
                    ) : selectedCountry === 'India' ? (
                    <svg viewBox="0 0 450 480" className="w-full max-w-[500px] mx-auto bg-gradient-to-b from-orange-50/30 to-slate-50/40 rounded-3xl border border-orange-100/60 p-4 shadow-inner">
                      {visibleIndiaStates.map((s) => {
                        const isHovered = hoveredState === s.name;
                        const isSelected = selectedState === s.name;
                        const memberCount = countryRegionStats[s.name]?.members ?? 0;
                        return (
                          <g key={s.name}>
                            <path
                              d={s.path}
                              fill={isSelected ? '#FFEFE6' : isHovered ? '#FFF1E6' : s.color}
                              stroke={isSelected ? '#FF6B00' : isHovered ? '#FF9E59' : s.border}
                              strokeWidth={isSelected ? 2 : 1.5}
                              className="cursor-pointer transition-all duration-200"
                              onMouseEnter={() => setHoveredState(s.name)}
                              onMouseLeave={() => setHoveredState(null)}
                              onClick={() => setSelectedState(s.name)}
                            />
                            <circle
                              cx={s.x}
                              cy={s.y}
                              r={4}
                              fill={isSelected ? '#FF6B00' : '#FF8C39'}
                              pointerEvents="none"
                            />
                            <text
                              x={s.x}
                              y={s.y - 10}
                              textAnchor="middle"
                              fill={isHovered || isSelected ? '#ea580c' : '#334155'}
                              pointerEvents="none"
                              className="font-sans text-[10px] font-bold transition-colors duration-200"
                            >
                              {s.name.split(' ')[0]}
                            </text>
                            <text
                              x={s.x}
                              y={s.y + 14}
                              textAnchor="middle"
                              fill="#ea580c"
                              pointerEvents="none"
                              className="font-geist text-[9px] font-bold"
                            >
                              {memberCount}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                    ) : (
                      <div className="w-full max-w-lg mx-auto space-y-2 text-left">
                        {(Object.entries(countryRegionStats) as [string, StateStat][])
                          .sort((a, b) => b[1].members - a[1].members)
                          .map(([region, stat]) => (
                            <button
                              key={region}
                              type="button"
                              onClick={() => setSelectedState(region)}
                              className={`w-full flex justify-between items-center p-4 rounded-2xl border transition-all cursor-pointer ${
                                selectedState === region
                                  ? 'border-orange-200 bg-orange-50/60'
                                  : 'border-slate-200 bg-white hover:border-orange-100 hover:bg-orange-50/30'
                              }`}
                            >
                              <span className="font-sans text-sm font-bold text-slate-900">{region}</span>
                              <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                                {stat.members} {stat.members === 1 ? 'member' : 'members'}
                              </span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* DETAILS PANEL (Right / 4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="space-y-2 border-b border-slate-100 pb-4 text-center lg:text-left">
                    <h3 className="font-sans text-lg font-bold text-slate-950 flex items-center justify-center lg:justify-start gap-1.5">
                      <Building2 className="w-5 h-5 text-primary" />
                      {drilldown === 'world'
                        ? 'Global Member Directory'
                        : `${selectedState || selectedCountry || t.stateProfile} — ${t.mapRegionSuffix}`}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {drilldown === 'world'
                        ? 'Member counts by country — hover to highlight on the map.'
                        : 'City and district breakdown from registered members.'}
                    </p>
                  </div>

                  {drilldown === 'world' ? (
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 hide-scrollbar" onMouseLeave={() => setHoveredCountry(null)}>
                      {Object.entries(worldStats).length === 0 ? (
                        <div className="py-10 text-center text-slate-400">
                          <p className="text-xs font-bold text-slate-600">No registered members yet</p>
                          <p className="text-[10px] mt-1">Country counts will appear after the first registration.</p>
                        </div>
                      ) : Object.entries(worldStats)
                        .sort((a, b) => (b[1] as number) - (a[1] as number))
                        .map(([country, count]) => (
                          <div
                            key={country}
                            onMouseEnter={() => setHoveredCountry(country)}
                            onClick={() => openCountryDrilldown(country)}
                            className={`flex justify-between items-center p-3 rounded-2xl border transition-all ${
                              hoveredCountry === country
                                ? 'border-orange-200 bg-orange-50/60'
                                : 'border-orange-100 bg-orange-50/40 hover:bg-orange-50 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-geist text-xs font-bold bg-primary text-white">
                                {country.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-sans text-xs font-bold text-slate-900">{country}</p>
                                <span className="text-[10px] text-primary font-bold">Inspect States / Regions ➔</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-sans text-sm font-bold text-slate-900">{count.toLocaleString()}</p>
                              <p className="text-[10px] text-slate-400 font-medium">member count</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedState ? (
                        <div className="space-y-3">
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/50 flex justify-between items-center">
                            <div>
                              <p className="text-[10px] font-geist text-slate-400 uppercase tracking-wider font-bold">
                                {selectedCountry === 'India' ? t.mapTotalStateMembers : t.mapTotalRegionMembers}
                              </p>
                              <p className="font-sans text-sm font-bold text-slate-900">{selectedState}</p>
                            </div>
                            <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                              {(countryRegionStats[selectedState]?.members || 0).toLocaleString()}
                            </span>
                          </div>

                          <p className="text-[11px] font-geist text-slate-400 uppercase tracking-wider font-bold mt-4">City / district breakdown</p>
                          
                          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 hide-scrollbar">
                            {(countryRegionStats[selectedState]?.districts ?? [])
                              .sort((a, b) => b.count - a.count)
                              .map((dist) => (
                                <div 
                                  key={dist.name}
                                  className="flex justify-between items-center p-2.5 rounded-xl border border-slate-100 bg-white"
                                >
                                  <span className="font-sans text-xs font-bold text-slate-800">{dist.name}</span>
                                  <span className="font-sans text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md">
                                    {dist.count.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      ) : (
                        <div className="py-12 text-center text-slate-400 space-y-3">
                          <MapIcon className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
                          <div>
                            <p className="font-sans text-xs font-bold text-slate-700">{t.mapNoRegionSelected}</p>
                            <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-1">
                              Select a state or region from the map or list to inspect city and district member records.
                            </p>
                          </div>

                          <div className="pt-4 flex flex-wrap gap-2 justify-center">
                            {(Object.entries(countryRegionStats) as [string, StateStat][])
                              .sort((a, b) => b[1].members - a[1].members)
                              .map(([name, stat]) => (
                              <button
                                key={name}
                                onMouseEnter={() => setHoveredState(name)}
                                onMouseLeave={() => setHoveredState(null)}
                                onClick={() => setSelectedState(name)}
                                className="px-2.5 py-1 text-[10px] font-geist font-bold border border-slate-200 hover:border-primary/50 hover:bg-orange-50/20 rounded-lg text-slate-600 hover:text-primary transition-all cursor-pointer"
                              >
                                {name} ({stat.members})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="live-map-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-4 shadow-sm overflow-hidden min-h-[520px] flex flex-col">
              <div className="flex items-center justify-between gap-3 px-2 pb-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>{mapMarkers.length} members plotted · OpenStreetMap</span>
                </div>
              </div>
              <div className="flex-1 min-h-[450px] rounded-2xl overflow-hidden border border-slate-200">
                <MemberLeafletMap
                  registrations={registrations}
                  activeMemberId={activeInfoWindowId}
                  onSelectMember={setActiveInfoWindowId}
                />
              </div>
            </div>

            {/* List directory of dynamic verified registrations on right (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="space-y-2 border-b border-slate-100 pb-4">
                  <h3 className="font-sans text-lg font-bold text-slate-950 flex items-center gap-1.5">
                    <Users className="w-5 h-5 text-primary" />
                    {t.livePinDirectory}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Compact member list — tap a pin to locate on map.
                  </p>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {mapMarkers.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      <p className="text-[10px]">No registered members yet.</p>
                    </div>
                  ) : (
                    mapMarkers.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setActiveInfoWindowId(m.id)}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer group ${
                          activeInfoWindowId === m.id
                            ? 'border-orange-200/80 bg-orange-50/40'
                            : 'border-slate-100/80 bg-slate-50/30 hover:bg-orange-50/20 hover:border-orange-100/60'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center font-geist text-[10px] font-bold text-primary shrink-0">
                          {m.fullName.substring(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-sans text-[11px] font-semibold text-slate-800 truncate group-hover:text-primary transition-colors">
                            {m.fullName}
                          </p>
                          <p className="text-[9px] text-slate-500 truncate">
                            {m.city}, {m.state}
                          </p>
                        </div>
                        <p className="text-[8px] font-geist text-slate-400 blur-[3px] select-none shrink-0 max-w-[72px] truncate">
                          {m.communityId}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

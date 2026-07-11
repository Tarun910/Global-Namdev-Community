import { useMemo } from 'react';
import { ChartPie, ChartBar, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, PieChart, Pie, LabelList
} from 'recharts';
import { Registration } from '../types';
import { getTranslations } from '../lib/translations';
import { Language } from '../lib/languages';
import {
  buildRegionChartData,
  buildOccupationChartData,
  buildGotraChartData,
} from '../lib/memberGeoStats';

interface StatsProps {
  registrations: Registration[];
  language: Language;
}

const COLORS = ['#FF6B00', '#F97316', '#D97706', '#B45309', '#78350F', '#451A03', '#94A3B8'];

function translateBucketName(name: string, t: ReturnType<typeof getTranslations>): string {
  const labels: Record<string, string> = {
    'Other States / Regions': t.statsOtherStates,
    'Other Sectors': t.statsOtherSectors,
    'Not specified': t.statsNotSpecified,
    'Other Gotras': t.statsOtherGotras,
  };
  return labels[name] ?? name;
}

function isMutedBucket(name: string) {
  return (
    name === 'Other States / Regions' ||
    name === 'Other Sectors' ||
    name === 'Not specified' ||
    name === 'Other Gotras'
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="h-[240px] flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 text-center">
      <p className="text-xs text-slate-500 leading-relaxed max-w-xs">{message}</p>
    </div>
  );
}

function RegistrationFootnote({ count, label }: { count: number; label: string }) {
  return (
    <p className="text-[10px] text-slate-400 font-medium pt-1">
      {label.replace('{count}', count.toLocaleString())}
    </p>
  );
}

export default function Stats({ registrations, language }: StatsProps) {
  const t = getTranslations(language);

  const { chartData: stateData, totalRegions } = useMemo(
    () => buildRegionChartData(registrations),
    [registrations]
  );

  const occupationData = useMemo(
    () => buildOccupationChartData(registrations),
    [registrations]
  );

  const gotraData = useMemo(
    () => buildGotraChartData(registrations),
    [registrations]
  );

  const stateChartHeight = Math.max(240, stateData.length * 36 + 40);
  const gotraChartHeight = Math.max(200, gotraData.length * 36 + 40);

  return (
    <section className="bg-slate-50 py-16 border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-6 space-y-16">

        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-primary text-xs font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            {t.liveMemberStats}
          </div>
          <h2 className="font-sans text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            {t.interactiveDemographics}
          </h2>
          <p className="font-sans text-xs text-slate-500 leading-relaxed">
            {t.demographicsSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* State / region distribution — real registration data */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-start pb-2 border-b border-slate-100 gap-3">
              <div className="space-y-0.5">
                <h4 className="font-sans text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ChartBar className="w-4 h-4 text-primary" />
                  {t.stateChaptersDistribution}
                </h4>
                <p className="text-[10px] text-slate-500">{t.stateChaptersSub}</p>
              </div>
              {totalRegions > 0 && (
                <span className="text-[10px] font-geist font-bold text-primary bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full shrink-0">
                  {totalRegions} {t.regionsTracked}
                </span>
              )}
            </div>

            {stateData.length === 0 ? (
              <ChartEmpty message={t.statsEmptyRegions} />
            ) : (
              <>
                <div className="w-full text-xs" style={{ height: stateChartHeight }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={stateData}
                      margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis
                        type="number"
                        stroke="#94a3b8"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        label={{ value: t.membersCount, position: 'insideBottom', offset: -2, fontSize: 10, fill: '#94a3b8' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        width={108}
                        tickFormatter={(value) => translateBucketName(String(value), t)}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontFamily: 'sans-serif', fontSize: '11px' }}
                        labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                        formatter={(value) => [value, t.membersCount]}
                        labelFormatter={(label) => translateBucketName(String(label), t)}
                      />
                      <Bar dataKey="members" radius={[0, 6, 6, 0]} barSize={18}>
                        {stateData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={isMutedBucket(entry.name) ? '#94A3B8' : COLORS[index % COLORS.length]}
                          />
                        ))}
                        <LabelList dataKey="members" position="right" fontSize={10} fill="#64748b" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <RegistrationFootnote count={registrations.length} label={t.statsBasedOnRegistrations} />
              </>
            )}
          </div>

          {/* Professional sector — real registration data */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="pb-2 border-b border-slate-100 space-y-0.5">
              <h4 className="font-sans text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ChartPie className="w-4 h-4 text-primary" />
                {t.professionalSectorBreakdown}
              </h4>
              <p className="text-[10px] text-slate-500">{t.professionalSectorSub}</p>
            </div>

            {occupationData.length === 0 ? (
              <ChartEmpty message={t.statsEmptyOccupation} />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="h-[210px] w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={occupationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={occupationData.length > 1 ? 3 : 0}
                          dataKey="value"
                        >
                          {occupationData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={isMutedBucket(entry.name) ? '#94A3B8' : COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontFamily: 'sans-serif', fontSize: '11px' }}
                          formatter={(value, _name, item) => [
                            value,
                            translateBucketName(String(item.payload?.name ?? ''), t),
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1 hide-scrollbar">
                    {occupationData.map((entry, idx) => (
                      <div key={entry.name} className="flex items-center gap-2 text-[11px] text-slate-600">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: isMutedBucket(entry.name)
                              ? '#94A3B8'
                              : COLORS[idx % COLORS.length],
                          }}
                        />
                        <span className="truncate font-medium flex-1">{translateBucketName(entry.name, t)}</span>
                        <span className="font-mono text-slate-400 font-bold">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <RegistrationFootnote count={registrations.length} label={t.statsBasedOnRegistrations} />
              </>
            )}
          </div>
        </div>

        {/* Gotra distribution — real registration data */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="pb-2 border-b border-slate-100 space-y-0.5">
            <h4 className="font-sans text-sm font-bold text-slate-900">{t.clanGotraDistribution}</h4>
            <p className="text-[10px] text-slate-500">{t.clanGotraSub}</p>
          </div>

          {gotraData.length === 0 ? (
            <ChartEmpty message={t.statsEmptyGotra} />
          ) : (
            <>
              <div className="w-full text-xs" style={{ height: gotraChartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={gotraData}
                    margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis
                      type="number"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      label={{ value: t.membersCount, position: 'insideBottom', offset: -2, fontSize: 10, fill: '#94a3b8' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      width={96}
                      tickFormatter={(value) => translateBucketName(String(value), t)}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontFamily: 'sans-serif', fontSize: '11px' }}
                      formatter={(value) => [value, t.membersCount]}
                      labelFormatter={(label) => translateBucketName(String(label), t)}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                      {gotraData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={isMutedBucket(entry.name) ? '#94A3B8' : COLORS[index % COLORS.length]}
                        />
                      ))}
                      <LabelList dataKey="count" position="right" fontSize={10} fill="#64748b" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <RegistrationFootnote count={registrations.length} label={t.statsBasedOnRegistrations} />
            </>
          )}
        </div>

      </div>
    </section>
  );
}

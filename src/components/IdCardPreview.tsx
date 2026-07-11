import { forwardRef } from 'react';
import { Registration } from '../types';

interface IdCardPreviewProps {
  member: Registration;
}

const IdCardPreview = forwardRef<HTMLDivElement, IdCardPreviewProps>(function IdCardPreview(
  { member },
  ref
) {
  return (
    <div
      ref={ref}
      data-id-card-export
      className="relative w-full max-w-lg mx-auto min-h-[248px] rounded-3xl shadow-2xl border border-white/20 text-white saffron-gradient p-5 sm:p-6 flex flex-col overflow-hidden"
    >
      <div className="absolute bottom-0 right-0 w-36 h-36 translate-x-1/4 translate-y-1/4 opacity-10 pointer-events-none flex items-center justify-center">
        <img src="/logo.png" alt="" className="w-28 h-28 object-contain" />
      </div>

      <div className="relative z-10 shrink-0 pb-3 border-b border-white/15 pr-[4.5rem]">
        <div className="absolute top-0 right-0 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-white/10 text-[9px] font-bold text-white uppercase tracking-wider">
          Verified
        </div>

        <p className="font-geist text-[8px] sm:text-[9px] uppercase tracking-wide text-white/80 font-bold flex items-center gap-1.5 leading-none">
          <img src="/logo.png" alt="" className="w-5 h-5 object-contain shrink-0" />
          <span className="truncate">Global Namdev Community</span>
        </p>
        <h4 className="font-sans text-[10px] sm:text-[11px] font-bold tracking-tight text-white mt-1.5 leading-none truncate">
          Community Identity Credential
        </h4>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-2 py-4 min-h-[72px]">
        <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Member Name</p>
        <p className="font-sans text-lg sm:text-xl font-bold text-white leading-snug mt-1 px-2 line-clamp-2">
          {member.fullName}
        </p>
      </div>

      <div className="relative z-10 shrink-0 text-center px-2 pt-3 border-t border-white/15">
        <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Community ID</p>
        <p className="font-geist text-sm sm:text-base font-bold text-white mt-1 tracking-wide break-all leading-snug">
          {member.communityId}
        </p>
      </div>
    </div>
  );
});

export default IdCardPreview;

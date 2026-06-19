/** Kredit pengembang — dipakai di login, beranda, dan sidebar. */
export default function DevCredit({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-[var(--text-3)] ${className}`}>
      Dikembangkan oleh Tim Pengembang SMPN 3 Besuki
    </p>
  );
}

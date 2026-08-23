const BAR_HEIGHTS = [30, 65, 45, 90, 55, 75, 35, 100, 60, 40, 80, 50, 70, 30, 95, 45, 60, 85, 40, 65];

export function Waveform({ className = "", animate = true }: { className?: string; animate?: boolean }) {
  return (
    <div className={`flex h-16 items-center gap-1 ${className}`} aria-hidden>
      {BAR_HEIGHTS.map((height, i) => (
        <span
          key={i}
          className="w-1 flex-1 rounded-full bg-gradient-to-t from-violet to-magenta"
          style={{
            height: `${height}%`,
            animation: animate ? `waveform-pulse ${0.6 + (i % 5) * 0.15}s ease-in-out infinite` : undefined,
            animationDelay: animate ? `${i * 0.05}s` : undefined,
            transformOrigin: "bottom",
          }}
        />
      ))}
    </div>
  );
}

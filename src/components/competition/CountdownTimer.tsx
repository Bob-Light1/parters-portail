'use client';

import { useEffect, useState } from 'react';

interface CountdownLabels {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  closed: string;
}

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    total: ms,
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms / 3_600_000) % 24),
    minutes: Math.floor((ms / 60_000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
  };
}

/** Live countdown to the competition closing date (spec §4.5). */
export default function CountdownTimer({
  closingDate,
  labels,
}: {
  closingDate: string;
  labels: CountdownLabels;
}) {
  const target = new Date(closingDate).getTime();
  const [time, setTime] = useState(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => setTime(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (time.total <= 0) {
    return <p className="text-center text-red-500 font-semibold">{labels.closed}</p>;
  }

  const units = [
    { value: time.days, label: labels.days },
    { value: time.hours, label: labels.hours },
    { value: time.minutes, label: labels.minutes },
    { value: time.seconds, label: labels.seconds },
  ];

  return (
    <div className="flex justify-center gap-3 sm:gap-4">
      {units.map((u) => (
        <div key={u.label} className="bg-[#0f2d5e] text-white rounded-xl px-3 py-2 sm:px-4 sm:py-3 min-w-[64px] text-center">
          <p className="text-2xl sm:text-3xl font-black tabular-nums">{String(u.value).padStart(2, '0')}</p>
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-white/70">{u.label}</p>
        </div>
      ))}
    </div>
  );
}

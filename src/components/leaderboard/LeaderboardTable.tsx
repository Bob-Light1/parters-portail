import { Medal } from 'lucide-react';
import type { LeaderboardEntry } from '@/types';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  title: string;
  labels: {
    participant: string;
    anonymous: string;
    score: string;
    category: string;
    empty: string;
  };
}

const MEDAL_COLORS = ['text-yellow-400', 'text-gray-400', 'text-amber-600'];

export default function LeaderboardTable({ entries = [], title, labels }: LeaderboardTableProps) {
  return (
    <div>
      <h3 className="text-lg font-bold text-[#0f2d5e] mb-4">{title}</h3>

      {entries.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">{labels.empty}</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0f2d5e]/5 text-gray-600 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-start w-12">#</th>
                <th className="px-4 py-3 text-start">{labels.participant}</th>
                <th className="px-4 py-3 text-end">{labels.score}</th>
                <th className="px-4 py-3 text-end hidden sm:table-cell">{labels.category}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={entry.rank} className={`border-t border-gray-100 ${i < 3 ? 'font-semibold' : ''}`}>
                  <td className="px-4 py-3">
                    {i < 3 ? (
                      <Medal className={`w-5 h-5 ${MEDAL_COLORS[i]}`} />
                    ) : (
                      <span className="text-gray-400">{i + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    <span className="block">{entry.displayName || labels.anonymous}</span>
                    {entry.city && (
                      <span className="block text-xs font-normal text-gray-400">{entry.city}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <span
                      className={`font-bold ${
                        entry.score >= 80 ? 'text-green-600' : entry.score >= 50 ? 'text-yellow-600' : 'text-red-500'
                      }`}
                    >
                      {entry.score}/100
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end text-gray-500 hidden sm:table-cell capitalize">{entry.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

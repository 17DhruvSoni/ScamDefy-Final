import React from 'react';
import { ScanResult } from '../../types';

interface Props { result: ScanResult }

const SOURCES = [
  { key: 'gsb',         label: 'Google Safe Browse' },
  { key: 'urlhaus',     label: 'URLhaus'            },
  { key: 'threatfox',   label: 'ThreatFox'          },
  { key: 'domain',      label: 'Domain Analysis'    },
  { key: 'heuristics',  label: 'Heuristics'         },
  { key: 'virustotal',  label: 'VirusTotal'         },
];

export function ThreatBreakdown({ result }: Props) {
  if (!result.breakdown) return null;
  return (
    <div className="glass-panel rounded-xl p-5 mt-4">
      <p className="text-[9px] font-mono uppercase tracking-widest text-white/30 mb-4">Score Breakdown</p>
      <div className="space-y-3">
        {SOURCES.map(src => {
          const val = (result.breakdown as any)[src.key] ?? 0;
          const pct = Math.min(100, Math.abs(val));
          const color = val > 20 ? '#ef4444' : val > 0 ? '#f59e0b' : '#00f2ff';
          return (
            <div key={src.key}>
              <div className="flex justify-between text-[10px] font-mono mb-1">
                <span className="text-white/40">{src.label}</span>
                <span style={{ color }}>{val > 0 ? '+' : ''}{val}</span>
              </div>
              <div className="h-1 rounded-full bg-white/5">
                <div
                  className="h-1 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: color, boxShadow: `0 0 4px ${color}` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

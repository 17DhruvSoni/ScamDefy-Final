
import type { VoiceResult as VoiceResultType } from '../../types';

interface Props { result: VoiceResultType }

export function VoiceResult({ result }: Props) {
  const isSynthetic = result.verdict === 'SYNTHETIC';
  const isUnknown = result.verdict === 'UNKNOWN' || result.verdict === 'UNCERTAIN';
  const color = isSynthetic ? '#e879f9' : isUnknown ? '#f59e0b' : '#4ade80';
  const label = isSynthetic ? 'AI VOICE DETECTED' : isUnknown ? 'INCONCLUSIVE' : 'AUTHENTIC VOICE CONFIRMED';
  const glow = isSynthetic ? 'glow-red' : isUnknown ? 'glow-orange' : 'glow-cyan';

  return (
    <div
      className={`glass-panel rounded-2xl p-6 slide-up ${glow}`}
      style={{ borderColor: `${color}30`, border: `1px solid ${color}30` }}
    >
      {/* Verdict */}
      <div className="flex items-center gap-4 mb-5">
        <div
          className="w-16 h-16 hexagon-clip flex items-center justify-center shrink-0"
          style={{ background: `${color}15`, border: `1px solid ${color}40` }}
        >
          <span className="text-2xl">{isSynthetic ? '🤖' : isUnknown ? '❓' : '✅'}</span>
        </div>
        <div>
          <p className="text-[9px] font-mono uppercase tracking-[0.3em] opacity-50 mb-1">Verdict</p>
          <p
            className="text-xl font-black uppercase tracking-tighter leading-none"
            style={{ color, textShadow: `0 0 12px ${color}` }}
          >
            {label}
          </p>
        </div>
      </div>

      {/* Confidence */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] font-mono mb-2">
          <span className="text-white/40 uppercase tracking-widest">Confidence</span>
          <span style={{ color }}>{result.confidence_pct?.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5">
          <div
            className="h-1.5 rounded-full transition-all duration-700"
            style={{
              width: `${result.confidence_pct}%`,
              background: color,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
        </div>
      </div>

      {/* Model status */}
      <div className="flex items-center gap-2">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: result.model_loaded ? '#00f2ff' : '#f59e0b', boxShadow: `0 0 4px ${result.model_loaded ? '#00f2ff' : '#f59e0b'}` }}
        />
        <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
          {result.model_loaded ? 'PRETRAINED_MODEL_ACTIVE' : 'HEURISTIC_MODE'}
        </p>
      </div>

      {result.warning && (
        <p className="mt-3 text-[10px] font-mono text-electricMagenta/60 leading-relaxed">{result.warning}</p>
      )}
    </div>
  );
}

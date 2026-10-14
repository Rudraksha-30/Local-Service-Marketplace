import { useEffect, useState } from 'react';
import { scoreTone, toneWord } from '../lib.js';

/**
 * The trust score as a 270-degree dial. The arc sweeps to the score once when it appears
 * (reduced-motion users get no sweep: see styles.css). Colour carries the same meaning as the
 * word underneath, so the score never relies on colour alone.
 */
export default function TrustDial({ score, isNew = false, size = 120, label = true }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(score));
    return () => cancelAnimationFrame(id);
  }, [score]);

  const r = 50;
  const circumference = 2 * Math.PI * r;
  const arc = circumference * 0.75; // the visible 270 degrees
  const tone = scoreTone(score, isNew);
  const rounded = Math.round(score);

  return (
    <div className={`dial tone-${tone}`} style={{ width: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={`Trust score ${rounded} out of 100. ${toneWord[tone]}.`}>
        <g transform="rotate(135 60 60)">
          <circle className="dial-track" cx="60" cy="60" r={r} strokeDasharray={`${arc} ${circumference}`} />
          <circle
            className="dial-fill"
            cx="60"
            cy="60"
            r={r}
            strokeDasharray={`${(arc * Math.min(100, Math.max(0, shown))) / 100} ${circumference}`}
          />
        </g>
        <text x="60" y="64" className="dial-number" textAnchor="middle">{rounded}</text>
        <text x="60" y="82" className="dial-unit" textAnchor="middle">of 100</text>
      </svg>
      {label && <div className="dial-word">{toneWord[tone]}</div>}
    </div>
  );
}

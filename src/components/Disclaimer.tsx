import { IconShield } from './icons';

export function Disclaimer() {
  return (
    <div className="panel flex items-start gap-3 p-4 text-xs leading-relaxed text-muted">
      <IconShield className="mt-0.5 shrink-0 text-amber" width={16} height={16} />
      <p>
        <strong className="text-ink">Information only — not medical advice.</strong> HealthX-Intel scores public posts
        with a transparent rule engine and cross-references your own biomarkers. Alignment and risk scores are heuristics,
        not clinical judgements. Always verify anything important with a qualified clinician before acting on it.
      </p>
    </div>
  );
}

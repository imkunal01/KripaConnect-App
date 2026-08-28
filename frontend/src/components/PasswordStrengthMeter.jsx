function getChecks(password, minLength) {
  const value = password ?? ''
  return [
    {
      key: 'length',
      label: `Min ${minLength} characters`,
      ok: value.length >= minLength,
    },
    {
      key: 'lower',
      label: 'Lowercase letter (a-z)',
      ok: /[a-z]/.test(value),
    },
    {
      key: 'upper',
      label: 'Uppercase letter (A-Z)',
      ok: /[A-Z]/.test(value),
    },
    {
      key: 'number',
      label: 'At least 1 number (0-9)',
      ok: /\d/.test(value),
    },
    {
      key: 'special',
      label: 'Special symbol (!@#$)',
      ok: /[^A-Za-z0-9]/.test(value),
    },
  ]
}

function getStrength(score, total) {
  if (total <= 0 || score === 0) return { label: 'Too short', tone: 'weak' }
  if (score <= 2) return { label: 'Weak', tone: 'weak' }
  if (score <= total - 1) return { label: 'Good', tone: 'okay' }
  return { label: 'Strong', tone: 'strong' }
}

export default function PasswordStrengthMeter({
  password,
  minLength = 8,
  visible = true,
  title = 'Password security rating',
}) {
  if (!visible) return null

  const checks = getChecks(password, minLength)
  const score = checks.reduce((acc, c) => acc + (c.ok ? 1 : 0), 0)
  const total = checks.length
  const percent = Math.round((score / total) * 100)
  const strength = getStrength(score, total)

  return (
    <div className="cyber-password-meter" aria-live="polite">
      <div className="meter-header">
        <span className="meter-title">{title}</span>
        <span className={`meter-tag ${strength.tone}`}>
          {strength.label}
        </span>
      </div>

      <div
        className="meter-track"
        role="progressbar"
        aria-label="Password strength progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Number.isFinite(percent) ? percent : 0}
      >
        <div
          className={`meter-fill ${strength.tone}`}
          style={{ width: `${Number.isFinite(percent) ? percent : 0}%` }}
        />
      </div>

      <ul className="meter-rules-grid">
        {checks.map((c) => (
          <li
            key={c.key}
            className={`meter-rule-item ${c.ok ? 'pass' : ''}`}
          >
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

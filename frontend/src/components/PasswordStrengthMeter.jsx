function getChecks(password, minLength) {
  const value = password ?? ''
  return [
    {
      key: 'length',
      label: `At least ${minLength} characters`,
      ok: value.length >= minLength,
    },
    {
      key: 'lower',
      label: 'One lowercase letter (a-z)',
      ok: /[a-z]/.test(value),
    },
    {
      key: 'upper',
      label: 'One uppercase letter (A-Z)',
      ok: /[A-Z]/.test(value),
    },
    {
      key: 'number',
      label: 'One number (0-9)',
      ok: /\d/.test(value),
    },
    {
      key: 'special',
      label: 'One special character (!@#$...)',
      ok: /[^A-Za-z0-9]/.test(value),
    },
  ]
}

function getStrength(score, total) {
  if (total <= 0) return { label: '—', tone: 'neutral' }
  if (score <= 2) return { label: 'Weak', tone: 'weak' }
  if (score <= total - 1) return { label: 'Okay', tone: 'okay' }
  return { label: 'Strong', tone: 'strong' }
}

export default function PasswordStrengthMeter({
  password,
  minLength = 8,
  visible = true,
  title = 'Password requirements',
}) {
  if (!visible) return null

  const checks = getChecks(password, minLength)
  const score = checks.reduce((acc, c) => acc + (c.ok ? 1 : 0), 0)
  const total = checks.length
  const percent = Math.round((score / total) * 100)
  const strength = getStrength(score, total)

  return (
    <div className="password-meter" aria-live="polite">
      <div className="password-meter__header">
        <div className="password-meter__title">{title}</div>
        <div className={`password-meter__label password-meter__label--${strength.tone}`}>
          {strength.label}
        </div>
      </div>

      <div
        className="password-meter__bar"
        role="progressbar"
        aria-label="Password strength"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Number.isFinite(percent) ? percent : 0}
      >
        <div
          className={`password-meter__fill password-meter__fill--${strength.tone}`}
          style={{ width: `${Number.isFinite(percent) ? percent : 0}%` }}
        />
      </div>

      <ul className="password-meter__rules">
        {checks.map((c) => (
          <li
            key={c.key}
            className={c.ok ? 'password-meter__rule is-pass' : 'password-meter__rule is-fail'}
          >
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

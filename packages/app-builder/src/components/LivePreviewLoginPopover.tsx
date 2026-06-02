import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Icon, Checkbox } from '@jf/design-system'
import { Heading } from '@jf/app-elements'

type View = 'login' | 'signup' | 'email-signup' | 'forgot-password'

interface LivePreviewLoginPopoverProps {
  open: boolean
  onClose: () => void
  onLoggedIn?: () => void
  initialView?: View
  /** 'popover' anchors to the header login icon; 'page' fills the screen (used from the landing menu). */
  variant?: 'popover' | 'page'
}

const PROVIDERS = [
  { id: 'google', label: 'Google', icon: 'google-color' },
  { id: 'microsoft', label: 'Microsoft', icon: 'microsoft-color' },
  { id: 'facebook', label: 'Facebook', icon: 'facebook-circle-color' },
  { id: 'apple', label: 'Apple', icon: 'apple-filled' },
]

const SIGNUP_PROVIDERS = [
  { id: 'google', label: 'Google', icon: 'google-color' },
  { id: 'microsoft', label: 'Microsoft', icon: 'microsoft-color' },
]

export function LivePreviewLoginPopover({
  open,
  onClose,
  onLoggedIn,
  initialView = 'login',
  variant = 'popover',
}: LivePreviewLoginPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>(initialView)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('')
  const [signupAgreed, setSignupAgreed] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')

  useEffect(() => {
    if (open) setView(initialView)
  }, [open, initialView])

  useEffect(() => {
    if (!open || variant === 'page') return
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const id = window.setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, onClose, variant])

  if (!open) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onLoggedIn?.()
    onClose()
  }

  const ariaLabel =
    view === 'login'
      ? 'Log in'
      : view === 'signup'
      ? 'Sign up'
      : view === 'email-signup'
      ? 'Sign up with Email'
      : 'Forgot password'

  const body = (
    <div className="live-preview__login-popover-inner">
      {variant === 'page' && (view === 'login' || view === 'signup') && (
        <div className="live-preview__auth-page-heading">
          <Heading
            size="Medium"
            heading={view === 'login' ? 'Log in' : 'Create an account'}
            subheading={view === 'login' ? 'Sign in to continue.' : 'Sign up to get started.'}
          />
        </div>
      )}
      {view === 'login' && (
        <>
          <div className="live-preview__login-popover-providers">
            {PROVIDERS.map((p) => (
              <div key={p.id} className="live-preview__login-popover-provider">
                <button
                  type="button"
                  className="live-preview__login-popover-provider-btn"
                  aria-label={`Continue with ${p.label}`}
                >
                  <Icon name={p.icon} category="brands" size={24} />
                </button>
                <span className="live-preview__login-popover-provider-label">{p.label}</span>
              </div>
            ))}
          </div>

          <div className="live-preview__login-popover-divider">
            <span>OR</span>
          </div>

          <form className="live-preview__login-popover-form" onSubmit={handleSubmit}>
            <div className="live-preview__login-popover-field">
              <label htmlFor="login-popover-email" className="live-preview__login-popover-label">
                Email address or username
              </label>
              <input
                id="login-popover-email"
                type="text"
                className="live-preview__login-popover-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>

            <div className="live-preview__login-popover-field">
              <label htmlFor="login-popover-password" className="live-preview__login-popover-label">
                Password
              </label>
              <div className="live-preview__login-popover-password-wrap">
                <input
                  id="login-popover-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  className="live-preview__login-popover-input live-preview__login-popover-input--password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="live-preview__login-popover-password-toggle"
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowLoginPassword((v) => !v)}
                >
                  <Icon
                    name={showLoginPassword ? 'eye-filled' : 'eye-slash-filled'}
                    category="general"
                    size={20}
                  />
                </button>
              </div>
            </div>

            <button
              type="button"
              className="live-preview__login-popover-forgot"
              onClick={() => setView('forgot-password')}
            >
              Forgot password?
            </button>

            <button type="submit" className="live-preview__login-popover-submit">
              Log in
            </button>
          </form>

          <div className="live-preview__login-popover-footer">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              className="live-preview__login-popover-link"
              onClick={() => setView('signup')}
            >
              Sign up
            </button>
          </div>
        </>
      )}
      {view === 'signup' && (
        <>
          <div className="live-preview__login-popover-signup-providers">
            {SIGNUP_PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="live-preview__login-popover-signup-provider"
              >
                <Icon name={p.icon} category="brands" size={24} />
                <span>Sign up with {p.label}</span>
              </button>
            ))}
          </div>

          <div className="live-preview__login-popover-divider">
            <span>OR</span>
          </div>

          <button
            type="button"
            className="live-preview__login-popover-email-signup"
            onClick={() => setView('email-signup')}
          >
            <Icon name="envelope-closed-filled" category="communication" size={20} />
            <span>Sign up with Email</span>
          </button>

          <div className="live-preview__login-popover-footer">
            Already have an account?{' '}
            <button
              type="button"
              className="live-preview__login-popover-link"
              onClick={() => setView('login')}
            >
              Log in
            </button>
          </div>
        </>
      )}
      {view === 'email-signup' && (
        <>
          <h2 className="live-preview__login-popover-title">Sign up with Email</h2>

          <button
            type="button"
            className="live-preview__login-popover-back"
            onClick={() => setView('signup')}
          >
            <Icon name="angle-left-circle-filled" category="arrows" size={20} />
            <span>More sign up options</span>
          </button>

          <form
            className="live-preview__login-popover-form"
            onSubmit={(e) => {
              e.preventDefault()
              onLoggedIn?.()
              onClose()
            }}
          >
            <div className="live-preview__login-popover-field">
              <label htmlFor="signup-popover-name" className="live-preview__login-popover-label">
                Name
              </label>
              <input
                id="signup-popover-name"
                type="text"
                className="live-preview__login-popover-input"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="live-preview__login-popover-field">
              <label htmlFor="signup-popover-email" className="live-preview__login-popover-label">
                Email
              </label>
              <input
                id="signup-popover-email"
                type="email"
                className="live-preview__login-popover-input"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
              />
            </div>

            <div className="live-preview__login-popover-field">
              <label htmlFor="signup-popover-password" className="live-preview__login-popover-label">
                Password
              </label>
              <div className="live-preview__login-popover-password-wrap">
                <input
                  id="signup-popover-password"
                  type={showSignupPassword ? 'text' : 'password'}
                  className="live-preview__login-popover-input live-preview__login-popover-input--password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="live-preview__login-popover-password-toggle"
                  aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowSignupPassword((v) => !v)}
                >
                  <Icon
                    name={showSignupPassword ? 'eye-filled' : 'eye-slash-filled'}
                    category="general"
                    size={20}
                  />
                </button>
              </div>
              <div className="live-preview__login-popover-password-hint">
                <Icon name="info-circle-filled" category="general" size={16} />
                <span>Your password must include at least</span>
              </div>
              <div
                className={`live-preview__login-popover-password-rule${
                  signupPassword.length >= 1 ? ' live-preview__login-popover-password-rule--met' : ''
                }`}
              >
                <Icon name="info-circle-filled" category="general" size={16} />
                <span>1 characters</span>
              </div>
            </div>

            <div className="live-preview__login-popover-field">
              <label htmlFor="signup-popover-confirm" className="live-preview__login-popover-label">
                Confirm Password
              </label>
              <div className="live-preview__login-popover-password-wrap">
                <input
                  id="signup-popover-confirm"
                  type={showSignupConfirmPassword ? 'text' : 'password'}
                  className="live-preview__login-popover-input live-preview__login-popover-input--password"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="live-preview__login-popover-password-toggle"
                  aria-label={showSignupConfirmPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowSignupConfirmPassword((v) => !v)}
                >
                  <Icon
                    name={showSignupConfirmPassword ? 'eye-filled' : 'eye-slash-filled'}
                    category="general"
                    size={20}
                  />
                </button>
              </div>
            </div>

            <div className="live-preview__login-popover-terms">
              <Checkbox
                size="sm"
                id="signup-popover-terms"
                label=""
                checked={signupAgreed}
                onChange={(e) => setSignupAgreed(e.target.checked)}
              />
              <label
                htmlFor="signup-popover-terms"
                className="live-preview__login-popover-terms-text"
              >
                I agree to the{' '}
                <a href="#" className="live-preview__login-popover-terms-link">
                  Terms of Service
                </a>
                ,{' '}
                <a href="#" className="live-preview__login-popover-terms-link">
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a href="#" className="live-preview__login-popover-terms-link">
                  Cookie Policy
                </a>
                .
              </label>
            </div>

            <button type="submit" className="live-preview__login-popover-submit">
              Sign up
            </button>
          </form>

          <div className="live-preview__login-popover-footer">
            Already have an account?{' '}
            <button
              type="button"
              className="live-preview__login-popover-link"
              onClick={() => setView('login')}
            >
              Log in
            </button>
          </div>
        </>
      )}
      {view === 'forgot-password' && (
        <>
          <h2 className="live-preview__login-popover-title">Forgot password?</h2>

          <form
            className="live-preview__login-popover-form"
            onSubmit={(e) => {
              e.preventDefault()
              setView('login')
            }}
          >
            <div className="live-preview__login-popover-field">
              <label htmlFor="forgot-popover-email" className="live-preview__login-popover-label">
                Email address or username
              </label>
              <input
                id="forgot-popover-email"
                type="text"
                className="live-preview__login-popover-input"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                autoFocus
              />
            </div>

            <button type="submit" className="live-preview__login-popover-submit">
              Send Reset Instructions
            </button>
          </form>

          <button
            type="button"
            className="live-preview__login-popover-goback"
            onClick={() => setView('login')}
          >
            <Icon name="chevron-left" category="arrows" size={16} />
            <span>Go back</span>
          </button>
        </>
      )}
    </div>
  )

  if (variant === 'page') {
    return (
      <aside className="live-preview__auth-page app-scope" role="dialog" aria-label={ariaLabel}>
        <header className="live-preview__auth-page-header">
          <button
            type="button"
            className="live-preview__auth-page-close"
            aria-label="Close"
            onClick={onClose}
          >
            <Icon name="xmark" category="general" size={20} />
          </button>
        </header>
        {body}
      </aside>
    )
  }

  return (
    <div
      ref={ref}
      className={`live-preview__login-popover app-scope live-preview__login-popover--anchor-${initialView === 'signup' ? 'signup' : 'login'}`}
      role="dialog"
      aria-label={ariaLabel}
    >
      {body}
    </div>
  )
}

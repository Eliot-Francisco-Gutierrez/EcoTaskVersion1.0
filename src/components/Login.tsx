import { useEffect, useMemo, useState } from 'react'
import { ShieldPlus, UserCircle2, UserPlus } from 'lucide-react'
import { User } from '../data/mockData'

interface LoginProps {
  users: User[]
  onLogin: (payload: { user: User; token: string }) => void
}

export function Login({ users, onLogin }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBootstrapForm, setShowBootstrapForm] = useState(false)
  const [bootstrapError, setBootstrapError] = useState('')
  const [bootstrapLoading, setBootstrapLoading] = useState(true)
  const [canCreateAdmin, setCanCreateAdmin] = useState(false)
  const [adminFullName, setAdminFullName] = useState('Administrador principal')
  const [adminUsername, setAdminUsername] = useState('superadmin')
  const [adminPassword, setAdminPassword] = useState('')

  const apiBaseUrl = (() => {
    if (typeof window === 'undefined') return 'http://localhost:3001'

    const { hostname } = window.location
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
    const isLanHost = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname)

    if (import.meta.env.DEV && isLocalHost) {
      return 'http://localhost:3001'
    }

    if (import.meta.env.DEV && isLanHost) {
      return `http://${hostname}:3001`
    }

    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL.replace(/\/$/, '')
    }

    return 'http://localhost:3001'
  })()

  const hasAdminInProps = useMemo(
    () => users.some((user) => String(user.role).toLowerCase() === 'admin' || user.category === 'Administrador'),
    [users],
  )

  useEffect(() => {
    let cancelled = false

    const loadBootstrapStatus = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/auth/bootstrap-status`)
        if (!response.ok) throw new Error('bootstrap status unavailable')
        const data = await response.json()
        if (!cancelled) {
          setCanCreateAdmin(Boolean(data?.canCreateAdmin))
          setBootstrapLoading(false)
        }
      } catch {
        if (!cancelled) {
          setCanCreateAdmin(!hasAdminInProps)
          setBootstrapLoading(false)
        }
      }
    }

    loadBootstrapStatus()

    return () => {
      cancelled = true
    }
  }, [apiBaseUrl, hasAdminInProps])

  const handleLogin = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        throw new Error('Credenciales inválidas')
      }

      const data = await response.json()
      const matchedUser = users.find((item) => item.username === username) ?? { ...data.user, password: password }
      onLogin({ user: { ...matchedUser, permissions: data.permissions || matchedUser.permissions || [] }, token: data.token })
    } catch {
      setError('Usuario o contraseña incorrectos')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBootstrapAdmin = async () => {
    setIsSubmitting(true)
    setBootstrapError('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/bootstrap-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminUsername,
          fullName: adminFullName,
          password: adminPassword,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody?.error || 'No se pudo crear el administrador')
      }

      const data = await response.json()
      const matchedUser = users.find((item) => item.username === data.user?.username) ?? {
        ...data.user,
        password: adminPassword,
      }
      onLogin({ user: { ...matchedUser, permissions: data.permissions || matchedUser.permissions || ['all'] }, token: data.token })
    } catch (loginError) {
      setBootstrapError(loginError instanceof Error ? loginError.message : 'No se pudo crear el administrador')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eef2f3] px-4 py-8">
      <div className="w-full max-w-md rounded-[30px] border border-[#dfe7eb] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#eafaf0] text-[#0f8b3f] ring-1 ring-[#bfe8c8]">
            <UserCircle2 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">EcoTask</h1>
            <p className="text-sm text-slate-500">Inicia sesión para continuar</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">Usuario</label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-green-500 focus:bg-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-green-500 focus:bg-white"
            />
          </div>
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <button
            type="button"
            onClick={handleLogin}
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-[#16a34a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f8b3f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </div>

        <div className="mt-6 rounded-[24px] border border-dashed border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-white p-2 text-emerald-600 ring-1 ring-emerald-200">
              <ShieldPlus className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-900">Alta inicial de administrador</p>
              <p className="mt-1 text-xs text-emerald-800/80">
                Si todavía no hay un administrador creado, podés generarlo desde acá y entrar con permisos completos.
              </p>
            </div>
          </div>

          {bootstrapLoading ? (
            <p className="mt-4 text-sm text-emerald-800/80">Verificando disponibilidad...</p>
          ) : canCreateAdmin ? (
            <div className="mt-4 space-y-3">
              <div className="grid gap-3">
                <input
                  value={adminFullName}
                  onChange={(event) => setAdminFullName(event.target.value)}
                  placeholder="Nombre completo"
                  className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
                />
                <input
                  value={adminUsername}
                  onChange={(event) => setAdminUsername(event.target.value)}
                  placeholder="Usuario administrador"
                  className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
                />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(event) => setAdminPassword(event.target.value)}
                  placeholder="Contraseña"
                  className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
                />
              </div>

              {bootstrapError && <p className="text-sm text-rose-500">{bootstrapError}</p>}

              <button
                type="button"
                onClick={handleBootstrapAdmin}
                disabled={isSubmitting || !adminUsername || !adminFullName || !adminPassword}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <UserPlus className="h-4 w-4" />
                {isSubmitting ? 'Creando...' : 'Crear administrador y entrar'}
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-emerald-800/80">
              Ya existe un administrador. Iniciá sesión con una cuenta creada o eliminá el admin actual si querés volver a crear uno.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

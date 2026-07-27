import { useState, useEffect } from 'react'
import { User, Lock, LogOut, Save, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { useAppContext } from '../AppContext'

interface ProfileData {
  email: string
  nombre: string
  empresa: string
  telefono: string
}

export function Profile() {
  const { showToast } = useToast()
  const { setBusinessName } = useAppContext()
  const [profile, setProfile] = useState<ProfileData>({
    email: '',
    nombre: '',
    empresa: '',
    telefono: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setProfile({
          email: user.email ?? '',
          nombre: user.user_metadata?.nombre ?? '',
          empresa: user.user_metadata?.empresa ?? '',
          telefono: user.user_metadata?.telefono ?? '',
        })
      }
      setLoading(false)
    })
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      data: {
        nombre: profile.nombre,
        empresa: profile.empresa,
        telefono: profile.telefono,
      },
    })
    setSaving(false)
    if (error) {
      showToast('No se pudo actualizar el perfil.', 'error')
      return
    }
    setBusinessName(profile.empresa)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
    showToast('Perfil actualizado correctamente.')
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)

    if (newPassword !== confirmPassword) {
      setPwError('Las contraseñas nuevas no coinciden.')
      return
    }
    if (newPassword.length < 6) {
      setPwError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setChangingPw(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    })

    if (signInError) {
      setPwError('La contraseña actual es incorrecta.')
      setChangingPw(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })
    setChangingPw(false)

    if (updateError) {
      setPwError('Error al cambiar la contraseña. Intentá de nuevo.')
      showToast('No se pudo cambiar la contraseña.', 'error')
    } else {
      setPwSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwSuccess(false), 4000)
      showToast('Contraseña actualizada correctamente.')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) return null

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mi Perfil</h1>
        <p className="text-slate-500 text-sm mt-1">
          Administrá tu información y seguridad
        </p>
      </div>

      {/* Datos del negocio */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-lilac-100 p-2 rounded-xl">
            <User size={20} className="text-lilac-600" />
          </div>
          <h2 className="font-semibold text-slate-800">Datos del negocio</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">
              El email no puede modificarse
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={profile.nombre}
              onChange={(e) =>
                setProfile((p) => ({ ...p, nombre: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lilac-300 focus:border-transparent transition-shadow"
              placeholder="Tu nombre completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Nombre del emprendimiento
            </label>
            <input
              type="text"
              value={profile.empresa}
              onChange={(e) =>
                setProfile((p) => ({ ...p, empresa: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lilac-300 focus:border-transparent transition-shadow"
              placeholder="Nombre de tu negocio"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={profile.telefono}
              onChange={(e) =>
                setProfile((p) => ({ ...p, telefono: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lilac-300 focus:border-transparent transition-shadow"
              placeholder="+54 11 1234-5678"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-lilac-600 hover:bg-lilac-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {saveSuccess ? <CheckCircle size={18} /> : <Save size={18} />}
            {saveSuccess
              ? '¡Guardado!'
              : saving
                ? 'Guardando...'
                : 'Guardar cambios'}
          </button>
        </form>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-lilac-100 p-2 rounded-xl">
            <Lock size={20} className="text-lilac-600" />
          </div>
          <h2 className="font-semibold text-slate-800">Cambiar contraseña</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Contraseña actual
            </label>
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lilac-300 focus:border-transparent transition-shadow"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lilac-300 focus:border-transparent transition-shadow"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lilac-300 focus:border-transparent transition-shadow"
              placeholder="Repetí la contraseña"
            />
          </div>

          {pwError && (
            <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-xl">
              {pwError}
            </p>
          )}
          {pwSuccess && (
            <p className="text-green-600 text-sm bg-green-50 px-4 py-2 rounded-xl">
              ¡Contraseña actualizada correctamente!
            </p>
          )}

          <button
            type="submit"
            disabled={changingPw}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            <Lock size={18} />
            {changingPw ? 'Verificando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>

      {/* Cerrar sesión */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-red-500 hover:text-red-600 font-medium transition-colors"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react';

export function AuthPage({ mode, onSubmit, error, loading, onModeChange }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const register = mode === 'register';

  async function submit(event) {
    event.preventDefault();
    await onSubmit(email, password);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5">
      <form className="panel w-full max-w-md space-y-5" onSubmit={submit}>
        <div className="text-center">
          <div className="text-4xl">💧</div>
          <h1 className="mt-2 text-2xl font-bold text-ink">Welcome to DrinkSafe</h1>
          <p className="mt-1 text-sm text-muted">{register ? 'Create your monitoring account' : 'Sign in to your dashboard'}</p>
        </div>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
        <label className="block text-sm font-medium text-ink">
          Email
          <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
        </label>
        <label className="block text-sm font-medium text-ink">
          Password
          <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={register ? 'new-password' : 'current-password'} />
        </label>
        <button className="w-full rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-60" disabled={loading} type="submit">
          {loading ? 'Please wait…' : register ? 'Create account' : 'Sign in'}
        </button>
        <button className="w-full text-sm text-brand underline" onClick={() => onModeChange(register ? 'login' : 'register')} type="button">
          {register ? 'Already have an account? Sign in' : 'Need an account? Register'}
        </button>
      </form>
    </main>
  );
}

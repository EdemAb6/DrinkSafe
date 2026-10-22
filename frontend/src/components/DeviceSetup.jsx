import { useState } from 'react';

export function DeviceSetup({ onCreate, error, loading }) {
  const [name, setName] = useState('');
  const [channelId, setChannelId] = useState('');

  async function submit(event) {
    event.preventDefault();
    await onCreate(name, channelId);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5">
      <form className="panel w-full max-w-md space-y-5" onSubmit={submit}>
        <div>
          <h1 className="text-2xl font-bold text-ink">Add your sensor</h1>
          <p className="mt-1 text-sm text-muted">Connect the ThingSpeak channel used by this device.</p>
        </div>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
        <label className="block text-sm font-medium text-ink">
          Device name
          <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="block text-sm font-medium text-ink">
          ThingSpeak channel ID
          <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" value={channelId} onChange={(event) => setChannelId(event.target.value)} required />
        </label>
        <button className="w-full rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-60" disabled={loading} type="submit">
          {loading ? 'Saving…' : 'Add device'}
        </button>
      </form>
    </main>
  );
}

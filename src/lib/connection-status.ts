export type ConnectionState = 'connecting' | 'live' | 'offline' | 'local';

export function connectionState(provider: {
  wsconnected: boolean; wsconnecting: boolean; synced: boolean;
} | null): ConnectionState {
  if (!provider) return 'local';
  if (provider.wsconnected && provider.synced) return 'live';
  return provider.wsconnected || provider.wsconnecting ? 'connecting' : 'offline';
}

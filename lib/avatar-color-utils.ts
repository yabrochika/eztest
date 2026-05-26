/**
 * ユーザー名 / メールアドレスから決定論的にアバター用の配色クラスを生成する。
 * 同じユーザーには常に同じ色が割り当てられる。
 */

const AVATAR_COLOR_PALETTE: string[] = [
  'bg-gradient-to-br from-rose-500/70 via-rose-500/50 to-pink-600/70',
  'bg-gradient-to-br from-orange-500/70 via-orange-500/50 to-amber-600/70',
  'bg-gradient-to-br from-amber-500/70 via-amber-500/50 to-yellow-600/70',
  'bg-gradient-to-br from-lime-500/70 via-lime-500/50 to-green-600/70',
  'bg-gradient-to-br from-emerald-500/70 via-emerald-500/50 to-teal-600/70',
  'bg-gradient-to-br from-teal-500/70 via-teal-500/50 to-cyan-600/70',
  'bg-gradient-to-br from-sky-500/70 via-sky-500/50 to-blue-600/70',
  'bg-gradient-to-br from-blue-500/70 via-blue-500/50 to-indigo-600/70',
  'bg-gradient-to-br from-indigo-500/70 via-indigo-500/50 to-violet-600/70',
  'bg-gradient-to-br from-violet-500/70 via-violet-500/50 to-purple-600/70',
  'bg-gradient-to-br from-purple-500/70 via-purple-500/50 to-fuchsia-600/70',
  'bg-gradient-to-br from-fuchsia-500/70 via-fuchsia-500/50 to-pink-600/70',
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0; // 32bit
  }
  return Math.abs(hash);
}

/**
 * 与えられたキー（メール優先、なければ名前）から、決定論的にアバター背景色クラスを返す。
 */
export function getAvatarColorClass(key: string | undefined | null): string {
  const seed = (key ?? '').trim() || 'default';
  const index = hashString(seed) % AVATAR_COLOR_PALETTE.length;
  return AVATAR_COLOR_PALETTE[index];
}

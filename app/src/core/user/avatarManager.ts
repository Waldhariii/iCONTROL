/**
 * ICONTROL_AVATAR_MANAGER_V1
 * Gestionnaire d'avatar utilisateur (couleur ou image)
 */
export type AvatarConfig = {
  type: "color" | "image";
  color?: string;
  imageUrl?: string;
};

const LS_KEY = "icontrol_user_avatar_v1";

export function getAvatarConfig(username: string): AvatarConfig {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      // Générer une couleur basée sur le username
      const color = generateColorFromUsername(username);
      return { type: "color", color };
    }
    const all = JSON.parse(raw) as Record<string, AvatarConfig>;
    return all[username] || { type: "color", color: generateColorFromUsername(username) };
  } catch {
    return { type: "color", color: generateColorFromUsername(username) };
  }
}

export function setAvatarConfig(username: string, config: AvatarConfig): void {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, AvatarConfig>) : {};
    all[username] = config;
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn("Erreur lors de la sauvegarde de l'avatar:", e);
  }
}

function generateColorFromUsername(username: string): string {
  // Générer une couleur cohérente basée sur le username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

export function getInitials(username: string): string {
  if (!username) return "?";
  const parts = username.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return username[0].toUpperCase();
}

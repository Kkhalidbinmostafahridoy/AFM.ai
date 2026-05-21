/** Build platform compose / share URLs so Send can open the correct network in a new tab. */

const SOCIAL_CHANNEL_IDS = new Set([
  "twitter",
  "facebook",
  "linkedin",
  "instagram",
  "tiktok",
  "youtube",
  "whatsapp",
  "telegram",
  "discord",
  "slack",
]);

export function isSocialChannel(channelId: string): boolean {
  return SOCIAL_CHANNEL_IDS.has(channelId);
}

export function getSocialPostUrl(
  channelId: string,
  content: string
): string | null {
  const text = encodeURIComponent(content.slice(0, 2000));
  const appUrl = encodeURIComponent(
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      "http://localhost:3000"
  );

  switch (channelId) {
    case "twitter":
      return `https://twitter.com/intent/tweet?text=${text}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${appUrl}&quote=${text}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${appUrl}`;
    case "whatsapp":
      return `https://wa.me/?text=${text}`;
    case "telegram":
      return `https://t.me/share/url?url=${appUrl}&text=${text}`;
    case "instagram":
    case "tiktok":
      return `https://www.${channelId}.com/`;
    case "youtube":
      return "https://studio.youtube.com/";
    case "discord":
      return "https://discord.com/channels/@me";
    case "slack":
      return "https://slack.com/";
    case "gmail":
      return `mailto:?subject=${encodeURIComponent("AFM.ai post")}&body=${text}`;
    default:
      return null;
  }
}

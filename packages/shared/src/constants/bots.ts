/**
 * Link-unfurl bots (WhatsApp, Twitter/X, Facebook, Slack, Telegram...) issue a
 * real GET against the public presskit route the instant a link is shared —
 * before any human opens it. Without this filter every share would inflate
 * the view count we sell as the analytics differentiator.
 */
const BOT_USER_AGENT_PATTERNS = [
  /whatsapp/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /slackbot/i,
  /telegrambot/i,
  /discordbot/i,
  /linkedinbot/i,
  /googlebot/i,
  /bingbot/i,
  /bot|crawler|spider|preview|headless/i,
];

export function isBotUserAgent(userAgent: string | undefined | null): boolean {
  if (!userAgent) return true;
  return BOT_USER_AGENT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

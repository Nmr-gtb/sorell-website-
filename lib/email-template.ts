// ---- Template Email Newsletter V5 ----------------------------------------
// Migration React Email — composants modulaires
// Inline HTML compatible Gmail, Outlook, Apple Mail, Yahoo

import React from "react";
import { render } from "@react-email/components";
import { NewsletterEmail } from "@/emails/NewsletterEmail";
import { buildUnsubscribeUrl } from "@/lib/unsubscribe-token";

export interface Article {
  tag: string;
  title: string;
  hook?: string;
  content?: string;
  summary?: string;
  source: string;
  url?: string;
  featured?: boolean;
}

export interface KeyFigure {
  value: string;
  label: string;
  context: string;
}

export interface EmailTemplateParams {
  newsletterId: string;
  recipientEmail: string;
  subject: string;
  brandColor: string;
  textColor: string;
  bgColor: string;
  bodyTextColor: string;
  customLogo: string | null;
  date: string;
  editorial: string;
  keyFigures: KeyFigure[];
  featuredArticle: Article;
  otherArticles: Article[];
  plan: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(text: string, maxLen: number): string {
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen).replace(/\s+\S*$/, "") + "...";
}

function trackClick(newsletterId: string, recipientEmail: string, articleTitle: string, url: string): string {
  return `https://www.sorell.fr/api/track/click?nid=${newsletterId}&email=${encodeURIComponent(recipientEmail)}&article=${encodeURIComponent(articleTitle)}&url=${encodeURIComponent(url)}`;
}

export async function buildNewsletterHtml(params: EmailTemplateParams): Promise<string> {
  const {
    newsletterId,
    recipientEmail,
    subject,
    brandColor,
    textColor,
    bgColor,
    bodyTextColor,
    customLogo,
    date,
    editorial,
    keyFigures,
    featuredArticle,
    otherArticles,
    plan,
  } = params;

  const unsubscribeUrl = buildUnsubscribeUrl(recipientEmail);

  const element = React.createElement(NewsletterEmail, {
    newsletterId,
    recipientEmail,
    subject,
    brandColor,
    textColor,
    bgColor,
    bodyTextColor,
    customLogo,
    date,
    editorial,
    keyFigures,
    featuredArticle,
    otherArticles,
    plan,
    unsubscribeUrl,
  });

  const html = await render(element);
  return html;
}

// Re-export utilities for external use
export { escapeHtml, truncate, trackClick };

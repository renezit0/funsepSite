import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type AuditUserContext = {
  sigla?: string | null;
  matricula?: number | null;
  nome?: string | null;
  cargo?: string | null;
  isAdmin?: boolean | null;
};

export type AuditLogInput = {
  eventType: string;
  page?: string | null;
  label?: string | null;
  element?: string | null;
  target?: string | null;
  path?: string | null;
  appArea?: "public" | "admin" | null;
  user?: AuditUserContext | null;
  extra?: Json | null;
};

const MAX_TEXT_LENGTH = 500;
let lastEventKey = "";
let lastEventAt = 0;

const truncate = (value?: string | null) => {
  if (!value) return value ?? null;
  if (value.length <= MAX_TEXT_LENGTH) return value;
  return value.slice(0, MAX_TEXT_LENGTH);
};

const getBaseMeta = () => {
  const hashPath = window.location.hash ? window.location.hash.replace("#", "") : "";
  return {
    user_agent: navigator.userAgent,
    platform: navigator.platform,
    url: window.location.href,
    referrer: document.referrer || null,
    path: hashPath || window.location.pathname
  };
};

const shouldSkipEvent = (eventType: string, label?: string | null, page?: string | null) => {
  const key = `${eventType}|${page ?? ""}|${label ?? ""}`;
  const now = Date.now();
  if (key === lastEventKey && now - lastEventAt < 500) {
    return true;
  }
  lastEventKey = key;
  lastEventAt = now;
  return false;
};

export const logAuditEvent = async (input: AuditLogInput) => {
  try {
    if (shouldSkipEvent(input.eventType, input.label, input.page)) return;

    const base = getBaseMeta();
    await supabase.from("audit_logs").insert({
      event_type: input.eventType,
      page: truncate(input.page ?? undefined),
      label: truncate(input.label ?? undefined),
      element: truncate(input.element ?? undefined),
      target: truncate(input.target ?? undefined),
      path: truncate(input.path ?? base.path),
      user_agent: truncate(base.user_agent),
      platform: truncate(base.platform),
      url: truncate(base.url),
      referrer: truncate(base.referrer ?? undefined),
      app_area: input.appArea ?? null,
      user_sigla: input.user?.sigla ?? null,
      user_matricula: input.user?.matricula ?? null,
      user_nome: input.user?.nome ?? null,
      user_cargo: input.user?.cargo ?? null,
      is_admin: input.user?.isAdmin ?? null,
      extra: input.extra ?? null
    });
  } catch (error) {
    console.warn("Audit log failed:", error);
  }
};

export const extractClickInfo = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  if (!target) return null;

  const clickable = target.closest(
    "button, a, [role='button'], [role='tab'], [data-audit-click]"
  ) as HTMLElement | null;

  if (!clickable) return null;
  if (clickable.getAttribute("data-audit-ignore") === "true") return null;

  const label =
    clickable.getAttribute("data-audit-label") ||
    clickable.getAttribute("aria-label") ||
    clickable.getAttribute("title") ||
    clickable.textContent?.trim() ||
    clickable.id ||
    null;

  const element = clickable.tagName.toLowerCase();
  const href = clickable instanceof HTMLAnchorElement ? clickable.getAttribute("href") : null;
  const targetValue = clickable.getAttribute("data-audit-target") || href || null;

  return {
    label,
    element,
    target: targetValue
  };
};

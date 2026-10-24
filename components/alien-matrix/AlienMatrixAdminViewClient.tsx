"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  UsersThree,
  LockKey,
  Palette,
  Translate,
  Trash,
  DownloadSimple,
  Plus,
  Check,
  X,
  CircleNotch,
  Key,
  Globe,
  Coins,
  ArrowCounterClockwise,
} from "@/lib/ui/icons";
import {
  SUPPORTED_LANGUAGES,
  SUPPORTED_CURRENCIES,
  COMMON_TIMEZONES,
} from "@/lib/alien-matrix/settings-constants";

interface RoleItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  permissions: any;
  is_system: boolean;
  assignments?: Array<{ count: number }>;
}

interface AlienMatrixAdminViewClientProps {
  initialRoles: RoleItem[];
  initialSecurity: any;
  initialTenantSettings: any;
  initialTrash: any[];
}

export function AlienMatrixAdminViewClient({
  initialRoles,
  initialSecurity,
  initialTenantSettings,
  initialTrash,
}: AlienMatrixAdminViewClientProps) {
  const [activeTab, setActiveTab] = useState<"roles" | "security" | "branding" | "trash">("roles");

  // Roles state
  const [roles, setRoles] = useState<RoleItem[]>(initialRoles);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleSlug, setNewRoleSlug] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Security state
  const [security, setSecurity] = useState(initialSecurity);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [securitySuccess, setSecuritySuccess] = useState(false);

  // Branding & Localization state
  const [tenantSettings, setTenantSettings] = useState(initialTenantSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Trash state
  const [trash, setTrash] = useState(initialTrash);

  // 1. Save Security Settings
  async function handleSaveSecurity(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingSecurity(true);
    setSecuritySuccess(false);

    try {
      const res = await fetch("/api/v1/alien-matrix/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enforce2fa: security.enforce_2fa,
          ssoProvider: security.sso_provider,
          ssoDomain: security.sso_domain || undefined,
          ssoClientId: security.sso_client_id || undefined,
          ssoMetadataUrl: security.sso_metadata_url || undefined,
          sessionTimeoutMinutes: security.session_timeout_minutes,
        }),
      });
      if (res.ok) {
        setSecuritySuccess(true);
        setTimeout(() => setSecuritySuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSecurity(false);
    }
  }

  // 2. Save Branding & Localization
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSuccess(false);

    try {
      const res = await fetch("/api/v1/alien-matrix/tenant-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: tenantSettings.brand_name || undefined,
          logoUrl: tenantSettings.logo_url || undefined,
          primaryColorHex: tenantSettings.primary_color_hex,
          accentColorHex: tenantSettings.accent_color_hex,
          customDomain: tenantSettings.custom_domain || undefined,
          timezone: tenantSettings.timezone,
          currency: tenantSettings.currency,
          language: tenantSettings.language,
        }),
      });
      if (res.ok) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSettings(false);
    }
  }

  // 3. Create Custom Role
  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingRole(true);

    try {
      const res = await fetch("/api/v1/alien-matrix/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoleName.trim(),
          slug: newRoleSlug.trim().toLowerCase(),
          description: newRoleDesc.trim() || undefined,
          permissions: {
            objects: {
              deals: ["read", "create", "update"],
              contacts: ["read", "create", "update"],
              invoices: ["read", "create"],
              products: ["read"],
            },
            allRecordsVisibility: true,
          },
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setRoles((prev) => [...prev, json.data || json]);
        setIsRoleModalOpen(false);
        setNewRoleName("");
        setNewRoleSlug("");
        setNewRoleDesc("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingRole(false);
    }
  }

  // 4. Restore soft-deleted item
  async function handleRestore(id: string) {
    try {
      const res = await fetch(`/api/v1/alien-matrix/trash/${id}/restore`, { method: "POST" });
      if (res.ok) {
        setTrash((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--line-2)]">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--well)] text-[var(--tomato)] border border-[var(--line-2)]">
              <ShieldCheck size={22} weight="bold" />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text)]">
                Organization Governance &amp; Administration
              </h1>
              <p className="text-xs text-[var(--muted)] mt-1">
                Granular RBAC roles, security &amp; corporate SSO, white-label branding, and data retention recycling.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rapport Segmented Pill Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <div className="tabs__track p-1 flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("roles")}
            data-active={activeTab === "roles"}
            className="tab"
          >
            <UsersThree size={15} />
            Roles &amp; Permissions ({roles.length})
          </button>

          <button
            onClick={() => setActiveTab("security")}
            data-active={activeTab === "security"}
            className="tab"
          >
            <LockKey size={15} />
            Security &amp; SSO
          </button>

          <button
            onClick={() => setActiveTab("branding")}
            data-active={activeTab === "branding"}
            className="tab"
          >
            <Palette size={15} />
            Branding &amp; Locale
          </button>

          <button
            onClick={() => setActiveTab("trash")}
            data-active={activeTab === "trash"}
            className="tab"
          >
            <Trash size={15} />
            Recycle Bin ({trash.length})
          </button>
        </div>
      </div>

      {/* TAB 1: ROLES & PERMISSIONS */}
      {activeTab === "roles" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)]">
                Granular RBAC &amp; Access Governance
              </h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Define role-based entity permissions across all standard CRM and dynamic custom objects.
              </p>
            </div>
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="btn btn--ink inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2"
            >
              <Plus size={14} weight="bold" />
              New Custom Role
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((r) => (
              <div
                key={r.id}
                className="rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] p-5 backdrop-blur-md space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text)]">{r.name}</h4>
                    <span className="font-mono text-[11px] text-[var(--muted)]">slug: {r.slug}</span>
                  </div>
                  {r.is_system && (
                    <span className="badge badge--plain text-[10px] font-semibold">
                      System Defined
                    </span>
                  )}
                </div>

                {r.description && <p className="text-xs text-[var(--muted)]">{r.description}</p>}

                <div className="pt-2 border-t border-[var(--line-2)]">
                  <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider block mb-2">
                    Active Entity Permissions
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {r.permissions?.objects ? (
                      Object.entries(r.permissions.objects).map(([obj, perms]: [string, any]) => (
                        <span
                          key={obj}
                          className="badge badge--plain text-[11px]"
                        >
                          <strong>{obj}:</strong> {Array.isArray(perms) ? perms.join(", ") : perms}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[var(--muted)]">Full Unrestricted Access</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY & SSO */}
      {activeTab === "security" && (
        <form onSubmit={handleSaveSecurity} className="max-w-2xl space-y-6">
          <div className="rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] p-6 backdrop-blur-md space-y-5">
            <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <Key size={18} className="text-[var(--tomato)]" /> Authentication &amp; 2FA Policies
            </h3>

            <div className="flex items-center justify-between p-4 rounded-[var(--r-tile)] bg-[var(--solid)] border border-[var(--line-2)] shadow-sm">
              <div>
                <div className="text-xs font-semibold text-[var(--text)]">
                  Enforce Two-Factor Authentication (2FA / TOTP)
                </div>
                <div className="text-[11px] text-[var(--muted)] mt-0.5">
                  Mandates an authenticator app code for all workspace members during sign-in.
                </div>
              </div>
              <input
                type="checkbox"
                checked={security.enforce_2fa}
                onChange={(e) => setSecurity({ ...security, enforce_2fa: e.target.checked })}
                className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Session Idle Timeout (minutes)
              </label>
              <input
                type="number"
                value={security.session_timeout_minutes}
                onChange={(e) =>
                  setSecurity({ ...security, session_timeout_minutes: parseInt(e.target.value, 10) || 1440 })
                }
                className="w-full sm:w-48 rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] font-numeric focus:outline-none focus:border-[var(--pill)]"
              />
            </div>
          </div>

          <div className="rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] p-6 backdrop-blur-md space-y-4">
            <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <Globe size={18} className="text-purple-600 dark:text-purple-400" /> Enterprise Single Sign-On (SSO)
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                SSO Identity Provider
              </label>
              <select
                value={security.sso_provider}
                onChange={(e) => setSecurity({ ...security, sso_provider: e.target.value })}
                className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
              >
                <option value="none">Disabled (Email &amp; Secure Password)</option>
                <option value="google">Google Workspace SSO</option>
                <option value="microsoft">Microsoft Azure AD / Entra ID</option>
                <option value="saml_oidc">SAML 2.0 / OpenID Connect Enterprise</option>
              </select>
            </div>

            {security.sso_provider !== "none" && (
              <div className="space-y-3 pt-3 border-t border-[var(--line-2)]">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Restricted Corporate Domain
                  </label>
                  <input
                    type="text"
                    value={security.sso_domain || ""}
                    onChange={(e) => setSecurity({ ...security, sso_domain: e.target.value })}
                    placeholder="tenant.example.com"
                    className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Client ID / Application ID
                  </label>
                  <input
                    type="text"
                    value={security.sso_client_id || ""}
                    onChange={(e) => setSecurity({ ...security, sso_client_id: e.target.value })}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] font-mono focus:outline-none focus:border-[var(--pill)]"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSavingSecurity}
              className="btn btn--ink text-xs font-semibold px-5 py-2 inline-flex items-center gap-1.5"
            >
              {isSavingSecurity ? <CircleNotch size={14} className="animate-spin" /> : <Check size={14} />}
              Save Security Configuration
            </button>
            {securitySuccess && (
              <span className="badge badge--pine text-xs font-semibold">Security configuration saved!</span>
            )}
          </div>
        </form>
      )}

      {/* TAB 3: BRANDING & LOCALIZATION */}
      {activeTab === "branding" && (
        <form onSubmit={handleSaveSettings} className="max-w-2xl space-y-6">
          <div className="rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] p-6 backdrop-blur-md space-y-4">
            <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <Palette size={18} className="text-[var(--tomato)]" /> White-Label Brand Presentation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Brand / Workspace Display Name
                </label>
                <input
                  type="text"
                  value={tenantSettings.brand_name || ""}
                  onChange={(e) => setTenantSettings({ ...tenantSettings, brand_name: e.target.value })}
                  placeholder="AlienMatrix CRM"
                  className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Logo Asset URL
                </label>
                <input
                  type="url"
                  value={tenantSettings.logo_url || ""}
                  onChange={(e) => setTenantSettings({ ...tenantSettings, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Primary Theme Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tenantSettings.primary_color_hex || "#2563eb"}
                    onChange={(e) =>
                      setTenantSettings({ ...tenantSettings, primary_color_hex: e.target.value })
                    }
                    className="h-8 w-12 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={tenantSettings.primary_color_hex || "#2563eb"}
                    onChange={(e) =>
                      setTenantSettings({ ...tenantSettings, primary_color_hex: e.target.value })
                    }
                    className="flex-1 rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tenantSettings.accent_color_hex || "#3b82f6"}
                    onChange={(e) =>
                      setTenantSettings({ ...tenantSettings, accent_color_hex: e.target.value })
                    }
                    className="h-8 w-12 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={tenantSettings.accent_color_hex || "#3b82f6"}
                    onChange={(e) =>
                      setTenantSettings({ ...tenantSettings, accent_color_hex: e.target.value })
                    }
                    className="flex-1 rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] p-6 backdrop-blur-md space-y-4">
            <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <Translate size={18} className="text-emerald-600 dark:text-emerald-400" /> Locale, Currency &amp; Timezone
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Default Workspace Language
              </label>
              <select
                value={tenantSettings.language || "en"}
                onChange={(e) => setTenantSettings({ ...tenantSettings, language: e.target.value as any })}
                className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)] font-medium"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} — {lang.nativeName} ({lang.dir.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Default Currency
                </label>
                <select
                  value={tenantSettings.currency || "USD"}
                  onChange={(e) => setTenantSettings({ ...tenantSettings, currency: e.target.value })}
                  className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                >
                  {SUPPORTED_CURRENCIES.map((cur) => (
                    <option key={cur.code} value={cur.code}>
                      {cur.code} ({cur.symbol}) - {cur.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Timezone
                </label>
                <select
                  value={tenantSettings.timezone || "UTC"}
                  onChange={(e) => setTenantSettings({ ...tenantSettings, timezone: e.target.value })}
                  className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="btn btn--ink text-xs font-semibold px-5 py-2 inline-flex items-center gap-1.5"
            >
              {isSavingSettings ? <CircleNotch size={14} className="animate-spin" /> : <Check size={14} />}
              Save Brand Preferences
            </button>
            {settingsSuccess && (
              <span className="badge badge--pine text-xs font-semibold">Preferences saved successfully!</span>
            )}
          </div>
        </form>
      )}

      {/* TAB 4: TRASH & BACKUP */}
      {activeTab === "trash" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)]">
                Recycle Bin &amp; Soft-Deleted Records
              </h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Soft-deleted entities can be restored to active state or permanently expunged.
              </p>
            </div>

            <a
              href="/api/v1/alien-matrix/export-all"
              download
              className="btn btn--ghost btn--sm text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <DownloadSimple size={15} />
              Export Organization Backup (JSON)
            </a>
          </div>

          <div className="rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--well)]/80 border-b border-[var(--line-2)] uppercase font-semibold text-[var(--muted)] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Record Identifier</th>
                  <th className="py-3 px-4">Deletion Timestamp</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line-2)]">
                {trash.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--well)]/50 transition-colors">
                    <td className="py-3.5 px-4 uppercase font-bold text-[10px] text-[var(--muted)]">
                      {item.entity_type}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[var(--text)]">
                      {item.entity_name}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--muted)]">
                      {new Date(item.deleted_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRestore(item.id)}
                        className="btn btn--ghost btn--sm text-xs font-semibold inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
                      >
                        <ArrowCounterClockwise size={13} /> Restore
                      </button>
                    </td>
                  </tr>
                ))}

                {trash.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-xs text-[var(--muted)]">
                      The recycle bin is empty. No deleted records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Role Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-[var(--r-card)] bg-[var(--solid)] border border-[var(--rim)] shadow-[var(--shadow-pop)] p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-[var(--line-2)]">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[var(--well)] border border-[var(--line-2)] flex items-center justify-center text-[var(--tomato)]">
                  <UsersThree size={16} weight="bold" />
                </span>
                <h3 className="text-sm font-bold text-[var(--text)]">
                  Create Custom RBAC Role
                </h3>
              </div>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--well)]"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Role Name *
                </label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => {
                    setNewRoleName(e.target.value);
                    if (!newRoleSlug) {
                      setNewRoleSlug(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                    }
                  }}
                  placeholder="e.g. Senior Commercial Broker"
                  className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Key Identifier (Slug) *
                </label>
                <input
                  type="text"
                  required
                  value={newRoleSlug}
                  onChange={(e) => setNewRoleSlug(e.target.value)}
                  placeholder="senior_commercial_broker"
                  className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] font-mono focus:outline-none focus:border-[var(--pill)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Granted deals and proposal permissions without delete authority..."
                  className="w-full rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--line-2)]">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="btn btn--ghost btn--sm text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingRole}
                  className="btn btn--ink btn--sm text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {isSavingRole ? <CircleNotch size={14} className="animate-spin" /> : <Check size={14} />}
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
} from "@phosphor-icons/react";
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
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-1">
        <button
          onClick={() => setActiveTab("roles")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "roles"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <UsersThree size={18} />
          Papéis & Permissões
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "security"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <LockKey size={18} />
          Segurança & SSO
        </button>

        <button
          onClick={() => setActiveTab("branding")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "branding"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <Palette size={18} />
          Marca & Idiomas
        </button>

        <button
          onClick={() => setActiveTab("trash")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "trash"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <Trash size={18} />
          Lixeira & Backup
        </button>
      </div>

      {/* TAB 1: ROLES & PERMISSIONS */}
      {activeTab === "roles" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Papéis Granulares e Controle de Acesso
              </h3>
              <p className="text-xs text-zinc-500">
                Defina papéis com permissões a nível de objeto e campo para a equipe.
              </p>
            </div>
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
            >
              <Plus size={15} weight="bold" />
              Novo Papel Customizado
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{r.name}</h4>
                    <span className="font-mono text-[11px] text-zinc-400">slug: {r.slug}</span>
                  </div>
                  {r.is_system && (
                    <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                      Sistema
                    </span>
                  )}
                </div>

                {r.description && <p className="text-xs text-zinc-500">{r.description}</p>}

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                    Permissões Ativas
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {r.permissions?.objects ? (
                      Object.entries(r.permissions.objects).map(([obj, perms]: [string, any]) => (
                        <span
                          key={obj}
                          className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 px-2 py-0.5 text-[11px] text-blue-700 dark:text-blue-300"
                        >
                          <strong>{obj}:</strong> {Array.isArray(perms) ? perms.join(", ") : perms}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-400">Acesso Total</span>
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
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Key size={18} className="text-blue-500" /> Autenticação & 2FA
            </h3>

            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
              <div>
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Exigir Autenticação em 2 Etapas (2FA / TOTP)
                </div>
                <div className="text-[11px] text-zinc-500">
                  Obriga todos os membros desta organização a usarem um app autenticador ao entrar.
                </div>
              </div>
              <input
                type="checkbox"
                checked={security.enforce_2fa}
                onChange={(e) => setSecurity({ ...security, enforce_2fa: e.target.checked })}
                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Tempo Limite de Sessão (minutos)
              </label>
              <input
                type="number"
                value={security.session_timeout_minutes}
                onChange={(e) =>
                  setSecurity({ ...security, session_timeout_minutes: parseInt(e.target.value, 10) || 1440 })
                }
                className="w-full sm:w-48 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Globe size={18} className="text-purple-500" /> Single Sign-On (SSO Corporativo)
            </h3>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Provedor de SSO
              </label>
              <select
                value={security.sso_provider}
                onChange={(e) => setSecurity({ ...security, sso_provider: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="none">Desativado (Apenas Email & Senha)</option>
                <option value="google">Google Workspace SSO</option>
                <option value="microsoft">Microsoft Azure AD / Entra ID</option>
                <option value="saml_oidc">SAML 2.0 / OpenID Connect Corporativo</option>
              </select>
            </div>

            {security.sso_provider !== "none" && (
              <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Domínio Corporativo Restrito
                  </label>
                  <input
                    type="text"
                    value={security.sso_domain || ""}
                    onChange={(e) => setSecurity({ ...security, sso_domain: e.target.value })}
                    placeholder="tenant.example.com"
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Client ID / App ID
                  </label>
                  <input
                    type="text"
                    value={security.sso_client_id || ""}
                    onChange={(e) => setSecurity({ ...security, sso_client_id: e.target.value })}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSavingSecurity}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
            >
              {isSavingSecurity ? <CircleNotch size={14} className="animate-spin" /> : <Check size={14} />}
              Save Security Settings
            </button>
            {securitySuccess && (
              <span className="text-xs text-emerald-600 font-semibold">Saved successfully!</span>
            )}
          </div>
        </form>
      )}

      {/* TAB 3: BRANDING & LOCALIZATION */}
      {activeTab === "branding" && (
        <form onSubmit={handleSaveSettings} className="max-w-2xl space-y-6">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Palette size={18} className="text-pink-500" /> Identidade Visual (White-Label)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome da Marca / Empresa
                </label>
                <input
                  type="text"
                  value={tenantSettings.brand_name || ""}
                  onChange={(e) => setTenantSettings({ ...tenantSettings, brand_name: e.target.value })}
                  placeholder="AlienMatrix CRM"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  URL do Logo
                </label>
                <input
                  type="url"
                  value={tenantSettings.logo_url || ""}
                  onChange={(e) => setTenantSettings({ ...tenantSettings, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Cor Primária
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
                    className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Cor de Destaque (Accent)
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
                    className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Translate size={18} className="text-emerald-500" /> Idioma, Moeda & Fuso Horário
            </h3>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Idioma Padrão do Sistema
              </label>
              <select
                value={tenantSettings.language || "en"}
                onChange={(e) => setTenantSettings({ ...tenantSettings, language: e.target.value as any })}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
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
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Moeda Padrão
                </label>
                <select
                  value={tenantSettings.currency || "USD"}
                  onChange={(e) => setTenantSettings({ ...tenantSettings, currency: e.target.value })}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {SUPPORTED_CURRENCIES.map((cur) => (
                    <option key={cur.code} value={cur.code}>
                      {cur.code} ({cur.symbol}) - {cur.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Fuso Horário
                </label>
                <select
                  value={tenantSettings.timezone || "UTC"}
                  onChange={(e) => setTenantSettings({ ...tenantSettings, timezone: e.target.value })}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
            >
              {isSavingSettings ? <CircleNotch size={14} className="animate-spin" /> : <Check size={14} />}
              Save Preferences
            </button>
            {settingsSuccess && (
              <span className="text-xs text-emerald-600 font-semibold">Preferências atualizadas!</span>
            )}
          </div>
        </form>
      )}

      {/* TAB 4: TRASH & BACKUP */}
      {activeTab === "trash" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Recycle Bin & Deleted Record Recovery
              </h3>
              <p className="text-xs text-zinc-500">
                Deleted items can be restored or permanently purged.
              </p>
            </div>

            <a
              href="/api/v1/alien-matrix/export-all"
              download
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm transition-colors"
            >
              <DownloadSimple size={15} />
              Baixar Backup Completo da Empresa (JSON)
            </a>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 uppercase font-semibold text-zinc-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Nome do Registro</th>
                  <th className="py-3 px-4">Data da Exclusão</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {trash.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="py-3.5 px-4 uppercase font-bold text-[10px] text-zinc-500">
                      {item.entity_type}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.entity_name}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500">
                      {new Date(item.deleted_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRestore(item.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 transition-colors"
                      >
                        <ArrowCounterClockwise size={13} /> Restaurar
                      </button>
                    </td>
                  </tr>
                ))}

                {trash.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-zinc-400">
                      The recycle bin is empty. No deleted items found.
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
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <UsersThree size={20} className="text-blue-500" />
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Criar Papel Customizado
                </h3>
              </div>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome do Papel *
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
                  placeholder="Ex: Corretor Sênior"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Identificador (Slug) *
                </label>
                <input
                  type="text"
                  required
                  value={newRoleSlug}
                  onChange={(e) => setNewRoleSlug(e.target.value)}
                  placeholder="corretor_senior"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Acesso a oportunidades e propostas, sem permissão de apagar..."
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingRole}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {isSavingRole ? <CircleNotch size={14} className="animate-spin" /> : <Check size={14} />}
                  Criar Papel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

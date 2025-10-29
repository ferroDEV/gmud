import LdapAuth from "ldapauth-fork";
import { config } from "../env";

export async function authWithAD(
  username: string,
  password: string
): Promise<{ ok: boolean; name?: string; role?: string; groups?: string[] }> {
  if (!config.ldap.host) {
    return { ok: false };
  }

  return new Promise((resolve) => {
    const ldap = new LdapAuth({
      url: `ldap://${config.ldap.host}:389`,
      bindDN: config.ldap.username,
      bindCredentials: config.ldap.password,
      searchBase: config.ldap.baseDn,
      searchFilter: `(sAMAccountName=${username})`,
      reconnect: true,
      timeout: (config.ldap.timeout || 5) * 1000,
      connectTimeout: (config.ldap.timeout || 5) * 1000,
      tlsOptions: { rejectUnauthorized: false },
    });

    ldap.on("error", (err: any) => {
      if (config.ldap.logging) console.error("LDAP error:", err);
    });

    ldap.authenticate(username, password, (err: any, user: any) => {
      try {
        ldap.close((_: any) => {});
      } catch {}
      if (err || !user) {
        if (config.ldap.logging) console.error("LDAP auth failed:", err);
        return resolve({ ok: false });
      }

      const name = user.displayName || user.cn || username;
      const memberOf: string[] = Array.isArray(user.memberOf)
        ? user.memberOf
        : user.memberOf
        ? [user.memberOf]
        : [];

      // Mapear role via LDAP_ROLE_MAP, se configurado
      let role = "SOLICITANTE";
      for (const map of config.ldap.roleMap) {
        if (memberOf.some((g) => String(g).includes(map.dn))) {
          role = map.role;
          break;
        }
      }

      if (config.ldap.logging) {
        console.log("LDAP OK:", { username, name, groups: memberOf });
      }

      resolve({ ok: true, name, role, groups: memberOf });
    });
  });
}

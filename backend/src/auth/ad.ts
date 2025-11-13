import ldap from "ldapjs";
import { config } from "../env";
import { signJWT } from "./jwt";

/**
 * Autentica usuário no Active Directory usando ldapjs,
 * buscando atributos e retornando status detalhado.
 */
export async function authWithAD(
  username: string,
  password: string
): Promise<{ ok: boolean; name?: string; email?: string; title?: string; error?: string }> {
  const ldapHost = config.ldap.host;
  const baseDN = config.ldap.baseDn;
  const domain = baseDN.replace(/DC=/gi, "").replace(/,/g, "."); // ex: esprobrasil.local
  const url = `ldap://${ldapHost}`;

  const bindDN = `${username}@${domain}`;

  const client = ldap.createClient({
    url,
    timeout: (config.ldap.timeout || 5) * 1000,
    reconnect: false,
  });

  return new Promise((resolve) => {
    client.bind(bindDN, password, (err: { message: any; }) => {
      if (err) {
        if (config.ldap.logging)
          console.error("❌ Falha na autenticação AD (bind):", err.message);
        client.unbind();
        return resolve({ ok: false, error: "invalid_credentials" });
      }

      // Busca atributos adicionais do usuário autenticado
      const searchOptions: ldap.SearchOptions = {
        scope: "sub",
        filter: `(sAMAccountName=${username})`,
        attributes: [
          "displayName",
          "mail",
          "title",
          "department",
          "sAMAccountName",
          "telephoneNumber",
          "memberOf"
        ],
      };

      client.search(baseDN, searchOptions, (searchErr, res) => {
        if (searchErr) {
          if (config.ldap.logging)
            console.error("❌ Erro na busca LDAP:", searchErr.message);
          client.unbind();
          return resolve({ ok: false, error: "ldap_search_error" });
        }

        let found = false;
        res.on("searchEntry", (entry) => {
          found = true;
          const attrs: Record<string, any> = {};
          for (const a of entry.attributes || []) {
            attrs[a.type] = Array.isArray(a.vals) ? a.vals[0] : a.vals;
          }
          const displayName =
            attrs.displayName || attrs.cn || username || "Usuário";
          const email = attrs.mail || "";
          const title = attrs.title || "";
          client.unbind();
          resolve({
            ok: true,
            name: displayName,
            email,
            title,
          });
        });

        res.on("error", (e) => {
          if (config.ldap.logging)
            console.error("❌ Erro no processamento LDAP:", e.message);
          client.unbind();
          resolve({ ok: false, error: "ldap_search_failed" });
        });

        res.on("end", () => {
          if (!found) {
            client.unbind();
            resolve({ ok: false, error: "user_not_found" });
          }
        });
      });
    });
  });
}

/**
 * Exemplo de uso interno (gera token JWT local se quiser).
 */
export async function authAndSignAD(username: string, password: string) {
  const result = await authWithAD(username, password);
  if (!result.ok) return result;
  const token = signJWT({
    uid: 0,
    username,
    role: "SOLICITANTE",
    name: result.name || username,
  });
  return { ...result, token };
}

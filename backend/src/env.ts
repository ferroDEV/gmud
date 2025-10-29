export const config = {
  jwtSecret: process.env.JWT_SECRET || "dev_secret",
  ldap: {
    logging: process.env.LDAP_LOGGING === "true",
    connection: process.env.LDAP_CONNECTION || "default",
    timeout: parseInt(process.env.LDAP_TIMEOUT || "5", 10),
    ssl: process.env.LDAP_SSL === "true",
    tls: process.env.LDAP_TLS === "true",
    host: process.env.LDAP_HOST || "",
    username: process.env.LDAP_USERNAME || "",
    password: process.env.LDAP_PASSWORD || "",
    baseDn: process.env.LDAP_BASE_DN || "",
    roleMap: (process.env.LDAP_ROLE_MAP || "")
      .split(";")
      .filter(Boolean)
      .map((pair) => {
        const [role, dn] = pair.split("=");
        return { role, dn };
      }),
  },
};

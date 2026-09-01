const db = supabase.createClient(
  J21_CONFIG.SUPABASE_URL,
  J21_CONFIG.SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// Disponibiliza o cliente para todos os scripts,
// incluindo o auth.js.
window.db = db;

window.J21 = {
  db,

  async user() {
    const result = await db.auth.getUser();

    if (result.error) {
      console.error("Erro ao obter utilizador:", result.error);
      return null;
    }

    return result.data.user || null;
  },

  async requireAuth() {
    const user = await this.user();

    if (!user) {
      window.location.href = "index.html";
      return null;
    }

    return user;
  },

  async player() {
    const user = await this.user();

    if (!user) {
      return null;
    }

    const result = await db
      .from("nexus_players")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    return result.data;
  },

  async rpc(name, args = {}) {
    const result = await db.rpc(name, args);

    if (result.error) {
      throw result.error;
    }

    return result.data;
  },

  esc(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char])
    );
  }
};

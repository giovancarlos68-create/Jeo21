const db=supabase.createClient(J21_CONFIG.SUPABASE_URL,J21_CONFIG.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
window.J21={db,
 async user(){return (await db.auth.getUser()).data.user||null},
 async requireAuth(){const u=await this.user();if(!u){location.href="index.html";return null}return u},
 async player(){const u=await this.user();if(!u)return null;const r=await db.from("nexus_players").select("*").eq("user_id",u.id).maybeSingle();if(r.error)throw r.error;return r.data},
 async rpc(name,args){const r=await db.rpc(name,args);if(r.error)throw r.error;return r.data},
 esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
};
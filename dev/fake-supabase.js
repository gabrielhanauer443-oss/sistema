// Imitação do supabase-js usada só nos testes locais (mesma interface que o site usa).
(function(){
  const post = (u, b) => fetch(u, {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify(b)}).then(r => r.json());
  const lerSessao = () => { try{ return JSON.parse(localStorage.getItem("fake-session")); }catch(e){ return null; } };
  const gravar = s => { try{ s ? localStorage.setItem("fake-session", JSON.stringify(s)) : localStorage.removeItem("fake-session"); }catch(e){} };
  function createClient(){
    const cbs = [];
    const token = () => { const s = lerSessao(); return s && s.access_token; };
    const avisar = (ev, s) => cbs.forEach(cb => { try{ cb(ev, s); }catch(e){} });
    const auth = {
      async getSession(){ return {data: {session: lerSessao()}, error: null}; },
      async signInWithPassword({email, password}){ const r = await post("/fake/auth", {action: "login", email, password}); if(!r.error){ gravar(r.data.session); avisar("SIGNED_IN", r.data.session); } return r; },
      async signUp({email, password, options}){ const r = await post("/fake/auth", {action: "signup", email, password, data: (options && options.data) || {}}); if(!r.error){ gravar(r.data.session); avisar("SIGNED_IN", r.data.session); } return r; },
      async signOut(){ gravar(null); avisar("SIGNED_OUT", null); return {error: null}; },
      onAuthStateChange(cb){ cbs.push(cb); return {data: {subscription: {unsubscribe(){}}}}; },
      async resetPasswordForEmail(){ return {data: {}, error: null}; },
      async updateUser(){ const s = lerSessao(); return {data: {user: s && s.user}, error: null}; }
    };
    function from(table){
      const st = {table, op: "select", filters: [], order: null, range: null, body: null, returning: false};
      const b = {
        select(){ if(st.op !== "select") st.returning = true; return b; },
        eq(c, v){ st.filters.push([c, v]); return b; },
        order(c, o){ st.order = [c, !o || o.ascending !== false]; return b; },
        range(a, z){ st.range = [a, z]; return b; },
        insert(body){ st.op = "insert"; st.body = body; return b; },
        update(body){ st.op = "update"; st.body = body; return b; },
        delete(){ st.op = "delete"; return b; },
        then(ok, fail){ return post("/fake/rest", {...st, token: token()}).then(ok, fail); }
      };
      return b;
    }
    const rpc = (fn, args) => ({ then(ok, fail){ return post("/fake/rpc", {fn, args, token: token()}).then(ok, fail); } });
    return {auth, from, rpc};
  }
  window.supabase = {createClient};
})();

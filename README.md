# Jeo21

Versão com novo visual e integração Supabase.

Backend confirmado no projeto:
- `nexus_players`
- `nexus_player_settings`
- `j21_world_identity`
- `j21_leaderboard_snapshots`
- RPCs reais usadas pelo frontend:
  - `j21_get_difficulty(uuid, smallint)`
  - `j21_next_question(uuid, smallint, smallint)`
  - `j21_start_session(uuid, smallint, text)`
  - `nexus_record_answer(uuid, smallint, boolean, integer, text)`
  - `j21_update_difficulty(uuid, smallint, boolean)`
  - `j21_get_dashboard(uuid)`
  - `nexus_generate_mission(uuid)`
  - `j21_get_daily_challenge(uuid)`

IMPORTANTE:
A função `j21_next_question` devolve a pergunta e opções, mas a definição verificada não devolve `correct_index`.
Portanto o frontend NÃO inventa uma resposta correta. Para o jogo ficar 100% jogável, o backend precisa expor/validar a resposta através de uma função própria. O pacote mantém o backend como autoridade e não coloca uma chave secreta/service_role no navegador.

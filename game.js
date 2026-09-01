let world = Number(new URLSearchParams(location.search).get("world") || 1);
let questionData = null;
let questionNo = 0;
let startTime = 0;

const $ = (s) => document.querySelector(s);

async function loadQuestion() {
  next.classList.add("hidden");
  answers.innerHTML = "";
  result.textContent = "";
  source.textContent = "";

  try {
    const u = await J21.user();
    if (!u) return;

    const d = await J21.rpc("j21_get_difficulty", {
      p_user_id: u.id,
      p_world_id: world
    });

    const difficulty = Number(
      d?.difficulty ??
      d?.preferred_difficulty ??
      3
    );

    const r = await J21.rpc("j21_next_question", {
      p_user_id: u.id,
      p_world_id: world,
      p_difficulty: difficulty
    });

    questionData = r;
    questionNo++;
    startTime = performance.now();

    worldNo.textContent =
      `MUNDO ${String(world).padStart(2, "0")} / 21`;

    qNo.textContent = `PERGUNTA ${questionNo}`;

    diff.textContent =
      `DIF. ${r?.difficulty ?? difficulty}`;

    bar.style.width =
      `${((questionNo - 1) % 10 + 1) * 10}%`;

    question.textContent =
      r?.question || "Pergunta indisponível";

    source.textContent =
      r?.source_note || r?.image_alt || "";

    const opts = Array.isArray(r?.options)
      ? r.options
      : [];

    opts.forEach((o, i) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "answer";

      button.textContent =
        typeof o === "string"
          ? o
          : (
              o?.text ??
              o?.label ??
              o?.value ??
              `Opção ${i + 1}`
            );

      button.onclick = () => answer(i, button);

      answers.appendChild(button);
    });

  } catch (e) {
    question.textContent = e.message;
  }
}


async function answer(index, button) {

  document
    .querySelectorAll(".answer")
    .forEach(b => b.disabled = true);

  try {

    const u = await J21.user();

    /*
      IMPORTANTE:
      A resposta correta NÃO é descoberta
      no navegador.

      O backend recebe o índice escolhido,
      consulta correct_index na tabela
      j21_questions e determina se está certo.
    */

    const r = await J21.rpc("j21_submit_answer", {

      p_user_id: u.id,

      p_world_id: world,

      p_question_id: questionData.id,

      p_selected_index: index,

      p_time_ms:
        Math.max(
          100,
          Math.round(performance.now() - startTime)
        )
    });


    button.classList.add(
      r.correct
        ? "correct"
        : "wrong"
    );


    result.textContent =
      `${r.correct ? "✓ Correto" : "✕ Incorreto"} · ` +
      `+${r.xp_gained ?? 0} XP · ` +
      `nível ${r.level ?? "—"}`;


    if (r.explanation) {
      result.title = r.explanation;
    }


    await J21.rpc(
      "j21_update_difficulty",
      {
        p_user_id: u.id,
        p_world_id: world,
        p_correct: !!r.correct
      }
    );


    next.classList.remove("hidden");


  } catch (e) {

    result.textContent = e.message;

    document
      .querySelectorAll(".answer")
      .forEach(b => b.disabled = false);
  }
}


next.onclick = loadQuestion;


(async () => {

  const u = await J21.requireAuth();

  if (!u) return;

  try {

    await J21.rpc(
      "j21_start_session",
      {
        p_user_id: u.id,
        p_world_id: world,
        p_mode: "classic"
      }
    );

    await loadQuestion();

  } catch (e) {

    question.textContent = e.message;

  }

})();
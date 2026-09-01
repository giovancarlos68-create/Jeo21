const params = new URLSearchParams(location.search);
const world = Number(params.get("world") || 1);

let questionData = null;
let questionNo = 0;
let startTime = 0;
let answering = false;

const $ = (selector) => document.querySelector(selector);

const next = $("#next");
const answers = $("#answers");
const result = $("#result");
const source = $("#source");
const question = $("#question");
const worldNo = $("#worldNo");
const qNo = $("#qNo");
const diff = $("#diff");
const bar = $("#bar");

function setMessage(text) {
  if (result) result.textContent = text || "";
}

function setLoading(loading) {
  if (next) next.disabled = loading;
}

function resetQuestionUI() {
  if (next) next.classList.add("hidden");

  if (answers) answers.innerHTML = "";

  if (result) {
    result.textContent = "";
    result.removeAttribute("title");
  }

  if (source) source.textContent = "";
}

function isAlreadyProcessed(error) {
  return String(error?.message || "")
    .toLowerCase()
    .includes("question already processed");
}

async function loadQuestion() {
  if (answering) return;

  resetQuestionUI();
  setLoading(true);

  try {
    const user = await J21.requireAuth();

    if (!user) return;

    const difficultyData = await J21.rpc(
      "j21_get_difficulty",
      {
        p_user_id: user.id,
        p_world_id: world
      }
    );

    const difficulty = Number(
      difficultyData?.difficulty ??
      difficultyData?.preferred_difficulty ??
      3
    );

    const questionResult = await J21.rpc(
      "j21_next_question",
      {
        p_user_id: user.id,
        p_world_id: world,
        p_difficulty: difficulty
      }
    );

    if (!questionResult?.id) {
      throw new Error(
        "Não foi possível carregar a pergunta."
      );
    }

    questionData = questionResult;
    questionNo += 1;
    startTime = performance.now();

    if (worldNo) {
      worldNo.textContent =
        `MUNDO ${String(world).padStart(2, "0")} / 21`;
    }

    if (qNo) {
      qNo.textContent =
        `PERGUNTA ${questionNo}`;
    }

    if (diff) {
      diff.textContent =
        `DIF. ${questionResult.difficulty ?? difficulty}`;
    }

    if (bar) {
      const progress =
        ((questionNo - 1) % 10 + 1) * 10;

      bar.style.width = `${progress}%`;
    }

    if (question) {
      question.textContent =
        questionResult.question ||
        "Pergunta indisponível.";
    }

    if (source) {
      source.textContent =
        questionResult.source_note ||
        questionResult.image_alt ||
        "";
    }

    const options = Array.isArray(
      questionResult.options
    )
      ? questionResult.options
      : [];

    if (!options.length) {
      throw new Error(
        "Esta pergunta não possui opções."
      );
    }

    options.forEach((option, index) => {
      const button =
        document.createElement("button");

      button.type = "button";
      button.className = "answer";

      if (typeof option === "string") {
        button.textContent = option;
      } else {
        button.textContent =
          option?.text ??
          option?.label ??
          option?.value ??
          `Opção ${index + 1}`;
      }

      button.addEventListener(
        "click",
        () => submitAnswer(index)
      );

      answers.appendChild(button);
    });

  } catch (error) {
    console.error(
      "Erro ao carregar pergunta:",
      error
    );

    setMessage(
      error?.message ||
      "Não foi possível carregar a pergunta."
    );

  } finally {
    setLoading(false);
  }
}

async function submitAnswer(selectedIndex) {
  if (
    answering ||
    !questionData?.id
  ) {
    return;
  }

  answering = true;

  const buttons =
    document.querySelectorAll(".answer");

  buttons.forEach(
    (button) => {
      button.disabled = true;
    }
  );

  try {
    const user = await J21.user();

    if (!user) {
      throw new Error(
        "A sessão terminou. Entra novamente."
      );
    }

    const timeMs = Math.max(
      100,
      Math.round(
        performance.now() - startTime
      )
    );

    const response = await J21.rpc(
      "j21_submit_answer",
      {
        p_user_id: user.id,
        p_world_id: world,
        p_question_id: questionData.id,
        p_selected_index: selectedIndex,
        p_time_ms: timeMs
      }
    );

    const correct =
      response?.correct === true;

    buttons.forEach(
      (button, index) => {
        if (index === selectedIndex) {
          button.classList.add(
            correct
              ? "correct"
              : "wrong"
          );
        }
      }
    );

    setMessage(
      `${correct ? "✓ Correto" : "✕ Incorreto"} · ` +
      `+${response?.xp_gained ?? 0} XP · ` +
      `nível ${response?.level ?? "—"}`
    );

    if (
      response?.explanation &&
      result
    ) {
      result.title =
        response.explanation;
    }

    /*
      A resposta já foi validada e registada
      pelo backend.

      A dificuldade é atualizada separadamente.
      Se essa atualização falhar, não anulamos
      a resposta que já foi registada.
    */

    try {
      await J21.rpc(
        "j21_update_difficulty",
        {
          p_user_id: user.id,
          p_world_id: world,
          p_correct: correct
        }
      );
    } catch (difficultyError) {
      console.warn(
        "Falha ao atualizar dificuldade:",
        difficultyError
      );
    }

    questionData = null;

    if (next) {
      next.classList.remove("hidden");
    }

  } catch (error) {
    console.error(
      "Erro ao responder:",
      error
    );

    /*
      Se o servidor disser que a pergunta
      já foi processada, NÃO tentamos enviá-la
      novamente.

      Apenas descartamos a pergunta atual
      e carregamos outra.
    */

    if (isAlreadyProcessed(error)) {
      questionData = null;

      setMessage(
        "Resposta já registada. A carregar a próxima pergunta…"
      );

      answering = false;

      await loadQuestion();

      return;
    }

    setMessage(
      error?.message ||
      "Não foi possível registar a resposta."
    );

    buttons.forEach(
      (button) => {
        button.disabled = false;
      }
    );

  } finally {
    answering = false;
  }
}

if (next) {
  next.addEventListener(
    "click",
    loadQuestion
  );
}

(async function startGame() {

  try {
    const user =
      await J21.requireAuth();

    if (!user) return;

    if (
      !Number.isInteger(world) ||
      world < 1 ||
      world > 21
    ) {
      throw new Error(
        "Mundo inválido. Escolhe um mundo entre 1 e 21."
      );
    }

    await J21.rpc(
      "j21_start_session",
      {
        p_user_id: user.id,
        p_world_id: world,
        p_mode: "classic"
      }
    );

    await loadQuestion();

  } catch (error) {
    console.error(
      "Erro ao iniciar jogo:",
      error
    );

    setMessage(
      error?.message ||
      "Não foi possível iniciar o jogo."
    );
  }

})();

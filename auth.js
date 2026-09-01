let authMode = "login";

const $ = (selector) => document.querySelector(selector);

function renderMode() {
  const loginButton = $("#loginMode");
  const signupButton = $("#signupMode");
  const title = $("#authTitle");
  const submitButton = $("#submit");
  const confirmationBox = $("#confirmationBox");

  if (loginButton) {
    loginButton.classList.toggle("active", authMode === "login");
  }

  if (signupButton) {
    signupButton.classList.toggle("active", authMode === "signup");
  }

  if (title) {
    title.textContent =
      authMode === "login" ? "Entrar" : "Criar conta";
  }

  if (submitButton) {
    submitButton.textContent =
      authMode === "login" ? "Entrar" : "Criar conta";
  }

  // A confirmação por email está desativada no Supabase.
  // Portanto, nunca mostramos o painel antigo de confirmação.
  if (confirmationBox) {
    confirmationBox.classList.add("hidden");
  }
}

const loginMode = $("#loginMode");
const signupMode = $("#signupMode");
const authForm = $("#auth");
const emailInput = $("#email");
const passwordInput = $("#password");
const submitButton = $("#submit");
const message = $("#msg");

if (loginMode) {
  loginMode.onclick = () => {
    authMode = "login";
    renderMode();

    if (message) {
      message.textContent = "";
    }
  };
}

if (signupMode) {
  signupMode.onclick = () => {
    authMode = "signup";
    renderMode();

    if (message) {
      message.textContent = "";
    }
  };
}

if (authForm) {
  authForm.onsubmit = async (event) => {
    event.preventDefault();

    if (!window.db) {
      if (message) {
        message.textContent =
          "Erro: ligação ao Supabase não encontrada.";
      }
      return;
    }

    const userEmail = emailInput
      ? emailInput.value.trim()
      : "";

    const userPassword = passwordInput
      ? passwordInput.value
      : "";

    if (!userEmail || !userPassword) {
      if (message) {
        message.textContent =
          "Preenche o email e a palavra-passe.";
      }
      return;
    }

    if (message) {
      message.textContent = "A processar…";
    }

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      // =========================
      // LOGIN
      // =========================

      if (authMode === "login") {
        const result = await db.auth.signInWithPassword({
          email: userEmail,
          password: userPassword
        });

        if (result.error) {
          throw result.error;
        }

        if (message) {
          message.textContent =
            "Login efetuado. A entrar…";
        }

        window.location.href = "mundos.html";
        return;
      }

      // =========================
      // CRIAR CONTA
      // =========================

      const result = await db.auth.signUp({
        email: userEmail,
        password: userPassword
      });

      if (result.error) {
        throw result.error;
      }

      /*
        Com "Confirm email" desligado no Supabase,
        o signup deve devolver uma sessão.

        Se houver sessão, o utilizador entra
        imediatamente sem precisar confirmar email.
      */

      if (result.data && result.data.session) {
        if (message) {
          message.textContent =
            "Conta criada. A entrar…";
        }

        window.location.href = "mundos.html";
        return;
      }

      /*
        Se não houver sessão, NÃO mostramos mensagem
        a dizer para confirmar email.

        Isso significa que existe alguma configuração
        do Supabase/Auth que ainda está a impedir
        o login automático.
      */

      if (message) {
        message.textContent =
          "A conta foi criada, mas o Supabase não devolveu uma sessão. " +
          "Verifica se 'Confirm email' está realmente desligado no J24.";
      }

    } catch (error) {
      console.error("Erro de autenticação:", error);

      if (message) {
        message.textContent =
          error?.message ||
          "Ocorreu um erro ao autenticar.";
      }

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  };
}

// Esconde qualquer botão antigo de confirmação,
// caso ainda exista no index.html.
const resendConfirmation = $("#resendConfirm");

if (resendConfirmation) {
  resendConfirmation.classList.add("hidden");
}

// Estado inicial
renderMode();

let authMode = "login";

const $ = s => document.querySelector(s);

function renderMode() {
  loginMode.classList.toggle("active", authMode === "login");
  signupMode.classList.toggle("active", authMode === "signup");
  authTitle.textContent = authMode === "login" ? "Entrar" : "Criar conta";
  submit.textContent = authMode === "login" ? "Entrar" : "Criar conta";

  const resend = document.getElementById("resendConfirm");
  if (resend) resend.classList.toggle("hidden", authMode !== "signup");
}

loginMode.onclick = () => {
  authMode = "login";
  renderMode();
};

signupMode.onclick = () => {
  authMode = "signup";
  renderMode();
};

auth.onsubmit = async e => {
  e.preventDefault();
  msg.textContent = "A processar…";

  try {
    if (authMode === "login") {
      const r = await db.auth.signInWithPassword({
        email: email.value.trim(),
        password: password.value
      });

      if (r.error) throw r.error;

      location.href = "mundos.html";
      return;
    }

    const r = await db.auth.signUp({
      email: email.value.trim(),
      password: password.value,
      options: {
        emailRedirectTo: "https://giovancarlos68-create.github.io/Jeo21/mundos.html"
      }
    });

    if (r.error) throw r.error;

    if (!r.data.session) {
      msg.textContent =
        "Conta criada. Verifica o teu email para confirmar a conta. " +
        "Se não chegar, verifica o Spam e usa o botão de reenviar.";
      return;
    }

    location.href = "mundos.html";

  } catch (e) {
    msg.textContent = e.message;
  }
};

async function resendConfirmation() {
  const mail = email.value.trim();

  if (!mail) {
    msg.textContent = "Introduz primeiro o teu email.";
    return;
  }

  msg.textContent = "A reenviar confirmação…";

  try {
    const r = await db.auth.resend({
      type: "signup",
      email: mail,
      options: {
        emailRedirectTo:
          "https://giovancarlos68-create.github.io/Jeo21/mundos.html"
      }
    });

    if (r.error) throw r.error;

    msg.textContent =
      "Email de confirmação reenviado. Verifica também o Spam.";
  } catch (e) {
    msg.textContent = e.message;
  }
}

const resendBtn = document.getElementById("resendConfirm");

if (resendBtn) {
  resendBtn.onclick = resendConfirmation;
}

renderMode();

<!DOCTYPE HTML>
<html lang="en">
<head>
    <title>${title}</title>
    <link rel="shortcut icon" href="/public/favicon.ico"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <!-- inject:css -->
    <!-- endinject -->
    <style type="text/css">
    
        .dropdown {
        position: relative;
        display: inline-block;
        }
        
        .dropdown-content {
        display: none;
        position: absolute;
        background-color: white;
        border: 1px solid #CFD8DC;
        min-width: 160px;
        z-index: 1;
        }

        .dropdown-content a {
        color: #e31837;
        padding: 12px 16px;
        text-decoration: none;
        display: block;
        }

        .dropdown-content a:hover {background-color: #ddd}

        .show {display:block;}
    </style>
    <script>
        const translations = {
            dropbtn: {
                en: "EN",
                fr: "FR",
                pt: "PT"
            },
            username: {
                en: "Username (email address)",
                fr: "Nom d'utilisateur (adresse e-mail)",
                pt: "Nome de utilizador (endereço de email)"
            },
            password: {
                en: "Password",
                fr: "Mot de passe",
                pt: "Palavra-passe"
            },
            forgottenPassword: {
                en: "Forgotten your password?",
                fr: "Vous avez oublié votre mot de passe ?",
                pt: "Esqueceu-se da sua palavra-passe?"
            },
            logIn: {
                en: "Log In",
                fr: "Ouvrir une session",
                pt: "Iniciar Sessão"
            },
            noAccount: {
                en: "Don't have an account?",
                fr: "Vous n'avez pas de compte ?",
                pt: "Não tem uma conta?"
            },
            requestAccount: {
                en: "Request an account",
                fr: "Demander un compte",
                pt: "Solicite uma conta"
            },
            or: {
                en: "OR",
                fr: "OU",
                pt: "OU"
            },
            continueGuest: {
                en: "Continue as guest",
                fr: "Continuer en tant qu'invité",
                pt: "Continuar como convidado"
            },
        }
        let language = window.localStorage.getItem("language") || "en"

        function translateAll(){
            for (const [key, value] of Object.entries(translations)) {
                document.getElementById(key).innerHTML = value[language]
            }
        }
        
        function toggleDropdown() {
            document.getElementById("dropdownOptions").classList.toggle("show");
        }

        function selectLanguage(choice){
            language = choice
            localStorage.setItem("language", choice);
            translateAll()
            toggleDropdown()
        }

        function validate(event) {
            const userIdInput = document.getElementById("user-id");
            userIdInput.value = userIdInput.value.trim();

            const form = document.getElementById("login-form");
            if (!form.checkValidity()) {
                event.preventDefault();
                form.classList.add('was-validated');
            }
        }

        function continueAsGuest() {
            sessionStorage.setItem("asGuest", "continueAsGuest")
        }

        window.onclick = function(event) {
            if (!event.target.matches('.dropbtn')) {
                var dropdowns = document.getElementsByClassName("dropdown-content");
                var i;
                for (i = 0; i < dropdowns.length; i++) {
                    var openDropdown = dropdowns[i];
                    if (openDropdown.classList.contains('show')) {
                        openDropdown.classList.remove('show');
                    }
                }
            }
        }

        document.addEventListener("DOMContentLoaded", function(event) { 
            translateAll()
        });
    </script>
</head>
<body>
    <div class="d-flex flex-row-reverse">
        <div class="dropdown">
            <button onclick="toggleDropdown()" id="dropbtn" class="dropbtn btn btn-outline-secondary dropdown-toggle">EN</button>
            <div id="dropdownOptions" class="dropdown-content" style="right:0;">
                <a onclick="selectLanguage('en')" href="#">EN</a>
                <a onclick="selectLanguage('fr')" href="#">FR</a>
                <a onclick="selectLanguage('pt')" href="#">PT</a>
            </div>
        </div>
    </div>
    <a href="https://www.unaids.org"><img src="public/images/unaids_logo.png" class="large-logo mx-auto mt-5 mb-4"/></a>
    <h1 class="text-center"><strong>${appTitle}</strong></h1>
    <div id="app" class="card login-form mx-auto mt-3">
        <div class="card-body">
            <form id="login-form" method="post" action="/callback" class="needs-validation" novalidate onsubmit="validate(event);">
                <div class="form-group">
                    <label for="user-id" id="username">Username (email address)</label>
                    <input type="text" size="20" class="form-control" name="username" id="user-id" value="${username}" required>
                    <div id="userid-feedback" class="invalid-feedback">Please enter your username.</div>
                </div>
                <div class="form-group">
                    <label for="pw-id" id="password">Password</label>
                    <input type="password" size="20" class="form-control" name="password" id="pw-id" required>
                    <div id="pw-feedback" class="invalid-feedback">Please enter your password.</div>
                    <div id="forgot-password">
                        <a href="/password/forgot-password/" id="forgottenPassword">Forgotten your password?</a>
                    </div>
                </div>
                <div class="text-center mt-2">
                    <button class="btn btn-red" id="logIn" type="submit">Log In</button>
                </div>
            </form>
            <#if error != "">
                <div id="error" class="alert alert-danger mt-3">${error}</div>
            </#if>
            <div id="register-an-account" class="text-center mt-4">
                <div id="noAccount">Don't have an account?</div>
                <a href="https://forms.office.com/r/7S9EMigGr4" target="_blank" id="requestAccount">Request an account</a>
            </div>
        </div>
    </div>
    <div id="continue-as-guest" class="text-center mt-3">
        <div class="mb-3" id="or">OR</div>
        <a class="btn btn-red" onclick="continueAsGuest()" type="submit" href="${continueTo}" id="continueGuest">Continue as guest</a>
    </div>
    <div id="partner-logos" class="logos mx-auto mt-5">
      <a href="https://www.fjelltopp.org"><img src="public/images/fjelltopp_logo.png" class="small-logo"></a>
      <a href="https://www.imperial.ac.uk"><img src="public/images/imperial_logo.png" class="small-logo"></a>
      <a href="https://github.com/reside-ic"><img src="public/images/reside_logo.png" class="small-logo"></a>
      <a href="https://www.avenirhealth.org"><img src="public/images/avenir_logo.png" class="small-logo"></a>
      <a href="https://www.washington.edu"><img src="public/images/uw_logo.png" class="small-logo"></a>
    </div>
</body>
</html>

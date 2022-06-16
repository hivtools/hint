<!DOCTYPE HTML>
<html lang="en">
<head>
    <title>${title}</title>
    <link rel="shortcut icon" href="/public/favicon.ico"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <!-- inject:css -->
    <!-- endinject -->
    <style type="text/css">

        .topright {
        position: absolute;
        top: 0px;
        right: 0px;
        }
        /* Dropdown Button */
        <#--  .dropbtn {
        background-color: #3498DB;
        color: white;
        padding: 16px;
        font-size: 16px;
        border: none;
        cursor: pointer;
        }  -->

        /* Dropdown button on hover & focus */
        <#--  .dropbtn:hover, .dropbtn:focus {
        background-color: #2980B9;
        }  -->

        /* The container <div> - needed to position the dropdown content */
        .dropdown {
        position: relative;
        display: inline-block;
        }

        /* Dropdown Content (Hidden by Default) */
        .dropdown-content {
        display: none;
        position: absolute;
        background-color: #f1f1f1;
        min-width: 160px;
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
        z-index: 1;
        }

        /* Links inside the dropdown */
        .dropdown-content a {
        color: black;
        padding: 12px 16px;
        text-decoration: none;
        display: block;
        }

        /* Change color of dropdown links on hover */
        .dropdown-content a:hover {background-color: #ddd}

        /* Show the dropdown menu (use JS to add this class to the .dropdown-content container when the user clicks on the dropdown button) */
        .show {display:block;}
    </style>
    <script>
        let language = window.localStorage.getItem("language") || "en"

        document.addEventListener("DOMContentLoaded", function(event) { 
            document.getElementsByClassName('dropbtn')[0].innerHTML = language.toUpperCase();
        });
        /* When the user clicks on the button,
        toggle between hiding and showing the dropdown content */
        function toggleDropdown() {
            document.getElementById("dropdownOptions").classList.toggle("show");
        }

        // Close the dropdown menu if the user clicks outside of it
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

        function selectLanguage(choice){
            language = choice
            document.getElementsByClassName('dropbtn')[0].innerHTML = choice.toUpperCase();
            localStorage.setItem("language", choice);
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
    </script>
</head>
<body>
    <#--  <drop-down :text="currentLanguage" :right="true" style="flex: none">
        <a class="dropdown-item" href="#" v-on:mousedown="() => changeLanguage('en')">
            EN
        </a>
        <a class="dropdown-item" href="#" v-on:mousedown="() => changeLanguage('fr')">
            FR
        </a>
        <a class="dropdown-item" href="#" v-on:mousedown="() => changeLanguage('pt')">
            PT
        </a>
    </drop-down>  -->
    <#--  <div class="dropdown">
        <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            Dropdown button
        </button>
        <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
            <a class="dropdown-item" href="#">EN</a>
            <a class="dropdown-item" href="#">FR</a>
            <a class="dropdown-item" href="#">PT</a>
        </div>
    </div>  -->
    <#--  <div class="dropdown-menu">
        <a class="dropdown-item" href="#">EN</a>
        <a class="dropdown-item active" href="#">FR</a>
        <a class="dropdown-item" href="#">PT</a>
    </div>  -->
    <#--  <div class="dropdown" style="float:right;">
        <button class="dropbtn">Right</button>
        <div class="dropdown-content">
            <a href="#">Link 1</a>
            <a href="#">Link 2</a>
            <a href="#">Link 3</a>
        </div>
    </div>  -->
    <#--  <div class="dropdown" style="float:right;">
        <button class="btn btn-secondary dropdown-toggle" id="dropdownBtn">Right</button>
            <div class="dropdown-menu" style="display:block">
                <a class="dropdown-item" href="#">Link 1</a>
                <a class="dropdown-item" href="#">Link 2</a>
                <a class="dropdown-item" href="#">Link 3</a>
            </div>
    </div>  -->
    <div class="d-flex flex-row-reverse">
        <div class="dropdown">
            <button onclick="toggleDropdown()" class="dropbtn btn btn-outline-secondary dropdown-toggle">EN</button>
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
                    <label for="user-id">Username (email address)</label>
                    <input type="text" size="20" class="form-control" name="username" id="user-id" value="${username}" required>
                    <div id="userid-feedback" class="invalid-feedback">Please enter your username.</div>
                </div>
                <div class="form-group">
                    <label for="pw-id">Password</label>
                    <input type="password" size="20" class="form-control" name="password" id="pw-id" required>
                    <div id="pw-feedback" class="invalid-feedback">Please enter your password.</div>
                    <div id="forgot-password">
                        <a href="/password/forgot-password/">Forgotten your password?</a>
                    </div>
                </div>
                <div class="text-center mt-2">
                    <input class="btn btn-red" type="submit" value="Log In">
                </div>
            </form>
            <#if error != "">
                <div id="error" class="alert alert-danger mt-3">${error}</div>
            </#if>
            <div id="register-an-account" class="text-center mt-4">
                Don't have an account? <br><a href="https://forms.office.com/r/7S9EMigGr4" target="_blank">Request an account</a>
            </div>
        </div>
    </div>
    <div id="continue-as-guest" class="text-center mt-3">
        <div class="mb-3">OR</div>
        <a class="btn btn-red" onclick="continueAsGuest()" type="submit" href="${continueTo}">Continue as guest</a>
    </div>
    <div>
        <#--  <button>English</button>
        <button>Français</button>
        <button>Português</button>  -->

        <#--  <input type="radio" class="btn-check" name="options-outlined" id="english-outlined" autocomplete="off" checked>
        <label class="btn btn-outline-primary" for="english-outlined">English</label>

        <input type="radio" class="btn-check" name="options-outlined" id="french-outlined" autocomplete="off">
        <label class="btn btn-outline-primary" for="french-outlined">Français</label>  -->

        <#--  <div class="btn-group">
            <input type="radio" class="btn-check" name="options" id="option1" autocomplete="off" checked />
            <label class="btn btn-secondary" for="option1">English</label>

            <input type="radio" class="btn-check" name="options" id="option2" autocomplete="off" />
            <label class="btn btn-secondary" for="option2">Français</label>

            <input type="radio" class="btn-check" name="options" id="option3" autocomplete="off" />
            <label class="btn btn-secondary" for="option3">Português</label>
        </div>  -->
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

<!DOCTYPE HTML>
<html>
<head>
    <title>${title}: Login</title>
    <link rel="shortcut icon" href="/public/favicon.ico"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <!-- inject:css -->
    <!-- endinject -->
    <script>
        function validate(event) {
            const userIdInput = document.getElementById("user-id");
            userIdInput.value = userIdInput.value.trim();

            const form = document.getElementById("login-form");
            if (form.checkValidity()) {
                localStorage.clear();
            } else {
                event.preventDefault();
                form.classList.add('was-validated');
            }
        }
    </script>
</head>
<body>
<div id="app">
    <logged-out-header title="${title}"></logged-out-header>
    <a href="https://www.unaids.org"><img src="public/images/unaids_logo.png" class="large-logo mx-auto mt-5"/></a>
    <div class="card login-form mx-auto mt-3">
        <div class="card-body">
            <form id="login-form" method="post" action="/callback" class="needs-validation" novalidate
                  onsubmit="validate(event);">
                <div class="form-group">
                    <label for="user-id" v-translate="'username'">Username</label>
                    <input type="text" size="20" class="form-control" name="username" id="user-id" value="${username}"
                           required>
                    <div id="userid-feedback" class="invalid-feedback" v-translate="'enterUsername'">Please enter your
                        username.
                    </div>
                </div>
                <div class="form-group">
                    <label for="pw-id" v-translate="'password'">Password</label>
                    <input type="password" size="20" class="form-control" name="password" id="pw-id" required>
                    <div id="pw-feedback" class="invalid-feedback" v-translate="'enterPassword'">Please enter your
                        password.
                    </div>
                </div>
                <div class="text-center">
                    <input class="btn btn-red" type="submit" v-translate:value="'logIn'" value="Log in">
                </div>
            </form>
            <#if error != "">
                <div id="error" class="alert alert-danger mt-3">${error}</div>
            </#if>
            <div id="forgot-password" class="mt-3" v-translate="'forgottenPasswordClickHere'">
                Forgotten your password? <a href="/password/forgot-password/">Click here</a>
            </div>
        </div>
    </div>
    <div id="partner-logos" class="logos mx-auto mt-5">
        <a href="https://www.fjelltopp.org"><img src="public/images/fjelltopp_logo.png" class="small-logo"></a>
        <a href="https://www.imperial.ac.uk"><img src="public/images/imperial_logo.png" class="small-logo"></a>
        <a href="https://github.com/reside-ic"><img src="public/images/reside_logo.png" class="small-logo"></a>
        <a href="https://www.avenirhealth.org"><img src="public/images/avenir_logo.png" class="small-logo"></a>
        <a href="https://www.washington.edu"><img src="public/images/uw_logo.png" class="small-logo"></a>
    </div>
</div>
</body>
</html>
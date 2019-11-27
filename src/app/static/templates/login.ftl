<!DOCTYPE HTML>
<html>
<head>
    <title>${title}</title>
    <link rel="shortcut icon" href="/public/favicon.ico"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <!-- inject:css -->
    <!-- endinject -->
    <script>
        function validate(event) {
            const form = document.getElementById("login-form");
            if (!form.checkValidity()) {
                event.preventDefault();
                form.classList.add('was-validated');
            }
        }
        localStorage.clear();
    </script>
</head>
<body>
    <div id="app" class="card login-form mx-auto mt-5">
        <div class="card-body">
            <form id="login-form" method="post" action="/callback" class="needs-validation" novalidate onsubmit="validate(event);">
                <div class="form-group">
                    <label for="user-id">Username</label>
                    <input type="text" size="20" class="form-control" name="username" id="user-id" value="${username}" required>
                    <div id="userid-feedback" class="invalid-feedback">Please enter your username.</div>
                </div>
                <div class="form-group">
                    <label for="pw-id">Password</label>
                    <input type="password" size="20" class="form-control" name="password" id="pw-id" required>
                    <div id="pw-feedback" class="invalid-feedback">Please enter your password.</div>
                </div>
                <div class="text-center">
                    <input class="btn btn-red" type="submit" value="Log In">
                </div>
            </form>
            <#if error != "">
                <div id="error" class="alert alert-danger mt-3">${error}</div>
            </#if>
            <div id="forgot-password" class="mt-3">
                Forgotten your password? <a href="/password/forgot-password/">Click here</a>
            </div>
        </div>
    </div>
</body>
</html>
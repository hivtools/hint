<!DOCTYPE HTML>
<html>
<head>
    <title>${title}</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <link rel="stylesheet" href="css/style.css"/>
</head>
<body>
    <div id="app" class="card login-form mx-auto mt-5">
        <div class="card-body">
            <form method="post" action="/callback">
                <div class="form-group">
                    <label for="user-id">Username</label>
                    <input type="text" size="20" class="form-control" name="username" id="user-id" value="${username}">
                </div>
                <div class="form-group">
                    <label for="pw-id">Password</label>
                    <input type="password" size="20" class="form-control" name="password" id="pw-id">
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
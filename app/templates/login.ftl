<!DOCTYPE HTML>
<html>
<head>
    <title>${title}</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <link rel="stylesheet" href="css/style.css"/>
</head>
<body>
    <div id="app">
        <h1>Login</h1>
        <form method="post" action="/callback">
            <input type="text" size="20" maxlength="256" name="username" id="user-id" value="${username}">
            <input type="password" size="20" maxlength="256" name="password" id="pw-id">
           <input type="submit" value="Log In">
        </form>
        <div>${error}</div>
    </div>
</body>
</html>
<!DOCTYPE HTML>
<html lang="en">
<head>
    <title>${title}</title>
    <link rel="shortcut icon" href="/public/favicon.ico"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <!-- inject:css -->
    <!-- endinject -->
    <script>
    var host = window.location.hostname;
    if(host != "localhost")
    {
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-JPYDD02750"></script>
        <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-JPYDD02750');
        </script>
    }
    </script>
</head>
<body>
<div id="app" :class="language">
    <data-exploration-header title="${title}" user="${user}"></data-exploration-header>
    <div class="container mb-5">
        <router-view></router-view>
    </div>
    <errors title="${title}"></errors>
</div>
<script>
    var currentUser = "${user}"
</script>
</body>
</html>

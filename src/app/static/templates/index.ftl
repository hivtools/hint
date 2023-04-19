<!DOCTYPE HTML>
<html lang="en">
<head>
    <title>${title}</title>
    <link rel="shortcut icon" href="/public/favicon.ico"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <!-- inject:css -->
    <link href="/public/css/app.css" rel="stylesheet">
    <#--  <link href="/public/css/leaflet.css" rel="stylesheet">  -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css"
    integrity="sha256-kLaT2GOSpHechhsozzB+flnD+zUyjE2LlfWPgU04xyI="
    crossorigin=""/>
    <#--  <link href="/public/css/bootstrap.css" rel="stylesheet">  -->
    <!-- endinject -->
    <script defer src="/public/js/app.js"></script>
    <script defer src="/public/js/93.chunk.js"></script>
    <script defer src="/public/js/431.chunk.js"></script>
    <script defer src="/public/js/633.chunk.js"></script>
    <script defer src="/public/js/858.chunk.js"></script>
</head>
<body>
<div id="app" :class="language">
    <user-header title="${title}" user="${user}"></user-header>
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

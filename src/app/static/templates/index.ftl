<!DOCTYPE HTML>
<html lang="en">
<head>
    <title>${title}</title>
    <link rel="shortcut icon" href="/public/favicon.ico"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <!-- inject:css -->
    <link href="/public/css/app.css" rel="stylesheet">
    <#--  <link href="/public/css/leaflet.css" rel="stylesheet">  -->
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
    <hint title="${title}" user="${user}"></hint>
</div>
<script>
    var currentUser = "${user}"
</script>
</body>
</html>

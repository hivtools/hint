<!DOCTYPE HTML>
<html lang="en">
<head>
    <title>${title}</title>
    <link rel="shortcut icon" href="/public/favicon.ico"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <#if hotReload == "true">
        <script defer type="module" src="http://localhost:5173/src/index.ts"></script>
    <#else>
        <script defer type="module" src="./public/hint.js"></script>
        <link href="./public/hint.css" rel="stylesheet">
    </#if>
</head>
<body>
<div id="app" :class="language"></div>
<script>
    var currentUser = "${user}"
    var titleGlobal = "${title}"
</script>
</body>
</html>

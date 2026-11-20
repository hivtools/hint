<!DOCTYPE HTML>
<html lang="en">
<head>
    <title>${title}</title>
    <link rel="shortcut icon" href="/public/favicon.ico"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <#-- The front-end build writes vite-assets.ftl. It has the script and CSS tags for the current build
         (see vite.config.ts). The dev server (npm run dev) replaces the part between the two markers. -->
    <!-- vite-assets -->
    <#include "vite-assets.ftl" parse=false ignore_missing=true>
    <!-- /vite-assets -->
</head>
<body>
<div id="app" :class="language" data-user="${user}" data-title="${title}"></div>
<script>
    var currentUser = "${user}"
</script>
</body>
</html>

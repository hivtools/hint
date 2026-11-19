<!DOCTYPE HTML>
<html lang="en">
<head>
    <title>${title}</title>
    <link rel="shortcut icon" href="/public/favicon.ico"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <#-- The front-end build writes vite-assets.ftl. It has the script and CSS tags for the current build
         (see vite.config.mts). The dev server (npm run dev) replaces the part between the two markers. -->
    <!-- vite-assets -->
    <#include "vite-assets.ftl" parse=false ignore_missing=true>
    <!-- /vite-assets -->
    <#-- Must match the katex version in package.json/package-lock.json. An unpinned URL serves the latest
         CSS, which does not match the markup produced by the locked katex JS and breaks equation layout -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
</head>
<body>
<div id="app" :class="language" data-user="${user}" data-title="${title}"></div>
<script>
    var currentUser = "${user}"
</script>
</body>
</html>

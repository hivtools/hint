<!DOCTYPE HTML>
<html lang="en">
<head>
    <title>${title}: Forgot password</title>
    <link rel="shortcut icon" href="/public/favicon.ico"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <#-- The script and CSS tags for the current build. See index.ftl. -->
    <!-- vite-assets -->
    <#include "vite-assets.ftl" parse=false ignore_missing=true>
    <!-- /vite-assets -->
</head>
<body>
<div id="forgotPasswordApp" :class="language" data-title="${title}"></div>
</body>
</html>
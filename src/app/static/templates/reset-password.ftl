<!DOCTYPE HTML>
<html>
<head>
    <title>${title}: Reset your password</title>
    <link rel="shortcut icon" href="/public/favicon.ico"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <#-- The script and CSS tags for the current build. See index.ftl. -->
    <!-- vite-assets -->
    <#include "vite-assets.ftl" parse=false ignore_missing=true>
    <!-- /vite-assets -->
</head>
<body>
<div id="resetPasswordApp" :class="language" data-token="${token}" data-title="${title}"></div>
</body>
</html>
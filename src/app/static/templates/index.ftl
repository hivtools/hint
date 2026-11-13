<!DOCTYPE HTML>
<html lang="en">
<head>
    <title>${title}</title>
    <link rel="shortcut icon" href="/public/favicon.ico"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <!-- inject:css -->
    <link href="/public/css/app.css" rel="stylesheet">
    <#-- Must match the katex version in package.json/package-lock.json. An unpinned URL serves the latest
         CSS, which does not match the markup produced by the locked katex JS and breaks equation layout -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
    <!-- endinject -->
    <script defer src="/public/js/app.js"></script>
    <script defer src="/public/js/node_modules_leaflet_dist_images_marker-icon_png.chunk.js"></script>
    <script defer src="/public/js/node_modules_leaflet_dist_images_marker-icon-2x_png.chunk.js"></script>
    <script defer src="/public/js/node_modules_leaflet_dist_images_marker-shadow_png.chunk.js"></script>
    <script defer src="/public/js/node_modules_leaflet_dist_leaflet-src_esm_js.chunk.js"></script>
</head>
<body>
<div id="app" :class="language" data-user="${user}" data-title="${title}"></div>
<script>
    var currentUser = "${user}"
</script>
</body>
</html>

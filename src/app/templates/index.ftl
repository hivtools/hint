<!DOCTYPE HTML>
<html>
<head>
    <title>${title}</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <link rel="stylesheet" href="/public/css/style.css"/>
    <link rel="stylesheet" href="//unpkg.com/leaflet/dist/leaflet.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@riophae/vue-treeselect@^0.3.0/dist/vue-treeselect.min.css">
    <style>
        /*.leaflet-container {*/
        /*    background-color:rgba(255,0,0,0.0);*/
        /*    border: 1px solid #adb5bd;*/
        /*}*/
        .map-control {
            border: 1px solid #adb5bd;
            background: white;
        }
        .legend i {
            width: 18px;
            height: 18px;
            float: left;
            margin-right: 8px;
        }
    </style>
</head>
<body>
<header class="mb-5">
    <nav class="navbar navbar-dark bg-secondary">
        <div class="container-fluid">
            <div class="navbar-header text-light">
                ${title}
            </div>
            <div class="logout">
                <a href="/logout">Logout</a>
            </div>
        </div>
    </nav>
</header>
<div id="app">
</div>
<script src="/public/js/app.js"></script>
</body>
</html>

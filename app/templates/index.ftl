<!DOCTYPE HTML>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <title>${title}</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <link rel="stylesheet" href="css/style.css"/>
</head>
<body>
<div id="app">
    <header>
        <nav class="navbar navbar-dark bg-secondary">
            <div class="container-fluid">
                <div class="navbar-header text-light">
                    ${title}
                    <#include "partials/logout_link.ftl">
                </div>
            </div>
        </nav>
    </header>
    <div class="container-fluid">
        <div class="row">
            <div class="col-2">
                <ul class="mt-3 sidebar list-unstyled nav flex-column" role="tablist">
                    <li class="nav-item">
                        <a class="nav-link active" data-toggle="tab" href="#inputs" role="tab">Input parameters</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-toggle="tab" href="#run" role="tab">Run model</a>
                    </li>
                </ul>
            </div>
            <div class="col-10 pt-3">
                <div class="tab-content">
                    <div class="tab-pane active" role="tabpanel" id="inputs">
                        <#include "partials/inputs.ftl">
                    </div>
                    <div class="tab-pane" role="tabpanel" id="run">
                        <#include "partials/run.ftl">
                </div>
            </div>
        </div>
    </div>
</div>
<script src="js/index.bundle.js"></script>
</body>
</html>

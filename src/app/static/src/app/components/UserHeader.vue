<template>
    <header class="mb-5">
        <nav class="navbar navbar-dark bg-secondary">
            <div class="container-fluid">
                <div class="navbar-header text-light">
                    {{title}}
                </div>
                <div class="logout">
                    <a href="/logout">Logout</a>
                </div>
            </div>
        </nav>
    </header>
</template>
<script lang="ts">

    import Vue from "vue";

    export default Vue.extend({
        props: ["title"],
        created: void {
            //console.log(this.title)
        }
    })
</script>
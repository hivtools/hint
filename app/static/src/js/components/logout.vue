<template>
    <div class="logout">
        <a v-on:click="logout" href="#">Logout</a>
    </div>
</template>

<script>
    import axios from "axios";

    export default {
        name: 'logout',
        methods: {
            logout: function () {
                //"logout" of basic auth by clearing Authorization header and
                //getting from logout endpoint to clear session
                axios.get(`/logout`, {headers: {Authorization: "Basic"}})
                    .then((result) => {
                        alert("expected an error");
                    })
                    .catch(() => {
                        //We expect a 401 Unauthorized
                        window.location = "/";
                    });
            }
        }
    };
</script>
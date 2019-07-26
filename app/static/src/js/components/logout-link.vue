<template>
    <span class="logout" v-on:click="logout">Logout</span>
</template>

<script>
    import axios from "axios";

    export default {
        name: 'logout-link',
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
import Vue from "vue";
import Baseline from "./components/Baseline.vue";
import {store} from "./main"

let v = new Vue({
    el: "#app",
    template: `
    <div>
        <baseline></baseline>
    </div>`,
    store,
    components: {
        Baseline
    }
});

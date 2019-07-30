import Vue from "vue";
import {store} from "./main"
import Stepper from "./components/Stepper.vue";

let v = new Vue({
    el: "#app",
    template: `<stepper></stepper>`,
    store,
    components: {
        Stepper
    }
});

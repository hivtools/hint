import Vue from "vue";
import {store} from "./main"
import Stepper from "./components/Stepper.vue";
import {mapActions} from "vuex";

let v = new Vue({
    el: "#app",
    template: `<stepper></stepper>`,
    store,
    components: {
        Stepper
    },
    methods: {
        ...mapActions({loadBaseline: 'baseline/getBaselineData'})
    },
    beforeMount: function() {
        this.loadBaseline()
    }
});

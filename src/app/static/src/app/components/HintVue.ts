import Vue from "vue";
import {Store} from "vuex";
import {RootState} from "../root";

export class HintVue extends Vue {
    $store!: Store<RootState>;
}

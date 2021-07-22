import {shallowMount} from "@vue/test-utils";
import SelectRelease from "../../../app/components/adr/SelectRelease.vue";
import Vuex from "vuex";

describe("select release", () => {
    
    const getStore = () => {
        const store = new Vuex.Store({});
        return store;
    }

    it("renders select release", () => {
        const rendered = shallowMount(SelectRelease, {store: getStore()});
        expect(rendered.find("#selectRelease").exists()).toBe(true);
    });
});
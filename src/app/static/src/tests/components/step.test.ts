import {shallowMount} from '@vue/test-utils';
import Vuex from "vuex";
import Vue from 'vue';
import Step from "../../app/components/Step.vue";
import {emptyState} from "../../app/root";
import registerTranslations from "../../app/store/translations/registerTranslations";
import {expectTranslated} from "../testHelpers";

describe("Step component", () => {

    const store = new Vuex.Store({state: emptyState()});
    registerTranslations(store);

    it("renders step", () => {
        const wrapper = shallowMount(Step, {
            store,
            props: {
                textKey: "uploadInputs"
            }
        });

        expectTranslated(wrapper.findComponent("div"),
            "Upload inputs",
            "Télécharger les entrées",
            "Carregar entradas", store);
    });

    it("renders enabled step", () => {
        const wrapper = shallowMount(Step, {
            props: {
                textKey: "uploadInputs",
                enabled: true
            }
        });

        expect(wrapper.classes()).toStrictEqual(["col", "step", "enabled"]);
    });

    it("renders active step", () => {
        const wrapper = shallowMount(Step, {
            props: {
                textKey: "uploadInputs",
                active: true,
                enabled: true
            }
        });

        expect(wrapper.classes()).toStrictEqual(["col", "step", "active", "enabled"]);
        expect(wrapper.findComponent("button").classes()).toStrictEqual(["btn", "btn-white"]);
    });

    it("renders inactive step", () => {
        const wrapper = shallowMount(Step, {
            props: {
                textKey: "uploadInputs",
                active: false
            }
        });

        expect(wrapper.classes()).toStrictEqual(["col", "step"]);
        expect(wrapper.findComponent("button").classes()).toStrictEqual(["btn"]);
    });

    it("renders enabled step", () => {
        const wrapper = shallowMount(Step, {
            props: {
                textKey: "uploadInputs",
                enabled: true,
                number: 2
            }
        });

        expect(wrapper.classes()).toStrictEqual(["col", "step", "enabled"]);
        expect(wrapper.findComponent("button").classes()).toStrictEqual(["btn", "btn-white"]);
        expect(wrapper.findComponent("button").attributes().disabled).toBeUndefined();
        wrapper.findComponent("button").trigger("click");
        Vue.nextTick();

        expect(wrapper.emitted("jump")![0][0]).toBe(2);
    });

    it("renders complete step", () => {
        const wrapper = shallowMount(Step, {
            props: {
                textKey: "uploadInputs",
                enabled: true,
                complete: true
            }
        });

        expect(wrapper.classes()).toStrictEqual(["col", "step", "complete", "enabled"]);
        expect(wrapper.findComponent("button").classes()).toStrictEqual(["btn", "btn-red"]);
    });

    it("renders disabled step", () => {
        const wrapper = shallowMount(Step, {
            props: {
                textKey: "uploadInputs",
                enabled: false
            }
        });
        expect(wrapper.findComponent("button").attributes().disabled).toBeDefined();
        wrapper.findComponent("button").trigger("click");

        Vue.nextTick();
        expect(wrapper.emitted().jump).toBeUndefined();
    });

});

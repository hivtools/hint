import {shallowMount} from "@vue/test-utils";
import ResetConfirmation from "../../app/components/ResetConfirmation.vue";
import Vuex from "vuex";
import Vue from "vue";

Vue.use(Vuex);

const createStore = (mockGetters: any) => new Vuex.Store({
    modules: {
        stepper: {
            namespaced: true,
            getters: mockGetters
        }
    }
});

describe("Reset confirmation modal", () => {


    it("can deal with no later complete steps", () => {
        // even though in practice it should never be opened with no steps to be reset
        const mockGetters = {
            laterCompleteSteps: () => []
        };
        const rendered = shallowMount(ResetConfirmation, {store: createStore(mockGetters)});
        expect(rendered.find("p").text())
            .toContain("Changing this will result in no steps being reset.");
    });

    it("returns single later complete step", () => {
        const mockGetters = {
            laterCompleteSteps: () => [{number: 2, text: "Upload survey and programme data"}]
        };
        const rendered = shallowMount(ResetConfirmation, {store: createStore(mockGetters)});
        expect(rendered.find("p").text())
            .toContain("Changing this will result in step 2 (Upload survey and programme data) being reset.");
    });

    it("returns multiple later complete steps", () => {
        const mockGetters = {
            laterCompleteSteps: () => [{number: 2, text: "Upload survey and programme data"},
                {number: 3, text: "Model options"},
                {number: 4, text: "Run model"}]
        };
        const rendered = shallowMount(ResetConfirmation, {store: createStore(mockGetters)});
        expect(rendered.find("p").text())
            .toContain("Changing this will result in steps 2 (Upload survey and programme data), 3 (Model options), and 4 (Run model)");
    });

});

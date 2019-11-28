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

    it("returns later complete steps", () => {
        const mockGetters = {
            laterCompleteSteps: () => [{number: 2, text: "Upload survey and programme data"},
                {number: 3, text: "Model options"},
                {number: 4, text: "Run model"}]
        };
        const rendered = shallowMount(ResetConfirmation, {store: createStore(mockGetters)});
        expect(rendered.find("p").text())
            .toContain("Changing this will result in the following steps being discarded:");
        const steps = rendered.findAll("li");
        expect(steps.length).toBe(3);
        expect(steps.at(0).text()).toBe("Step 2: Upload survey and programme data");
        expect(steps.at(1).text()).toBe("Step 3: Model options");
        expect(steps.at(2).text()).toBe("Step 4: Run model");

    });

});

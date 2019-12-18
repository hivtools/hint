import {mount, shallowMount} from "@vue/test-utils";
import ResetConfirmation from "../../app/components/ResetConfirmation.vue";
import Vuex from "vuex";
import registerTranslations from "../../app/store/translations/registerTranslations";
import {emptyState} from "../../app/root";

const createStore = (mockGetters: any) => {
    const store = new Vuex.Store({
        state: emptyState(),
        modules: {
            stepper: {
                namespaced: true,
                getters: mockGetters
            }
        }
    });
    registerTranslations(store);
    return store;
};

describe("Reset confirmation modal", () => {

    it("returns later complete steps", () => {
        const mockGetters = {
            laterCompleteSteps: () => [{number: 2, textKey: "uploadSurvey"},
                {number: 3, textKey: "modelOptions"},
                {number: 4, textKey: "runModel"}]
        };
        const rendered = mount(ResetConfirmation, {store: createStore(mockGetters)});

        expect(rendered.find("h4").text()).toBe("Have you saved your work?");
        expect(rendered.find("p").text())
            .toContain("Changing this will result in the following steps being discarded:");
        expect(rendered.findAll("p").at(1).text()).toBe("You may want to save your work before continuing.");

        const steps = rendered.findAll("li");
        expect(steps.length).toBe(3);
        expect(steps.at(0).text()).toBe("Step 2: Upload survey and programme data");
        expect(steps.at(1).text()).toBe("Step 3: Model options");
        expect(steps.at(2).text()).toBe("Step 4: Run model");

        const buttons = rendered.findAll("button");
        expect(buttons.at(0).text()).toBe("Discard these steps and keep editing");
        expect(buttons.at(1).text()).toBe("Cancel editing so I can save my work");

    });

});

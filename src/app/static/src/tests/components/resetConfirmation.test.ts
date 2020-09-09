import Vue from "vue";
import {mount, shallowMount, Wrapper} from "@vue/test-utils";
import ResetConfirmation from "../../app/components/ResetConfirmation.vue";
import LoadingSpinner from "../../app/components/LoadingSpinner.vue";
import Vuex from "vuex";
import registerTranslations from "../../app/store/translations/registerTranslations";
import {emptyState, storeOptions, RootState} from "../../app/root";
import {mockErrorsState, mockProjectsState, mockRootState} from "../mocks";
import {mutations as versionsMutations} from "../../app/store/projects/mutations";
import {mutations as errorMutations} from "../../app/store/errors/mutations";
import { getters } from "../../app/store/root/getters";

const createStore = (newVersion = jest.fn(), partialRootState: Partial<RootState> = {}) => {
    const store = new Vuex.Store({
        state: mockRootState(partialRootState),
        getters: getters,
        modules: {
            stepper: {
                namespaced: true,
                getters: {
                    laterCompleteSteps: () => [{number: 2, textKey: "uploadSurvey"},
                        {number: 3, textKey: "modelOptions"},
                        {number: 4, textKey: "runModel"}]
                }
            },
            errors: {
                namespaced: true,
                state: mockErrorsState(),
                mutations: errorMutations
            },
            projects: {
                namespaced: true,
                state: mockProjectsState({currentProject: {id: 1, name: "v1", versions: []}}),
                actions: {
                    newVersion
                },
                mutations: versionsMutations
            }
        }
    });
    registerTranslations(store);
    return store;
};

declare let currentUser: string;

describe("Reset confirmation modal", () => {

    it("renders as expected for guest user", () => {
        const rendered = mount(ResetConfirmation, {
            propsData: {
                continueEditing: jest.fn(),
                cancelEditing: jest.fn()
            },
            store: createStore(jest.fn(), {currentUser: 'guest'})
        });

        expect(rendered.find("h4").text()).toBe("Have you saved your work?");
        expect(rendered.find("p").text())
            .toContain("Changing this will result in the following steps being discarded:");
        expect(rendered.findAll("p").at(1).text()).toBe("You may want to save your work before continuing.");

        expectRenderedSteps(rendered);

        const buttons = rendered.findAll("button");
        expect(buttons.at(0).text()).toBe("Discard these steps and keep editing");
        expect(buttons.at(1).text()).toBe("Cancel editing so I can save my work");

        expect(rendered.find(LoadingSpinner).exists()).toBe(false);
    });

    it("renders as expected for logged in user", () => {
        currentUser = "test.user@example.com";
        const rendered = mount(ResetConfirmation, {
            propsData: {
                continueEditing: jest.fn(),
                cancelEditing: jest.fn()
            },
            store: createStore()
        });

        expect(rendered.find("h4").text()).toBe("Save version?");
        expect(rendered.find("p").text())
            .toContain("Changing this will result in the following steps being discarded:");
        expect(rendered.findAll("p").at(1).text())
            .toBe("These steps will automatically be saved in a version. You will be able to reload this version from the Projects page.");

        expectRenderedSteps(rendered);

        const buttons = rendered.findAll("button");
        expect(buttons.at(0).text()).toBe("Save version and keep editing");
        expect(buttons.at(1).text()).toBe("Cancel editing");

        expect(rendered.find(LoadingSpinner).exists()).toBe(false);
    });

    it("cancel edit button invokes cancelEditing", () => {
        currentUser = "test.user@example.com";
        const mockCancelEdit = jest.fn();
        const rendered = mount(ResetConfirmation, {
            propsData: {
                continueEditing: jest.fn(),
                cancelEditing: mockCancelEdit
            },
            store: createStore()
        });

        rendered.findAll("button").at(1).trigger("click");
        expect(mockCancelEdit.mock.calls.length).toBe(1);
    });

    it("continue button invokes continueEditing for guest user", () => {
        currentUser = "guest";
        const mockContinueEdit = jest.fn();
        const rendered = mount(ResetConfirmation, {
            propsData: {
                continueEditing: mockContinueEdit,
                cancelEditing: jest.fn()
            },
            store: createStore()
        });

        rendered.findAll("button").at(0).trigger("click");
        expect(mockContinueEdit.mock.calls.length).toBe(1);
    });

    it("continue button sets waitingForVersion to true and invokes newVersion action for logged in user", () => {
        currentUser = "test.user@example.com";

        const mockContinueEdit = jest.fn();
        const mockNewVersion = jest.fn();
        const rendered = mount(ResetConfirmation, {
            propsData: {
                continueEditing: mockContinueEdit,
                cancelEditing: jest.fn()
            },
            store: createStore(mockNewVersion)
        });

        expect((rendered.vm as any).waitingForVersion).toBe(false);

        rendered.findAll("button").at(0).trigger("click");

        expect(mockContinueEdit.mock.calls.length).toBe(0);
        expect((rendered.vm as any).waitingForVersion).toBe(true);
        expect(mockNewVersion.mock.calls.length).toBe(1);
    });

    it("when currentVersion changes, sets waitingForVersion to false and invokes continue editing, if waitingForVersion is true",  async () => {
        const mockContinueEditing = jest.fn();
        const rendered = mount(ResetConfirmation, {
            data() {
                return {
                    waitingForVersion: true
                };
            },
            propsData: {
                continueEditing: mockContinueEditing,
                cancelEditing: jest.fn()
            },
            store: createStore()
        });

        rendered.vm.$store.commit("projects/VersionCreated", {id: "newVersionId"});
        await Vue.nextTick();

        expect((rendered.vm as any).waitingForVersion).toBe(false);
        expect(mockContinueEditing.mock.calls.length).toBe(1);
    });

    it("when error added, sets waitingForVersion to false and invokes cancel editing, if waitingForVersion is true", async () => {
        const mockCancelEditing = jest.fn();
        const rendered = mount(ResetConfirmation, {
            data() {
                return {
                    waitingForVersion: true
                };
            },
            propsData: {
                continueEditing: jest.fn(),
                cancelEditing: mockCancelEditing
            },
            store: createStore()
        });

        rendered.vm.$store.commit("errors/ErrorAdded", "TEST ERROR");
        await Vue.nextTick();

        expect((rendered.vm as any).waitingForVersion).toBe(false);
        expect(mockCancelEditing.mock.calls.length).toBe(1);
    });

    it("when currentVersion changes, does nothing if waitingForVersion is false", async () => {
        const mockContinueEditing = jest.fn();
        const rendered = mount(ResetConfirmation, {
            propsData: {
                continueEditing: mockContinueEditing,
                cancelEditing: jest.fn()
            },
            store: createStore()
        });

        rendered.vm.$store.commit("projects/VersionCreated", {id: "newVersionId"});
        await Vue.nextTick();

        expect((rendered.vm as any).waitingForVersion).toBe(false);
        expect(mockContinueEditing.mock.calls.length).toBe(0);
    });

    it("when errorAdded, does nothing if waitingForVersion is false", async () => {
        const mockCancelEditing = jest.fn();
        const rendered = mount(ResetConfirmation, {
            propsData: {
                continueEditing: jest.fn(),
                cancelEditing: mockCancelEditing
            },
            store: createStore()
        });

        rendered.vm.$store.commit("errors/ErrorAdded", "TEST ERROR");
        await Vue.nextTick();

        expect((rendered.vm as any).waitingForVersion).toBe(false);
        expect(mockCancelEditing.mock.calls.length).toBe(0);
    });

    it("renders spinner in place of buttons when waiting for version", () => {
        currentUser = "test.user@example.com";
        const rendered = mount(ResetConfirmation, {
            data() {
                return {
                    waitingForVersion: true
                };
            },
            propsData: {
                continueEditing: jest.fn(),
                cancelEditing: jest.fn()
            },
            store: createStore()
        });

        expect(rendered.find("button").exists()).toBe(false);
        expect(rendered.find(LoadingSpinner).props("size")).toBe("sm");
        expect(rendered.find("#spinner-text").text()).toBe("Saving version");
    });

    const expectRenderedSteps = (rendered: Wrapper<any>) => {
        const steps = rendered.findAll("li");
        expect(steps.length).toBe(3);
        expect(steps.at(0).text()).toBe("Step 2: Upload survey and programme data");
        expect(steps.at(1).text()).toBe("Step 3: Model options");
        expect(steps.at(2).text()).toBe("Step 4: Run model");
    };

});

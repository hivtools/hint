import Vue from "vue";
import {mount, shallowMount, Wrapper} from "@vue/test-utils";
import ResetConfirmation from "../../app/components/ResetConfirmation.vue";
import LoadingSpinner from "../../app/components/LoadingSpinner.vue";
import Vuex from "vuex";
import registerTranslations from "../../app/store/translations/registerTranslations";
import {emptyState} from "../../app/root";
import {mockErrorsState, mockVersionsState} from "../mocks";
import {mutations as versionsMutations} from "../../app/store/projects/mutations";
import {mutations as errorMutations} from "../../app/store/errors/mutations";

const createStore = (newSnapshot = jest.fn()) => {
    const store = new Vuex.Store({
        state: emptyState(),
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
            versions: {
                namespaced: true,
                state: mockVersionsState({currentVersion: {id: 1, name: "v1", snapshots: []}}),
                actions: {
                    newSnapshot
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
        currentUser = "guest";
        const rendered = mount(ResetConfirmation, {
            propsData: {
                continueEditing: jest.fn(),
                cancelEditing: jest.fn()
            },
            store: createStore()
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

        expect(rendered.find("h4").text()).toBe("Save snapshot?");
        expect(rendered.find("p").text())
            .toContain("Changing this will result in the following steps being discarded:");
        expect(rendered.findAll("p").at(1).text())
            .toBe("These steps will automatically be saved in a snapshot. You will be able to reload this snapshot from the Versions page.");

        expectRenderedSteps(rendered);

        const buttons = rendered.findAll("button");
        expect(buttons.at(0).text()).toBe("Save snapshot and keep editing");
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

    it("continue button sets waitingForSnapshot to true and invokes newSnapshot action for logged in user", () => {
        currentUser = "test.user@example.com";

        const mockContinueEdit = jest.fn();
        const mockNewSnapshot = jest.fn();
        const rendered = mount(ResetConfirmation, {
            propsData: {
                continueEditing: mockContinueEdit,
                cancelEditing: jest.fn()
            },
            store: createStore(mockNewSnapshot)
        });

        expect((rendered.vm as any).waitingForSnapshot).toBe(false);

        rendered.findAll("button").at(0).trigger("click");

        expect(mockContinueEdit.mock.calls.length).toBe(0);
        expect((rendered.vm as any).waitingForSnapshot).toBe(true);
        expect(mockNewSnapshot.mock.calls.length).toBe(1);
    });

    it("when currentSnapshot changes, sets waitingForSnapshot to false and invokes continue editing, if waitingForSnapshot is true",  async () => {
        const mockContinueEditing = jest.fn();
        const rendered = mount(ResetConfirmation, {
            data() {
                return {
                    waitingForSnapshot: true
                };
            },
            propsData: {
                continueEditing: mockContinueEditing,
                cancelEditing: jest.fn()
            },
            store: createStore()
        });

        rendered.vm.$store.commit("versions/SnapshotCreated", {id: "newSnapshotId"});
        await Vue.nextTick();

        expect((rendered.vm as any).waitingForSnapshot).toBe(false);
        expect(mockContinueEditing.mock.calls.length).toBe(1);
    });

    it("when error added, sets waitingForSnapshot to false and invokes cancel editing, if waitingForSnapshot is true", async () => {
        const mockCancelEditing = jest.fn();
        const rendered = mount(ResetConfirmation, {
            data() {
                return {
                    waitingForSnapshot: true
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

        expect((rendered.vm as any).waitingForSnapshot).toBe(false);
        expect(mockCancelEditing.mock.calls.length).toBe(1);
    });

    it("when currentSnapshot changes, does nothing if waitingForSnapshot is false", async () => {
        const mockContinueEditing = jest.fn();
        const rendered = mount(ResetConfirmation, {
            propsData: {
                continueEditing: mockContinueEditing,
                cancelEditing: jest.fn()
            },
            store: createStore()
        });

        rendered.vm.$store.commit("versions/SnapshotCreated", {id: "newSnapshotId"});
        await Vue.nextTick();

        expect((rendered.vm as any).waitingForSnapshot).toBe(false);
        expect(mockContinueEditing.mock.calls.length).toBe(0);
    });

    it("when errorAdded, does nothing if waitingForSnapshot is false", async () => {
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

        expect((rendered.vm as any).waitingForSnapshot).toBe(false);
        expect(mockCancelEditing.mock.calls.length).toBe(0);
    });

    it("renders spinner in place of buttons when waiting for snapshot", () => {
        currentUser = "test.user@example.com";
        const rendered = mount(ResetConfirmation, {
            data() {
                return {
                    waitingForSnapshot: true
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
        expect(rendered.find("#spinner-text").text()).toBe("Saving snapshot");
    });

    const expectRenderedSteps = (rendered: Wrapper<any>) => {
        const steps = rendered.findAll("li");
        expect(steps.length).toBe(3);
        expect(steps.at(0).text()).toBe("Step 2: Upload survey and programme data");
        expect(steps.at(1).text()).toBe("Step 3: Model options");
        expect(steps.at(2).text()).toBe("Step 4: Run model");
    };

});

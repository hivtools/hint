import Vue from "vue";
import {mount, Wrapper} from "@vue/test-utils";
import ResetConfirmation from "../../app/components/resetConfirmation/ResetConfirmation.vue";
import LoadingSpinner from "../../app/components/LoadingSpinner.vue";
import Vuex from "vuex";
import registerTranslations from "../../app/store/translations/registerTranslations";
import {RootState} from "../../app/root";
import {mockErrorsState, mockProjectsState, mockRootState} from "../mocks";
import {mutations as versionsMutations} from "../../app/store/projects/mutations";
import {mutations as errorMutations} from "../../app/store/errors/mutations";
import {getters} from "../../app/store/root/getters";
import {expectTranslated} from "../testHelpers";
import {Step} from "../../app/types";

const createStore = (newVersion = jest.fn(), partialRootState: Partial<RootState> = {}, partialStepperGetters = {}) => {
    const store = new Vuex.Store({
        state: mockRootState(partialRootState),
        getters: getters,
        modules: {
            stepper: {
                namespaced: true,
                getters: {
                    changesToRelevantSteps: () => [{number: 2, textKey: "reviewInputs"},
                        {number: 3, textKey: "modelOptions"},
                        {number: 4, textKey: "fitModel"}],
                    ...partialStepperGetters
                }
            },
            errors: {
                namespaced: true,
                state: mockErrorsState(),
                mutations: errorMutations
            },
            projects: {
                namespaced: true,
                state: mockProjectsState({currentProject: {id: 1, name: "v1", note: "test note", versions: []},
                    currentVersion: {id: "version1", created: "", note: "textarea value", updated: "", versionNumber: 1}}),
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

describe("Reset confirmation modal", () => {

    it("renders as expected for guest user", () => {
        const store = createStore(jest.fn(), {currentUser: 'guest'});
        const rendered = mount(ResetConfirmation, {
            props: {
                continueEditing: jest.fn(),
                cancelEditing: jest.fn()
            },
            store
        });

        expectTranslated(rendered.findComponent("h4"), "Have you saved your work?",
            "Avez-vous sauvegardé votre travail ?", "Já guardou o seu trabalho?", store);
        expectTranslated(rendered.findAllComponents("p")[0],
            "Changing this will result in the following steps being discarded:",
            "Si vous modifiez ce paramètre, les étapes suivantes seront abandonnées :",
            "Ao alterar isto, as etapas seguintes serão descartadas:", store);
        expectTranslated(rendered.findAllComponents("p")[1],
            "You may want to save your work before continuing.",
            "Vous devriez peut-être sauvegarder votre travail avant de poursuivre.",
            "Poderá querer guardar o seu trabalho antes de continuar.", store);

        expectRenderedSteps(rendered);

        const buttons = rendered.findAllComponents("button");
        expectTranslated(buttons[0], "Discard these steps and keep editing",
            "Ignorer ces étapes et poursuivre la modification",
            "Descartar estas etapas e continuar a editar", store);
        expectTranslated(buttons[1], "Cancel editing so I can save my work",
            "Annuler l'édition pour que je puisse sauvegarder mon travail",
            "Cancelar a edição para que eu possa guardar o meu trabalho", store);

        expect(rendered.findComponent(LoadingSpinner).exists()).toBe(false);
    });

    it("renders as expected for logged in user", () => {
        const store = createStore();
        const rendered = mount(ResetConfirmation, {
            props: {
                continueEditing: jest.fn(),
                cancelEditing: jest.fn()
            },
            store
        });

        expectTranslated(rendered.findComponent("h4"), "Save version?",
            "Sauvegarder la version?", "Guardar versão?", store);
        expectTranslated(rendered.findAllComponents("p")[0],
            "Changing this will result in the following steps being discarded:",
            "Si vous modifiez ce paramètre, les étapes suivantes seront abandonnées :",
            "Ao alterar isto, as etapas seguintes serão descartadas:", store);
        expectTranslated(rendered.findAllComponents("p")[1],
            "These steps will automatically be saved in a version. You will be able to reload this version from the Projects page.",
            "Ces étapes seront automatiquement sauvegardées dans une version. Vous pourrez recharger cette version depuis la page Projets.",
            "Estas etapas serão automaticamente guardadas numa versão. Poderá voltar a carregar esta versão a partir da página Projetos.",
            store);

        expectRenderedSteps(rendered);

        const buttons = rendered.findAllComponents("button");
        expectTranslated(buttons[0], "Save version and keep editing",
            "Sauvegarder la version et continuer à modifier", "Guardar versão e continuar a editar", store);
        expectTranslated(buttons[1], "Cancel editing", "Annuler l'édition", "Cancelar edição", store);

        expect(rendered.findComponent(LoadingSpinner).exists()).toBe(false);
    });

    it("renders as expected for someone rerunning the model", () => {
        const stepperGetter = {
            changesToRelevantSteps: () => [
                {number: 4, textKey: "fitModel"}]}
        const store = createStore(jest.fn(), {}, stepperGetter);
        const rendered = mount(ResetConfirmation, {
            props: {
                continueEditing: jest.fn(),
                cancelEditing: jest.fn()
            },
            store
        });

        expectRenderedModelRunSteps(rendered);
    });

    it("does not render discarded step when upload input changes", () => {
        const stepperGetter = {
            changesToRelevantSteps: () => [
                {number: 3, textKey: "modelOptions"},
                {number: 4, textKey: "fitModel"}
            ]
        }
        const store = createStore(jest.fn(), {}, stepperGetter);
        const rendered = mount(ResetConfirmation, {
            props: {
                continueEditing: jest.fn(),
                cancelEditing: jest.fn(),
                discardStepWarning: Step.ModelOptions
            },
            store
        });

        expectRenderedModelRunSteps(rendered);
    });

    it("cancel edit button invokes cancelEditing", () => {
        const mockCancelEdit = jest.fn();
        const rendered = mount(ResetConfirmation, {
            props: {
                continueEditing: jest.fn(),
                cancelEditing: mockCancelEdit
            },
            store: createStore()
        });

        rendered.findAllComponents("button")[1].trigger("click");
        expect(mockCancelEdit.mock.calls.length).toBe(1);
    });

    it("continue button invokes continueEditing for guest user", () => {
        const mockContinueEdit = jest.fn();
        const rendered = mount(ResetConfirmation, {
            props: {
                continueEditing: mockContinueEdit,
                cancelEditing: jest.fn()
            },
            store: createStore(jest.fn(), {currentUser: 'guest'})
        });

        rendered.findAllComponents("button")[0].trigger("click");
        expect(mockContinueEdit.mock.calls.length).toBe(1);
    });

    it("can render translated version note label", () => {

        const mockContinueEdit = jest.fn();
        const mockNewVersion = jest.fn();
        const rendered = mount(ResetConfirmation, {
            props: {
                continueEditing: mockContinueEdit,
                cancelEditing: jest.fn()
            },
            store: createStore(mockNewVersion, {currentUser: 'test.user@example.com'})
        });

        const store = rendered.vm.$store
        const noteLabel = rendered.findComponent("#noteHeader label")
        expectTranslated(noteLabel, "Notes: (your reason for saving as a new version)",
            "Notes : (votre motif pour sauvegarder en tant que nouvelle version)",
            "Notas: (a sua razão para guardar como nova versão)", store)
    });

    it("can set and get note value", async () => {

        const mockContinueEdit = jest.fn();
        const mockNewVersion = jest.fn();
        const rendered = mount(ResetConfirmation, {
            props: {
                continueEditing: mockContinueEdit,
                cancelEditing: jest.fn()
            },
            store: createStore(mockNewVersion, {currentUser: 'test.user@example.com'})
        });

        await rendered.setProps({open: true});
        const textarea = rendered.findComponent("textarea").element as HTMLTextAreaElement;
        expect(textarea.value).toBe("textarea value");
    });

    it("can set note value and invokes newVersion action for logged in user", async () => {
        const mockContinueEdit = jest.fn();
        const mockNewVersion = jest.fn();
        const rendered = mount(ResetConfirmation, {
            props: {
                continueEditing: mockContinueEdit,
                cancelEditing: jest.fn()
            },
            store: createStore(mockNewVersion, {currentUser: 'test.user@example.com'})
        });

        rendered.findComponent("textarea").setValue("new Value")
        rendered.findAllComponents("button")[0].trigger("click");

        expect(mockContinueEdit.mock.calls.length).toBe(0);
        expect((rendered.vm as any).waitingForVersion).toBe(true);
        expect(mockNewVersion.mock.calls.length).toBe(1);
        expect(mockNewVersion.mock.calls[0][1]).toBe("new%20Value");
    });

    it("continue button sets waitingForVersion to true and invokes newVersion action for logged in user", () => {

        const mockContinueEdit = jest.fn();
        const mockNewVersion = jest.fn();
        const rendered = mount(ResetConfirmation, {
            props: {
                continueEditing: mockContinueEdit,
                cancelEditing: jest.fn()
            },
            store: createStore(mockNewVersion, {currentUser: 'test.user@example.com'})
        });

        expect((rendered.vm as any).waitingForVersion).toBe(false);

        rendered.findAllComponents("button")[0].trigger("click");

        expect(mockContinueEdit.mock.calls.length).toBe(0);
        expect((rendered.vm as any).waitingForVersion).toBe(true);
        expect(mockNewVersion.mock.calls.length).toBe(1);
    });

    it("when currentVersion changes, sets waitingForVersion to false and invokes continue editing, if waitingForVersion is true", async () => {
        const mockContinueEditing = jest.fn();
        const rendered = mount(ResetConfirmation, {
            data() {
                return {
                    waitingForVersion: true
                };
            },
            props: {
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
            props: {
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
            props: {
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
            props: {
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
        const rendered = mount(ResetConfirmation, {
            data() {
                return {
                    waitingForVersion: true
                };
            },
            props: {
                continueEditing: jest.fn(),
                cancelEditing: jest.fn()
            },
            store: createStore()
        });

        expect(rendered.findComponent("button").exists()).toBe(false);
        expect(rendered.findComponent(LoadingSpinner).props("size")).toBe("sm");
        expect(rendered.findComponent("#spinner-text").text()).toBe("Saving version");
    });

    const expectRenderedSteps = (rendered: Wrapper<any>) => {
        const store = rendered.vm.$store;
        const steps = rendered.findAllComponents("li");
        expect(steps.length).toBe(3);

        expectTranslated(steps[0], "Step 2: Review inputs",
            "Étape 2: Examiner les entrées",
            "Etapa 2: Analise as entradas", store);

        expectTranslated(steps[1], "Step 3: Model options",
            "Étape 3: Options des modèles",
            "Etapa 3: Opções de modelos", store);

        expectTranslated(steps[2], "Step 4: Fit model",
            "Étape 4: Ajuster le modèle",
            "Etapa 4: Ajustar modelo", store);
    };

    const expectRenderedModelRunSteps = (rendered: Wrapper<any>) => {
        const store = rendered.vm.$store;
        const steps = rendered.findAllComponents("li");
        expect(steps.length).toBe(1);
        expectTranslated(steps[0], "Step 4: Fit model",
            "Étape 4: Ajuster le modèle", "Etapa 4: Ajustar modelo", store);
    };

});

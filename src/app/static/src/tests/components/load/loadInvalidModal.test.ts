import {mount, RouterLinkStub} from "@vue/test-utils";
import LoadInvalidModal from "../../../app/components/load/LoadInvalidModal.vue"
import Vuex from "vuex";
import {emptyState, RootState} from "../../../app/root";
import {initialStepperState} from "../../../app/store/stepper/stepper";
import {expectHasTranslationKey, expectTranslated} from "../../testHelpers";
import registerTranslations from "../../../app/store/translations/registerTranslations";

const mockRollbackInvalidState = jest.fn();
const mockLoadVersion = jest.fn();
const stubs = {
    RouterLink: RouterLinkStub
};

const getStore = (invalidSteps: number[], isGuest: boolean) => {
    return new Vuex.Store<RootState>({
        state: {
            ...emptyState(),
            invalidSteps
        } as any,
        actions: {
            rollbackInvalidState: mockRollbackInvalidState
        },
        getters: {
            isGuest: () => isGuest
        } as any,
        modules: {
            projects: {
                namespaced: true,
                state: {
                    currentProject: {
                        id: "testProjectId"
                    },
                    currentVersion: {
                        id: "testVersionId"
                    }
                },
                actions: {
                    loadVersion: mockLoadVersion
                }
            },
            stepper: {
                namespaced: true,
                state: initialStepperState()
            }
        }
    });
};

describe("loadInvalidModal", () => {

    const mockTranslate = jest.fn();

    beforeEach(() => {
        jest.resetAllMocks()
    })

    const getWrapper = (invalidSteps: number[] = [], isGuest: boolean = false) => {
        const store = getStore(invalidSteps, isGuest);
        return mount(LoadInvalidModal, {
            store,
            directives: {
                translate: mockTranslate
            },
            stubs
        })
    }

    it("can render load invalid modal as expected when there are no invalid steps", () => {
        const wrapper = getWrapper();
        const modal = wrapper.find(".modal")
        expect(modal.attributes()).toEqual({
            class: "modal",
            style: "display: none;"
        })
    });

    it("can render error modal as expected where there are invalid steps after first step", () => {
        const wrapper = getWrapper([2, 3]);
        expectHasTranslationKey(wrapper.find("span#load-invalid-steps"), "loadInvalidSteps");
        const stepsListItems = wrapper.findAll("ul#load-invalid-steps-list li");
        expect(stepsListItems.length).toBe(2);
        expectHasTranslationKey(stepsListItems.at(0), "reviewInputs");
        expectHasTranslationKey(stepsListItems.at(1), "modelOptions");
        expectHasTranslationKey(wrapper.find("span#load-invalid-steps-from-valid-action"), "loadInvalidStepsFromValidAction");
        expectHasTranslationKey(wrapper.find("span#load-invalid-last-valid"), "uploadInputs");
        expectHasTranslationKey(wrapper.find("span#load-invalid-steps-rollback-info"), "loadInvalidStepsRollbackInfo");
        expect(wrapper.find("#load-invalid-steps-rollback-info-guest").exists()).toBe(false);

        const retryBtn = wrapper.find("button#retry-load");
        expectHasTranslationKey(retryBtn, "retry");
        expectHasTranslationKey(retryBtn, "retry", "aria-label");
        const rollbackBtn = wrapper.find("button#rollback-load");
        expectHasTranslationKey(rollbackBtn, "rollback");
        expectHasTranslationKey(rollbackBtn, "rollback", "aria-label");
    });

    it("renders rollback information for guest user", () => {
        const wrapper = getWrapper([2, 3], true);
        const info = wrapper.find("span#load-invalid-steps-rollback-info-guest");
        expectHasTranslationKey(info, "loadInvalidStepsRollbackInfoGuest");
        expect(wrapper.find("#load-invalid-steps-rollback-info").exists()).toBe(false);
    });

    it("can render error modal as expected where first step is invalid", () => {
        const wrapper = getWrapper([1, 4]);
        expectHasTranslationKey(wrapper.find("span#load-invalid-steps"), "loadInvalidSteps");
        const stepsListItems = wrapper.findAll("ul#load-invalid-steps-list li");
        expect(stepsListItems.length).toBe(2);
        expectHasTranslationKey(stepsListItems.at(0), "uploadInputs");
        expectHasTranslationKey(stepsListItems.at(1), "fitModel");
        expectHasTranslationKey(wrapper.find("#load-invalid-steps-all-action"), "loadInvalidStepsAllAction");
        expectHasTranslationKey(wrapper.find("#load-invalid-steps-rollback-info"), "loadInvalidStepsRollbackInfo");

        expectHasTranslationKey(wrapper.find("button#retry-load"), "retry");
        expectHasTranslationKey(wrapper.find("button#rollback-load"), "rollback");
    });

    it("displays Projects page link if not guest user", () => {
        const wrapper = getWrapper([1]);
        const projectsPara = wrapper.find("p#load-invalid-projects");
        expectHasTranslationKey(projectsPara.find("span#load-invalid-projects-prefix"), "loadInvalidStepsProjectLinkPrefix");
        const routerLink = projectsPara.find(RouterLinkStub);
        expect(routerLink.props("to")).toBe("/projects");
        expectHasTranslationKey(routerLink, "projects");
        expectHasTranslationKey(routerLink, "projects", "aria-label");
        expectHasTranslationKey(projectsPara.find("span#load-invalid-projects-suffix"), "loadInvalidStepsProjectLinkSuffix");
    });

    it("does not display Projects page link if guest user", () => {
        const wrapper = getWrapper([1], true);
        expect(wrapper.find("#load-invalid-projects").exists()).toBe(false);
    });

    it("click Retry invokes loadVersion action", async () => {
        const wrapper = getWrapper([1]);
        await wrapper.find("button#retry-load").trigger("click");
        expect(mockLoadVersion.mock.calls[0][1]).toStrictEqual({versionId:  "testVersionId", projectId: "testProjectId"});
    });

    it("click Rollback invokes rollbackInvalidState action", async () => {
        const wrapper = getWrapper([1]);
        await wrapper.find("button#rollback-load").trigger("click");
        expect(mockRollbackInvalidState).toHaveBeenCalledTimes(1);
    });
});

describe("loadInvalidModal translations", () => {
    const getWrapper = (invalidSteps: number[] = [], isGuest: boolean = false)  => {
        const store = getStore(invalidSteps, isGuest);
        registerTranslations(store);
        return mount(LoadInvalidModal, { store, stubs });
    };

    it("can display expected translations where there are invalid steps after first step", () => {
        const wrapper = getWrapper([2, 3]);
        const store = wrapper.vm.$store;

        expectTranslated(wrapper.find("span#load-invalid-steps"), "There was a problem loading the following steps:",
            "Un problème est survenu lors du chargement des étapes suivantes:",
            "Ocorreu um problema ao carregar as seguintes etapas:", store);


        const stepsListItems = wrapper.findAll("ul#load-invalid-steps-list li");

        expectTranslated(stepsListItems.at(0), "Review inputs", "Examiner les entrées",
            "Analise as entradas", store);
        expectTranslated(stepsListItems.at(1), "Model options", "Options des modèles",
            "Opções de modelos", store);

        expectTranslated(wrapper.find("span#load-invalid-steps-from-valid-action"),
            "Retry load or rollback to the last valid step, which is",
            "Refaire ou revenir en arrière jusqu'au dernier étape valide, qui est",
            "Tente carregar novamente ou reverter para a última etapa válida, que é", store);

        expectTranslated(wrapper.find("span#load-invalid-last-valid"), "Upload inputs", "Télécharger les entrées",
            "Carregar entradas", store);

        expectTranslated(wrapper.find("span#load-invalid-steps-rollback-info"),
            "Rollback will be done in a new version - the current project version state will be preserved.",
            "Revenir en arrière sera effectuée dans une nouvelle version - l'état actuel de la version du projet sera conservé.",
            "Reverter será feita em uma nova versão - o estado da versão atual do projeto será preservado.", store);

        const retryBtn = wrapper.find("button#retry-load");
        expectTranslated(retryBtn, "Retry", "Refaire", "Tentar novamente", store);
        expectTranslated(retryBtn, "Retry", "Refaire", "Tentar novamente", store, "aria-label");

        const rollbackBtn = wrapper.find("button#rollback-load");
        expectTranslated(rollbackBtn, "Rollback", "Revenir en arrière", "Reverter", store);
        expectTranslated(rollbackBtn, "Rollback", "Revenir en arrière", "Reverter", store, "aria-label");
    });

    it("can display expected translations for rollback information when user is guest", () => {
        const wrapper = getWrapper([2, 3], true);
        const store = wrapper.vm.$store;
        expectTranslated(wrapper.find("span#load-invalid-steps-rollback-info-guest"),
            "Rollback will result in a loss of all project data from subsequent steps.",
            "Revenir en arrière entraînera la perte de toutes les données du projet des étapes suivantes.",
            "Reverter resultará na perda de todos os dados do projeto das etapas subsequentes.", store);
    });

    it("can display expected translations where first step is invalid", () => {
        const wrapper = getWrapper([1]);
        const store = wrapper.vm.$store;
        expectTranslated(wrapper.find("#load-invalid-steps-all-action"), "Retry load or rollback?",
            "Refaire ou revenir en arrière?", "Tentar carregar novamente ou reverter?", store);

        expectTranslated(wrapper.find("span#load-invalid-steps-rollback-info"),
            "Rollback will be done in a new version - the current project version state will be preserved.",
            "Revenir en arrière sera effectuée dans une nouvelle version - l'état actuel de la version du projet sera conservé.",
            "Reverter será feita em uma nova versão - o estado da versão atual do projeto será preservado.", store);
    });

    it("can display Projects page link translations", () => {
        const wrapper = getWrapper([1]);
        const store = wrapper.vm.$store;
        expectTranslated(wrapper.find("#load-invalid-projects-prefix"), "You can also go back to",
            "Vous pouvez également revenir à la page", "Você também pode voltar para a página", store);
        expectTranslated(wrapper.find("#load-invalid-projects-link"), "Projects", "Projets", "Projetos"
            , store);
        expectTranslated(wrapper.find("#load-invalid-projects-suffix"), "page", "", "", store);
    });
});
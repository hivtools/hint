import {mount} from "@vue/test-utils";
import {mockError, mockLoadState, mockProjectsState} from "../../mocks";
import Vue from "vue";
import UploadNewProject from "../../../app/components/load/UploadNewProject.vue"
import Vuex, {Store} from "vuex";
import {emptyState, RootState} from "../../../app/root";
import RegisterTranslations from "../../../app/store/translations/registerTranslations";
import {expectTranslated} from "../../testHelpers";
import LoadErrorModal from "../../../app/components/load/LoadErrorModal.vue";
import UploadProgress from "../../../app/components/load/UploadProgress.vue";
import {LoadingState, LoadState} from "../../../app/store/load/load";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";

describe("uploadNewProject", () => {

    beforeEach(() => {
        jest.resetAllMocks()
    })

    const mockMutations = {
        RehydrateCancel: jest.fn(),
        SetProjectName: jest.fn()
    }

    const mockActions = {
        clearLoadState: jest.fn()
    }

    const mockSubmitFunction = jest.fn()
    const mockCancelFunction = jest.fn()
    const mockGetProjects = jest.fn()

    const testProjects = [{id: 2, name: "proj1", versions: []}];

    const getStore = (loadState: Partial<LoadState> = {}) => {
        const store = new Vuex.Store({
            state: emptyState,
            modules: {
                load: {
                    namespaced: true,
                    state: mockLoadState(loadState),
                    mutations: mockMutations,
                    actions: mockActions
                },
                projects: {
                    namespaced: true,
                    state: mockProjectsState({previousProjects: testProjects}),
                    actions: {
                        getProjects: mockGetProjects
                    }
                }
            }
        })

        RegisterTranslations(store)
        return store
    }

    const getWrapper = (props = {}, store: Store<RootState> = getStore()) => {
        return mount(UploadNewProject, {
            propsData: {
                openModal: false,
                submitLoad: mockSubmitFunction,
                cancelLoad: mockCancelFunction,
                ...props
            }, store
        })
    }

    it("renders modals as expected", () => {
        const wrapper = getWrapper()

        expect(wrapper.find(".modal").exists()).toBe(true)
        expect(wrapper.find(".modal").attributes()).toEqual({
            "class": "modal",
            "style": "display: none;"
        })
        const uploadProject = wrapper.find("#load-project-name");
        expect(uploadProject.exists()).toBe(true)
        expect(mockGetProjects).toHaveBeenCalledTimes(1)
        expect(uploadProject.find(LoadErrorModal).exists()).toBe(true)
        expect(uploadProject.find(UploadProgress).exists()).toBe(true)
    })

    it("should render UploadProgress props", () => {
        const wrapper = getWrapper()

        const uploadProject = wrapper.find("#load-project-name");
        expect(uploadProject.exists()).toBe(true)
        expect(uploadProject.find(UploadProgress).exists()).toBe(true)
        expect(uploadProject.find(UploadProgress).props("cancel")).toBeInstanceOf(Function)
        expect(uploadProject.find(UploadProgress).props("openModal")).toBe(false)
    })

    it("should render loadErrorModal props", () => {
        const wrapper = getWrapper()

        const uploadProject = wrapper.find("#load-project-name");
        expect(uploadProject.exists()).toBe(true)
        expect(uploadProject.find(LoadErrorModal).exists()).toBe(true)
        expect(uploadProject.find(LoadErrorModal).props("clearLoadError")).toBeInstanceOf(Function)
        expect(uploadProject.find(LoadErrorModal).props("hasError")).toBe(false)
        expect(uploadProject.find(LoadErrorModal).props("loadError")).toBe(null)
    })

    it("should render translated text", () => {
        const wrapper = getWrapper({openModal: true})

        const store = wrapper.vm.$store
        const label = wrapper.find(".modal label")
        expectTranslated(label,
            "Please enter a name for the new project",
            "Veuillez saisir un nom pour le nouveau projet",
            "Insira um nome para o novo projeto",
            store)
    })

    it("should open modal", () => {
        const wrapper = getWrapper({openModal: true})

        const uploadNewProjectModal = wrapper.find(".modal");
        expect(uploadNewProjectModal.attributes()).toEqual({
            "class": "modal show",
            "style": "display: block;"
        })
    })

    it("confirm load to project button is disabled when project name is empty", async () => {
        const wrapper = getWrapper()

        const confirmButton = wrapper.find("#confirm-load-project");
        expect(confirmButton.attributes("disabled")).toBe("disabled");
        await wrapper.find("#project-name-input").setValue("test");
        expect(mockMutations.SetProjectName.mock.calls[0][1]).toBe("test")
        expect(wrapper.vm.$data.uploadProjectName).toBe("test")
        await expect(confirmButton.attributes("disabled")).toBeUndefined();
    });

    it("clicking confirm load to project button invokes action", async () => {
        const wrapper = getWrapper({openModal: true})

        wrapper.find("#project-name-input").setValue("new project");
        wrapper.find("#confirm-load-project").trigger("click");
        await Vue.nextTick();
        expect(mockSubmitFunction.mock.calls.length).toEqual(1);
    });

    it("can trigger cancelLoad action", async () => {
        const wrapper = getWrapper({openModal: true})

        wrapper.find("#project-name-input").setValue("new project");
        wrapper.find("#cancel-load-project").trigger("click");
        await Vue.nextTick();
        expect(mockCancelFunction.mock.calls.length).toEqual(1);
    });

    it("can display error message when new project name is invalid", async () => {
        const wrapper = getWrapper({openModal: true})
        const store = wrapper.vm.$store

        wrapper.find("#project-name-input").setValue("proj1");
        expectTranslated(wrapper.find(".invalid-feedback"),
            "Please choose a unique name",
            "Veuillez choisire un nom unique",
            "Por favor, escolha um nome único",
            store)
        expect(wrapper.find(LoadErrorModal).props("hasError")).toBe(false)
    });

    it("should translate text and display error modal when error occurred while uploading", () => {
        const store = getStore({
            loadingState: LoadingState.LoadFailed,
            loadError: mockError("Testing Error")
        })
        const wrapper = getWrapper({openModal: true}, store)

        expect(wrapper.find(LoadErrorModal).props("hasError")).toBe(true)
        expectTranslated(wrapper.find(LoadErrorModal).find("h4"),
            "Load Error",
            "Erreur de chargement",
            "Erro de carregamento",
            store)

        expect(wrapper.find(LoadErrorModal).find("p").text()).toBe("Testing Error")
        expect(wrapper.find(LoadErrorModal).find("button").exists()).toBe(true)
    })

    it("should close error modal when close handler is triggered", () => {
        const store = getStore({
            loadingState: LoadingState.LoadFailed,
            loadError: mockError("Testing Error")
        })
        const wrapper = getWrapper({openModal: true}, store)

        expect(wrapper.find(LoadErrorModal).props("hasError")).toBe(true)
        wrapper.find(LoadErrorModal).find("button").trigger("click")
        expect(mockActions.clearLoadState.mock.calls.length).toBe(1)
    })

    it("should translate text and ender upload progress bar when upload in progress", () => {
        const store = getStore({
            preparing: true
        })
        const wrapper = getWrapper({openModal: true}, store)
        expect(wrapper.find(LoadErrorModal).props("hasError")).toBe(false)
        expect(wrapper.find(UploadProgress).props("openModal")).toBe(true)
        expect(wrapper.find(LoadingSpinner).exists()).toBe(true)
        expect(wrapper.find(UploadProgress).find(".progress").exists()).toBe(true)

        expectTranslated(wrapper.find("#upload-header"),
            "Uploading project from model outputs",
            "Téléchargement du projet à partir des sorties du modèle",
            "Fazendo upload do projeto das saídas do modelo",
            store)

        expectTranslated(wrapper.find("#progress-message"),
            "Uploading...",
            "Téléchargement...",
            "Enviando...",
            store)
    })

    it("should close and cancel upload progress when cancel handler is triggered", () => {
        const store = getStore({
            preparing: true
        })

        const wrapper = getWrapper({openModal: true}, store)
        expect(wrapper.find(UploadProgress).props("openModal")).toBe(true)
        wrapper.find(UploadProgress).find("button").trigger("click")
        expect(mockMutations.RehydrateCancel.mock.calls.length).toBe(1)
    })
})
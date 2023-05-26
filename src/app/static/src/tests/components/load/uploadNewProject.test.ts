import {mount} from "@vue/test-utils";
import {mockError, mockLoadState, mockProjectsState, mockRootState} from "../../mocks";
import Vue, { nextTick } from "vue";
import UploadNewProject from "../../../app/components/load/UploadNewProject.vue"
import Vuex, {Store} from "vuex";
import {emptyState, RootState} from "../../../app/root";
import RegisterTranslations from "../../../app/store/translations/registerTranslations";
import {expectTranslated, mountWithTranslate} from "../../testHelpers";
import LoadErrorModal from "../../../app/components/load/LoadErrorModal.vue";
import UploadProgress from "../../../app/components/load/UploadProgress.vue";
import {LoadingState, LoadState} from "../../../app/store/load/state";
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

    const getStore = (loadState: Partial<LoadState> = {}, isGuest = false) => {
        const store = new Vuex.Store({
            state: emptyState,
            getters: {
                isGuest: () => isGuest
            },
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
        return mountWithTranslate(UploadNewProject, store, {
            props: {
                openModal: false,
                submitLoad: mockSubmitFunction,
                cancelLoad: mockCancelFunction,
                ...props
            },
            global: {
                plugins: [store]
            }
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
        expect(uploadProject.findComponent(LoadErrorModal).exists()).toBe(true)
        expect(uploadProject.findComponent(UploadProgress).exists()).toBe(true)
    })

    it("should render UploadProgress props", () => {
        const wrapper = getWrapper()

        const uploadProject = wrapper.find("#load-project-name");
        expect(uploadProject.exists()).toBe(true)
        expect(uploadProject.findComponent(UploadProgress).exists()).toBe(true)
        expect(uploadProject.findComponent(UploadProgress).props("cancel")).toBeInstanceOf(Function)
        expect(uploadProject.findComponent(UploadProgress).props("openModal")).toBe(false)
    })

    it("should render loadErrorModal props", () => {
        const wrapper = getWrapper()

        const uploadProject = wrapper.find("#load-project-name");
        expect(uploadProject.exists()).toBe(true)
        expect(uploadProject.findComponent(LoadErrorModal).exists()).toBe(true)
        expect(uploadProject.findComponent(LoadErrorModal).props("clearLoadError")).toBeInstanceOf(Function)
        expect(uploadProject.findComponent(LoadErrorModal).props("hasError")).toBe(false)
        expect(uploadProject.findComponent(LoadErrorModal).props("loadError")).toBe(null)
    })

    it("should render translated text", async () => {
        const wrapper = getWrapper({openModal: true})

        const store = wrapper.vm.$store
        const label = wrapper.find(".modal label")
        await expectTranslated(label,
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
        expect(confirmButton.attributes("disabled")).toBe("");
        await wrapper.find("#project-name-input").setValue("test");
        expect(mockMutations.SetProjectName.mock.calls[0][1]).toBe("test")
        expect((wrapper.vm as any).$data.uploadProjectName).toBe("test")
        expect(confirmButton.attributes("disabled")).toBeUndefined();
    });

    it("clicking confirm load to project button invokes action", async () => {
        const wrapper = getWrapper({openModal: true})

        await wrapper.find("#project-name-input").setValue("new project");
        await wrapper.find("#confirm-load-project").trigger("click");
        expect(mockSubmitFunction.mock.calls.length).toEqual(1);
    });

    it("can trigger cancelLoad action", async () => {
        const wrapper = getWrapper({openModal: true})

        wrapper.find("#project-name-input").setValue("new project");
        await wrapper.find("#cancel-load-project").trigger("click");
        expect(mockCancelFunction.mock.calls.length).toEqual(1);
    });

    it("can display error message when new project name is invalid", async () => {
        const wrapper = getWrapper({openModal: true})
        const store = wrapper.vm.$store

        await wrapper.find("#project-name-input").setValue("proj1");
        await expectTranslated(wrapper.find(".invalid-feedback"),
            "Please choose a unique name",
            "Veuillez choisire un nom unique",
            "Por favor, escolha um nome único",
            store)
        expect(wrapper.findComponent(LoadErrorModal).props("hasError")).toBe(false)
    });

    it("should translate text and display error modal when error occurred while uploading", async () => {
        const store = getStore({
            loadingState: LoadingState.LoadFailed,
            loadError: mockError("Testing Error")
        })
        const wrapper = getWrapper({openModal: true}, store)

        expect(wrapper.findComponent(LoadErrorModal).props("hasError")).toBe(true)
        await expectTranslated(wrapper.findComponent(LoadErrorModal).find("h4"),
            "Load Error",
            "Erreur de chargement",
            "Erro de carregamento",
            store)

        expect(wrapper.findComponent(LoadErrorModal).find("p").text()).toBe("Testing Error")
        expect(wrapper.findComponent(LoadErrorModal).find("button").exists()).toBe(true)
    })

    it("should close error modal when close handler is triggered", async () => {
        const store = getStore({
            loadingState: LoadingState.LoadFailed,
            loadError: mockError("Testing Error")
        })
        const wrapper = getWrapper({openModal: true}, store)

        expect(wrapper.findComponent(LoadErrorModal).props("hasError")).toBe(true)
        await wrapper.findComponent(LoadErrorModal).find("button").trigger("click")
        expect(mockActions.clearLoadState.mock.calls.length).toBe(1)
    })

    it("should translate text and ender upload progress bar when upload in progress", async () => {
        const store = getStore({
            preparing: true
        })
        const wrapper = getWrapper({openModal: true}, store)
        expect(wrapper.findComponent(LoadErrorModal).props("hasError")).toBe(false)
        expect(wrapper.findComponent(UploadProgress).props("openModal")).toBe(true)
        expect(wrapper.findComponent(LoadingSpinner).exists()).toBe(true)
        expect(wrapper.findComponent(UploadProgress).find(".progress").exists()).toBe(true)

        await expectTranslated(wrapper.find("#upload-header"),
            "Uploading project from model outputs",
            "Téléchargement du projet à partir des sorties du modèle",
            "Fazendo upload do projeto das saídas do modelo",
            store)

        await expectTranslated(wrapper.find("#progress-message"),
            "Uploading...",
            "Téléchargement...",
            "Enviando...",
            store)
    })

    it("should close and cancel upload progress when cancel handler is triggered", async () => {
        const store = getStore({
            preparing: true
        })

        const wrapper = getWrapper({openModal: true}, store)
        expect(wrapper.findComponent(UploadProgress).props("openModal")).toBe(true)
        await wrapper.findComponent(UploadProgress).find("button").trigger("click")
        expect(mockMutations.RehydrateCancel.mock.calls.length).toBe(1)
    })

    it("does not get projects when user is not logged in", () => {
        const store = getStore({}, true)
        const wrapper = getWrapper({}, store)

        expect(wrapper.find(".modal").exists()).toBe(true)
        expect(wrapper.find(".modal").attributes()).toEqual({
            "class": "modal",
            "style": "display: none;"
        })
        const uploadProject = wrapper.find("#load-project-name");
        expect(uploadProject.exists()).toBe(true)
        expect(mockGetProjects).not.toHaveBeenCalled()
    })
})
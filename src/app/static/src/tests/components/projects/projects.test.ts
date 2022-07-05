import {ProjectsState} from "../../../app/store/projects/projects";
import Vuex, {Store} from "vuex";
import {mockFile, mockLoadState, mockProjectsState} from "../../mocks";
import {mount, shallowMount} from "@vue/test-utils";
import Projects from "../../../app/components/projects/Projects.vue";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";
import {expectTranslated} from "../../testHelpers";
import ProjectUploadButton from "../../../app/components/projects/ProjectUploadButton.vue";
import UploadNewProject from "../../../app/components/load/UploadNewProject.vue";

describe("Projects component", () => {

    beforeEach(() => {
        jest.resetAllMocks()
    })

    const mockCreateProject = jest.fn()
    const mockRouterPush = jest.fn()

    const mockRehydrateAction = jest.fn()
    const mockSetLoadProjectName = jest.fn()

    const createSut = (state: Partial<ProjectsState> = {},
                       isGuest = false) => {

        const store = new Vuex.Store({
            state: emptyState(),
            getters: {
                isGuest: () => isGuest
            },
            modules: {
                projects: {
                    namespaced: true,
                    state: mockProjectsState(state),
                    actions: {
                        createProject: mockCreateProject,
                        getProjects: jest.fn()
                    }
                },
                load: {
                    namespaced: true,
                    state: mockLoadState(),
                    actions: {
                        preparingRehydrate: mockRehydrateAction
                    },
                    mutations: {
                        SetProjectName: mockSetLoadProjectName
                    }
                }
            },
        });
        registerTranslations(store);

        const mocks = {
            $router: {
                push: mockRouterPush
            }
        };

        return {store, mocks}
    };

    const getWrapper = (state: Partial<ProjectsState> = {}) => {
        const {store, mocks} = createSut(state)
        return shallowMount(Projects, {store, mocks});
    }

    const currentProject = {name: "existingProject", id: 1, versions: []};
    const previousProjects = ["TEST PREVIOUS VERSION"] as any;

    it("renders as expected with no current project", () => {
        const wrapper = getWrapper({previousProjects});
        const store = wrapper.vm.$store;
        expect(wrapper.find(LoadingSpinner).exists()).toBe(false);
        expect(wrapper.find("#projects-content").exists()).toBe(true);
        expect(wrapper.find("#project-upload-button").exists()).toBe(true)

        expectTranslated(wrapper.find("#projects-header"), "Create a new project",
            "Créer un nouveau projet", "Criar um novo projeto", store);
        expectTranslated(wrapper.find("p"), "Your work is organised into projects. Each project contains its own data and settings.",
            "Votre travail est organisé en projets. Chaque projet contient ses propres données et paramètres.",
            "O seu trabalho está organizado em projetos. Cada projeto contém os seus próprios dados e definições.", store);
        expectTranslated(wrapper.find("input"), "Project name",
            "Nom du projet", "Nome do projeto", store, "placeholder");
        expectTranslated(wrapper.find("button"), "Create project",
            "Créer un projet", "Criar projeto", store);
        expect(wrapper.find("button").attributes("disabled")).toBe("disabled");
        expect(wrapper.find(ErrorAlert).exists()).toBe(false);
    });

    it("renders as expected with current project", () => {
        const wrapper = getWrapper({currentProject});
        const store = wrapper.vm.$store;

        expectTranslated(wrapper.find("p"), "Your work is organised into projects. Each project contains its own data and settings.",
            "Votre travail est organisé en projets. Chaque projet contient ses propres données et paramètres.",
            "O seu trabalho está organizado em projetos. Cada projeto contém os seus próprios dados e definições.", store);
        expectTranslated(wrapper.find("#projects-header"),
            "Create a new project or return to current project (existingProject)",
            "Créer un nouveau projet ou retour au projet actuel (existingProject)",
            "Criar um novo projeto ou regressar ao projeto atual (existingProject)", store);
        expect(wrapper.find("#projects-header a").exists()).toBe(true);
    });

    it("enables create project button when project name is entered", () => {
        const wrapper = getWrapper();
        wrapper.find("input").setValue("newProject");
        expect(wrapper.find("button").attributes("disabled")).toBeUndefined();
        expect(wrapper.findAll(".invalid-feedback").length).toBe(0);
    });

    it("can create a new project when enter key is pressed", () => {
        const wrapper = getWrapper();
        const input = wrapper.find("input")

        input.setValue("newProject with enter key");
        expect(wrapper.find("button").attributes("disabled")).toBeUndefined();
        input.trigger("keyup.enter")

        expect(mockCreateProject.mock.calls.length).toBe(1);
        expect(mockCreateProject.mock.calls[0][1]).toStrictEqual({name: "newProject with enter key"});
    });

    it("shows invalid feedback if name is non unique", () => {
        const wrapper = getWrapper({previousProjects: [{name: "p1", id: 123, versions: []}]});
        wrapper.find("input").setValue("p1");
        expect(wrapper.find("button").attributes("disabled")).toBe("disabled");
        expect(wrapper.findAll(".invalid-feedback").length).toBe(1);
    });

    it("displays error if any", () => {
        const error = {error: "error", detail: "detail"};
        const wrapper = getWrapper({error});
        expect(wrapper.find(ErrorAlert).props()["error"]).toBe(error);
    });

    it("clicking create project button invokes action", () => {
        const wrapper = getWrapper();
        wrapper.find("input").setValue("newProject");
        wrapper.find("button").trigger("click");

        expect(mockCreateProject.mock.calls.length).toBe(1);
        expect(mockCreateProject.mock.calls[0][1]).toStrictEqual({name: "newProject"});
    });

    it("renders ProjectUploadButton prop as expected", () => {
        const wrapper = getWrapper();
        const uploadButton = wrapper.find(ProjectUploadButton);

        expect(uploadButton.props("uploadProject")).toBeInstanceOf(Function)
    });

    it("render UploadNewProject props as expected", () => {
        const wrapper = getWrapper();
        const uploadNewProject = wrapper.find(UploadNewProject);

        expect(uploadNewProject.props("submitLoad")).toBeInstanceOf(Function)
        expect(uploadNewProject.props("cancelLoad")).toBeInstanceOf(Function)
        expect(uploadNewProject.props("openModal")).toBe(false)
    });

    it("should create a new project from upload", async () => {
        const {store, mocks} = createSut()
        const wrapper = mount(Projects, {
            store,
            mocks,
            data() {
                return {
                    openNewProjectModal: true
                }
            }
        })
        expect(wrapper.vm.$data.openNewProjectModal).toBe(true)
        expect(wrapper.find("#load").props("open")).toBe(true)
        const confirmLoad = wrapper.find("#confirm-load-project")
        expect(confirmLoad.attributes("disabled")).toBe("disabled")
        await wrapper.find("#project-name-input").setValue("new uploaded project")
        expect(confirmLoad.attributes("disabled")).toBeUndefined()
        await confirmLoad.trigger("click")
        expect(wrapper.find("#load").props("open")).toBe(false)
    });

    it("clicking back to current project link invokes router", () => {
        const wrapper = getWrapper({currentProject});

        wrapper.find("#projects-header a").trigger("click");

        expect(mockRouterPush.mock.calls.length).toBe(1);
        expect(mockRouterPush.mock.calls[0][0]).toStrictEqual("/");
    });

    it("displays spinner if loading", () => {
        const wrapper = getWrapper({loading: true});
        expect(wrapper.find(LoadingSpinner).exists()).toBe(true);
        expect(wrapper.find("#projects-content").exists()).toBe(false);
    });

});

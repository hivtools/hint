import {ProjectsState} from "../../../app/store/projects/projects";
import Vuex from "vuex";
import {mockProjectsState} from "../../mocks";
import {shallowMount} from "@vue/test-utils";
import Projects from "../../../app/components/projects/Projects.vue";
import ProjectHistory from "../../../app/components/projects/ProjectHistory.vue";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";
import ErrorAlert from "../../../app/components/ErrorAlert.vue";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";

describe("Projects component", () => {

    const createSut = (state: Partial<ProjectsState> = {},
                       mockCreateProject = jest.fn(),
                       mockRouterPush = jest.fn()) => {

        const store =  new Vuex.Store({
            state: emptyState(),
            modules: {
                projects: {
                    namespaced: true,
                    state: mockProjectsState(state),
                    actions: {
                        createProject: mockCreateProject,
                        getProjects: jest.fn()
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

        return shallowMount(Projects, {store, mocks});
    };

    const currentProject = {name: "existingProject", id: 1, versions: []};
    const previousProjects = ["TEST PREVIOUS VERSION"] as any;

    it("renders as expected with no current project", () => {
        const wrapper = createSut({previousProjects});
        expect(wrapper.find(LoadingSpinner).exists()).toBe(false);
        expect(wrapper.find("#projects-content").exists()).toBe(true);

        expect(wrapper.find("#projects-header").text()).toBe("Create a new project");
        expect(wrapper.find("input").attributes()["placeholder"]).toBe("Project name");
        expect(wrapper.find("button").text()).toBe("Create project");
        expect(wrapper.find("button").attributes("disabled")).toBe("disabled");
        expect(wrapper.find(ErrorAlert).exists()).toBe(false);
    });

    it("renders as expected with current project", () => {
        const wrapper = createSut({currentProject});

        expect(wrapper.find("#projects-header").text()).toBe("Create a new project or return to current project (existingProject)");
        expect(wrapper.find("#projects-header a").exists()).toBe(true);
    });

    it("enables create project button when project name is entered", () => {
        const wrapper = createSut();
        wrapper.find("input").setValue("newProject");
        expect(wrapper.find("button").attributes("disabled")).toBeUndefined();
        expect(wrapper.findAll(".invalid-feedback").length).toBe(0);
    });

    it("shows invalid feedback if name is non unique", () => {
        const wrapper = createSut({previousProjects: [{name: "p1", id: 123, versions: []}]});
        wrapper.find("input").setValue("p1");
        expect(wrapper.find("button").attributes("disabled")).toBe("disabled");
        expect(wrapper.findAll(".invalid-feedback").length).toBe(1);
    });

    it("displays error if any", () => {
        const error = {error: "error", detail: "detail"};
        const wrapper = createSut({error});
        expect(wrapper.find(ErrorAlert).props()["error"]).toBe(error);
    });

    it("clicking create project button invokes action", () => {
        const mockCreateProject = jest.fn();
        const wrapper = createSut({}, mockCreateProject);
        wrapper.find("input").setValue("newProject");
        wrapper.find("button").trigger("click");

        expect(mockCreateProject.mock.calls.length).toBe(1);
        expect(mockCreateProject.mock.calls[0][1]).toBe("newProject");
    });

    it("clicking back to current project link invokes router", () =>{
        const mockRouterPush = jest.fn();
        const wrapper = createSut({currentProject}, jest.fn(), mockRouterPush);

        wrapper.find("#projects-header a").trigger("click");

        expect(mockRouterPush.mock.calls.length).toBe(1);
        expect(mockRouterPush.mock.calls[0][0]).toStrictEqual( "/");
    });

    it("displays spinner if loading", () => {
        const wrapper = createSut({loading: true});
        expect(wrapper.find(LoadingSpinner).exists()).toBe(true);
        expect(wrapper.find("#projects-content").exists()).toBe(false);
    });
});

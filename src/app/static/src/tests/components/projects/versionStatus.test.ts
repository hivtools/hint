import Vuex from 'vuex';
import {shallowMount} from '@vue/test-utils';
import VersionStatus from "../../../app/components/projects/VersionStatus.vue";
import {ProjectsState} from "../../../app/store/projects/projects";
import {mockProjectsState} from "../../mocks";
import {CheckIcon} from "vue-feather-icons";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {emptyState} from "../../../app/root";

describe("Version status component", () => {
    const getWrapper = (projectsState: Partial<ProjectsState> = {}) => {
        const store =  new Vuex.Store({
            state: emptyState(),
            modules: {
                projects: {
                    namespaced: true,
                    state: mockProjectsState(projectsState),
                }
            }
        });
        registerTranslations(store);
        return shallowMount(VersionStatus, {store});
    };
    const date = new Date(2020, 8, 1, 12, 45, 59);

    it("does not render if no current project", () => {
        const wrapper = getWrapper();
        expect(wrapper.isEmpty()).toBe(true);
    });

    it("renders as expected when currentProject and versionTime are set", () => {
        const wrapper = getWrapper({
            currentProject: {name: "Test Project"} as any,
            currentVersion: {versionNumber: 2} as any,
            versionTime: date
        });

        const spans = wrapper.findAll(".float-right");
        const projectLabel = spans.at(0);
        expect(projectLabel.text()).toBe("Project: Test Project v2");

        const savedLabel = spans.at(1);
        expect(savedLabel.text()).toBe("Last saved 12:45");
        expect(savedLabel.find(CheckIcon).exists()).toBe(true);
    });

    it("renders as expected when currentProject and no versionTime are set", () => {
        const wrapper = getWrapper({
            currentProject: {name: "Test Project"} as any,
            currentVersion: {versionNumber: 2} as any,
            versionTime: null
        });

        const spans = wrapper.findAll(".float-right");
        expect(spans.length).toBe(1);
        const projectLabel = spans.at(0);
        expect(projectLabel.text()).toBe("Project: Test Project v2");
    });
});

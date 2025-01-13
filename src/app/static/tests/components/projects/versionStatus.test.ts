import Vuex from 'vuex';
import VersionStatus from "../../../src/components/projects/VersionStatus.vue";
import {ProjectsState} from "../../../src/store/projects/projects";
import {mockProjectsState} from "../../mocks";
import VueFeather from "vue-feather";
import registerTranslations from "../../../src/store/translations/registerTranslations";
import {emptyState} from "../../../src/root";
import {expectTranslated, shallowMountWithTranslate} from "../../testHelpers";

describe("Version status component", () => {
    const getWrapper = (projectsState: Partial<ProjectsState> = {}) => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                projects: {
                    namespaced: true,
                    state: mockProjectsState(projectsState),
                }
            }
        });
        registerTranslations(store);
        return shallowMountWithTranslate(VersionStatus, store, {global: {plugins: [store]}});
    };
    const date = new Date(`2020-09-01T12:45:59Z`);

    it("does not render if no current project", () => {
        const wrapper = getWrapper();
        // just empty element if v-if isn't true
        expect(wrapper.html()).toBe("<!--v-if-->");
    });

    it("renders as expected when currentProject and versionTime are set", async () => {
        const wrapper = getWrapper({
            currentProject: {name: "Test Project"} as any,
            currentVersion: {versionNumber: 2} as any,
            versionTime: date
        });
        const store = (wrapper.vm as any).$store;

        const spans = wrapper.findAll(".float-end");
        const projectLabel = spans[0];
        await expectTranslated(projectLabel, "Project: Test Project v2", "Projet: Test Project v2",
            "Projeto: Test Project v2", store);

        const savedLabel = spans[1];
        await expectTranslated(savedLabel, "Last saved 12:45", "Dernier enregistré 12:45",
            "Último projeto guardada 12:45", store);
        const feather = savedLabel.findComponent(VueFeather)
        expect(feather.exists()).toBe(true);
        expect(feather.props("type")).toBe("check");
    });

    it("renders as expected when currentProject and no versionTime are set", async () => {
        const wrapper = getWrapper({
            currentProject: {name: "Test Project"} as any,
            currentVersion: {versionNumber: 2} as any,
            versionTime: null
        });
        const store = (wrapper.vm as any).$store;

        const spans = wrapper.findAll(".float-end");
        expect(spans.length).toBe(1);
        const projectLabel = spans[0];
        await expectTranslated(projectLabel, "Project: Test Project v2", "Projet: Test Project v2",
            "Projeto: Test Project v2", store);
    });
});

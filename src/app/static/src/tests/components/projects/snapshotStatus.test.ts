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

    it("does not render if no version time", () => {
        const wrapper = getWrapper();
        expect(wrapper.isEmpty()).toBe(true);
    });

    it("renders as expected when versionTime is set", () => {
        const wrapper = getWrapper({versionTime: date});

        expect(wrapper.text()).toBe("Last saved 12:45");
        expect(wrapper.find(CheckIcon).exists()).toBe(true);
    });
});

import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vuex from 'vuex';
import {mockModelRunState} from "../../mocks";
import DownloadResults from "../../../app/components/downloadResults/DownloadResults.vue";
import {expectTranslatedText} from "../../testHelpers";

const localVue = createLocalVue();

describe("Download Results component", () => {

    const store = new Vuex.Store({
        modules: {
            modelRun: {
                namespaced: true,
                state: mockModelRunState({modelRunId: "testId"})
            }
        }
    });

    it("renders header", () => {
        const wrapper = shallowMount(DownloadResults, {store, localVue});
        expectTranslatedText(wrapper.find("h4"), "Export model outputs for Spectrum")
    });

    it("renders links", () => {
        const wrapper = shallowMount(DownloadResults, {store, localVue});
        const links = wrapper.findAll("a");

        expect(links.length).toBe(2);
        expect(links.at(0).attributes().href).toEqual("/download/spectrum/testId");
        expectTranslatedText(links.at(0), "Export");
        expect(links.at(1).attributes().href).toEqual("/download/summary/testId");
        expectTranslatedText(links.at(1), "Download");
    });
});
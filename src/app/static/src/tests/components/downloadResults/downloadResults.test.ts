import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import {mockModelRunState} from "../../mocks";
import DownloadResults from "../../../app/components/downloadResults/DownloadResults.vue";

const localVue = createLocalVue();
;

describe("Download Results component", () => {

    const createStore = () => {

        return new Vuex.Store({
            modules: {
                modelRun: {
                    namespaced: true,
                    state: mockModelRunState({ modelRunId: "testId" })
                }
            }
        })
    };

    it("renders as expected", () => {
        const store = createStore();
        const wrapper = shallowMount(DownloadResults, {store, localVue});
        const links = wrapper.findAll("a");

        expect(links.length).toBe(2);
        expect(links.at(0).attributes().href).toEqual("/download/spectrum/testId");
        expect(links.at(1).attributes().href).toEqual("/download/summary/testId");
    });
});
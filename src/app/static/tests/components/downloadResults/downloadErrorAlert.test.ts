import Vuex from "vuex";
import { emptyState } from "../../../src/root";
import { mockDownloadResultsState } from "../../mocks";
import { mount } from "@vue/test-utils";
import DownloadErrorAlert from "../../../src/components/downloadResults/DownloadErrorAlert.vue";
import { DownloadResultsState } from "../../../src/store/downloadResults/downloadResults";
import { DownloadType } from "../../../src/store/downloadResults/downloadConfig";

describe("Download Error Alert", () => {
    const getWrapper = (downloadState: Partial<DownloadResultsState> = {}) => {
        const store = new Vuex.Store({
            state: emptyState(),
            modules: {
                downloadResults: {
                    namespaced: true,
                    state: mockDownloadResultsState(downloadState)
                }
            }
        });
        return mount(DownloadErrorAlert, {
            global: { plugins: [store] }
        });
    };

    it("isn't visible if no errors", () => {
        const wrapper = getWrapper();
        expect(wrapper.html()).toBe("<!--v-if-->");
    });

    it("renders as expected when there are errors", () => {
        const summaryErr = "summary error";
        const comparisonErr = "comparison error";
        const wrapper = getWrapper({
            [DownloadType.SUMMARY]: { downloadError: { detail: summaryErr } } as any,
            [DownloadType.COMPARISON]: { downloadError: { detail: comparisonErr } } as any
        });
        expect(wrapper.text()).toContain(`Error while generating ${DownloadType.SUMMARY} report`);
        expect(wrapper.text()).toContain(summaryErr);
        expect(wrapper.text()).toContain(`Error while generating ${DownloadType.COMPARISON} report`);
        expect(wrapper.text()).toContain(comparisonErr);
    });
});

import { shallowMount } from "@vue/test-utils";
import LoadingTab from "../../../app/components/modelOutput/LoadingTab.vue";
import LoadingSpinner from "../../../app/components/LoadingSpinner.vue";

describe("Loading tab tests", () => {
    const getWrapper = (loading: boolean) => {
        return shallowMount(LoadingTab, {
            props: { loading }
        });
    };

    it("hidden when not loading", () => {
        const wrapper = getWrapper(false);
        expect(wrapper.isVisible()).toBe(false);
    });

    it("renders as expected when loading", () => {
        const wrapper = getWrapper(true);
        const loadingOverlay = wrapper.find(".loading");
        expect(loadingOverlay.isVisible()).toBe(true);
        const plotSize = loadingOverlay.find(".plot-size");
        expect(plotSize.exists()).toBe(true);
        const loadingSpinner = plotSize.findComponent(LoadingSpinner);
        expect(loadingSpinner.exists()).toBe(true);
        expect(loadingSpinner.props("size")).toBe("lg");
    });
});
import {flushPromises, mount} from "@vue/test-utils";
import {defineComponent, h} from "vue";
import {lazyStep} from "../../app/components/lazySteps";
import StepLoading from "../../app/components/StepLoading.vue";
import StepLoadError from "../../app/components/StepLoadError.vue";

const translate = {mounted: () => {}};

const Loaded = defineComponent({render: () => h("div", {id: "loaded"}, "loaded")});

// An async component has no root element until it has loaded, so mount it inside a parent
// Vue reports a failed load to the app's error handler. Without one it calls console.error, which
// throws in our tests (setup.ts).
const mountStep = (loader: () => Promise<any>, errorHandler = vi.fn()) => {
    const Step = lazyStep(loader);
    const Host = defineComponent({render: () => h("div", [h(Step)])});
    return mount(Host, {global: {directives: {translate}, config: {errorHandler}}});
};

describe("lazyStep", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("shows nothing for the first 200ms, then the loading component, then the step", async () => {
        let resolve: (c: any) => void = () => {};
        const wrapper = mountStep(() => new Promise(r => resolve = r));
        expect(wrapper.findComponent(StepLoading).exists()).toBe(false);

        await vi.advanceTimersByTimeAsync(250);
        expect(wrapper.findComponent(StepLoading).exists()).toBe(true);

        resolve(Loaded);
        await flushPromises();
        expect(wrapper.find("#loaded").exists()).toBe(true);
        expect(wrapper.findComponent(StepLoading).exists()).toBe(false);
    });

    it("shows no loading component when the file is already loaded", async () => {
        const wrapper = mountStep(() => Promise.resolve(Loaded));
        await flushPromises();
        expect(wrapper.find("#loaded").exists()).toBe(true);
        expect(wrapper.findComponent(StepLoading).exists()).toBe(false);
    });

    it("retries once after a failure", async () => {
        const loader = vi.fn()
            .mockRejectedValueOnce(new Error("network"))
            .mockResolvedValueOnce(Loaded);
        const wrapper = mountStep(loader);
        await flushPromises();
        expect(loader).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(1000);
        await flushPromises();
        expect(loader).toHaveBeenCalledTimes(2);
        expect(wrapper.find("#loaded").exists()).toBe(true);
        expect(wrapper.findComponent(StepLoadError).exists()).toBe(false);
    });

    it("shows the error component when the retry fails too", async () => {
        const loader = vi.fn().mockRejectedValue(new Error("Failed to fetch dynamically imported module"));
        const errorHandler = vi.fn();
        const wrapper = mountStep(loader, errorHandler);
        await vi.advanceTimersByTimeAsync(1000);
        await flushPromises();
        expect(loader).toHaveBeenCalledTimes(2);
        expect(errorHandler).toHaveBeenCalledTimes(1);
        expect(wrapper.findComponent(StepLoadError).exists()).toBe(true);
        expect(wrapper.find("#loaded").exists()).toBe(false);
    });
});

describe("StepLoadError", () => {
    it("reloads the page when the button is clicked", async () => {
        const reload = vi.fn();
        const original = window.location;
        Object.defineProperty(window, "location", {value: {...original, reload}, configurable: true});
        try {
            const wrapper = mount(StepLoadError, {global: {directives: {translate}}});
            await wrapper.find("button").trigger("click");
            expect(reload).toHaveBeenCalledTimes(1);
        } finally {
            Object.defineProperty(window, "location", {value: original, configurable: true});
        }
    });
});

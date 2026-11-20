import {flushPromises, mount} from "@vue/test-utils";
import {defineComponent, h} from "vue";
import {lazyStep, prefetchStep} from "../../app/components/lazySteps";
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

describe("prefetchStep", () => {
    const setSaveData = (saveData: boolean | undefined) => {
        Object.defineProperty(navigator, "connection", {
            value: saveData === undefined ? undefined : {saveData},
            configurable: true
        });
    };

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        setSaveData(undefined);
    });

    it("loads the step when the browser is idle", async () => {
        const idleCallbacks: Array<() => void> = [];
        vi.stubGlobal("requestIdleCallback", (cb: () => void) => idleCallbacks.push(cb));
        const load2 = vi.fn().mockResolvedValue(undefined);
        const load3 = vi.fn().mockResolvedValue(undefined);

        const done = prefetchStep(2, {2: load2, 3: load3});
        await flushPromises();
        expect(load2).not.toHaveBeenCalled(); // waiting for idle

        idleCallbacks.shift()!();
        await done;
        expect(load2).toHaveBeenCalledTimes(1);
        expect(load3).not.toHaveBeenCalled(); // only the step that we asked for
    });

    it("falls back to a timeout when there is no requestIdleCallback (Safari)", async () => {
        vi.useFakeTimers();
        vi.stubGlobal("requestIdleCallback", undefined);
        const load = vi.fn().mockResolvedValue(undefined);
        const done = prefetchStep(2, {2: load});
        expect(load).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1000);
        await done;
        expect(load).toHaveBeenCalledTimes(1);
    });

    it("does nothing for a step without a loader (step 1, or after the last step)", async () => {
        vi.stubGlobal("requestIdleCallback", (cb: () => void) => cb());
        const load = vi.fn().mockResolvedValue(undefined);
        await prefetchStep(1, {2: load});
        await prefetchStep(8, {2: load});
        expect(load).not.toHaveBeenCalled();
    });

    it("loads nothing when the user has asked to save data", async () => {
        vi.stubGlobal("requestIdleCallback", (cb: () => void) => cb());
        setSaveData(true);
        const load = vi.fn().mockResolvedValue(undefined);
        await prefetchStep(2, {2: load});
        expect(load).not.toHaveBeenCalled();
    });

    it("does not throw when the load fails", async () => {
        vi.stubGlobal("requestIdleCallback", (cb: () => void) => cb());
        const load = vi.fn().mockRejectedValue(new Error("404"));
        await expect(prefetchStep(2, {2: load})).resolves.toBeUndefined();
        expect(load).toHaveBeenCalledTimes(1);
    });
});

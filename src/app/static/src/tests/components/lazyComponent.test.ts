import {flushPromises, mount} from "@vue/test-utils";
import {defineComponent, h, nextTick} from "vue";
import {lazyComponent} from "../../app/components/lazyComponent";
import LoadingSpinner from "../../app/components/LoadingSpinner.vue";

describe("lazyComponent", () => {

    const Child = defineComponent({
        props: {text: {type: String, required: true}},
        render() {
            return h("p", {id: "child"}, this.text);
        }
    });

    const mountParent = (loader: () => Promise<any>) => {
        const LazyChild = lazyComponent(loader);
        return mount(defineComponent({
            render: () => h(LazyChild, {text: "hello"})
        }));
    };

    afterEach(() => {
        vi.useRealTimers();
    });

    it("renders the component with its props when the file has loaded", async () => {
        const wrapper = mountParent(() => Promise.resolve(Child));
        await flushPromises();
        expect(wrapper.find("#child").text()).toBe("hello");
        expect(wrapper.findComponent(LoadingSpinner).exists()).toBe(false);
    });

    it("shows a spinner only after 200 ms, until the file has loaded", async () => {
        vi.useFakeTimers();
        let resolveLoader: (component: any) => void = () => {};
        const wrapper = mountParent(() => new Promise(resolve => {
            resolveLoader = resolve;
        }));

        await nextTick();
        expect(wrapper.findComponent(LoadingSpinner).exists()).toBe(false);

        vi.advanceTimersByTime(200);
        await nextTick();
        expect(wrapper.findComponent(LoadingSpinner).exists()).toBe(true);
        expect(wrapper.findComponent(LoadingSpinner).props("size")).toBe("sm");
        expect(wrapper.find("#child").exists()).toBe(false);

        resolveLoader(Child);
        await vi.runAllTimersAsync();
        await nextTick();
        expect(wrapper.findComponent(LoadingSpinner).exists()).toBe(false);
        expect(wrapper.find("#child").text()).toBe("hello");
    });
});

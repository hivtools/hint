import { VueWrapper, mount } from "@vue/test-utils";
import TreeSelect from "../../app/components/TreeSelect.vue";
import Treeselect from "vue3-treeselect";

describe("Treeselect component", () => {

    const getWrapper = () => {
        return mount(TreeSelect, {
            props: {
                options: [{id: "1", label: "option1"}, {id: "2", label: "option2"}],
                modelValue: "1",
                multiple: false,
                clearable: false
            }
        })
    }

    const callWatcher = async (wrapper: VueWrapper<any>, watcher: string) => {
        await wrapper.vm.$options.watch[watcher].handler.call(wrapper.vm);
    }

    const getKey = (wrapper: VueWrapper<any>) => {
        return wrapper.vm.$data.reRender
    }

    it("updates key when model value changes", async () => {
        const wrapper = getWrapper();
        expect(getKey(wrapper)).toBe(false);
        await callWatcher(wrapper, "modelValue");
        expect(getKey(wrapper)).toBe(true);
    });

    it("does not update key when user inputs something", async () => {
        const wrapper = getWrapper();
        const treeSelect = wrapper.findComponent(Treeselect);
        expect(getKey(wrapper)).toBe(false);
        await treeSelect.vm.$emit("update:model-value", "2")
        await callWatcher(wrapper, "modelValue");
        expect(getKey(wrapper)).toBe(false);
    });

    it("updates key if options and model values change", async () => {
        const wrapper = getWrapper();
        const treeSelect = wrapper.findComponent(Treeselect);
        expect(getKey(wrapper)).toBe(false);
        await treeSelect.vm.$emit("update:model-value", "2")
        await callWatcher(wrapper, "options");
        await callWatcher(wrapper, "modelValue");
        expect(getKey(wrapper)).toBe(true);
    });
});

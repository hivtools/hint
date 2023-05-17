import {shallowMount} from '@vue/test-utils';
import FilterSelect from "../../../app/components/plots/FilterSelect.vue";
import TreeSelect from "vue3-treeselect";
import Vuex from "vuex";
import {emptyState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";
import {HelpCircleIcon} from "vue-feather";

describe("FilterSelect component", () => {
    const testOptions = [{id: "1", label: "one"}, {id: "2", label: "two"}];

    const store = new Vuex.Store({
        state: emptyState()
    });
    registerTranslations(store);

    it("renders label", () => {
        const wrapper = shallowMount(FilterSelect, {store, props: {options: testOptions, label: "testLabel"}});
        expect(wrapper.findComponent("label").text()).toBe("testLabel");
    });

    it("renders tooltip if any options have descriptions", () => {
        const tooltip = jest.fn();
        const wrapper = shallowMount(FilterSelect, {
            store,
            props: {
                options: [
                    ...testOptions,
                    {id: "3", label: "three", description: "Third option"},
                    {id: "4", label: "four", description: "Fourth option"}
                ]
            },
            directives: {
                tooltip
            }
        });
        expect(wrapper.findComponent(HelpCircleIcon).exists()).toBe(true);
        expect(tooltip.mock.calls[0][1].value.content).toBe("<dl><dt>three</dt><dd>Third option</dd><dt>four</dt><dd>Fourth option</dd></dl>");
    });

    it("does not render tooltip unless any options have descriptions", () => {
        const wrapper = shallowMount(FilterSelect, {store, props: {options: testOptions, label: "testLabel"}});
        expect(wrapper.findComponent("span.filter-select").exists()).toBe(false);
    });

    it("renders TreeSelect", () => {
        const wrapper = shallowMount(FilterSelect, {
            store,
            props:
                {
                    label: "label",
                    options: testOptions,
                    value: "2",
                    disabled: false
                }
        });

        const treeSelect = wrapper.findComponent(TreeSelect);
        expect(treeSelect.props("value")).toBe("2");
        expect(treeSelect.props("disabled")).toBe(false);
        expect(treeSelect.props("options")).toStrictEqual(testOptions);

        expect(treeSelect.props("clearable")).toBe(false);
        expect(treeSelect.props("multiple")).toBe(false);

        const label = wrapper.findComponent("label");
        expect(label.classes().indexOf("disabled-label")).toBe(-1);
    });

    it("renders TreeSelect with null value and placeholder if disabled", () => {
        const wrapper = shallowMount(FilterSelect, {
            store,
            props:
                {
                    label: "label",
                    options: testOptions,
                    value: "2",
                    disabled: true
                }
        });

        const treeSelect = wrapper.findComponent(TreeSelect);
        expect(treeSelect.props("value")).toBeNull();
        expect(treeSelect.props("disabled")).toBe(true);
        expect(treeSelect.props("options")).toStrictEqual(testOptions);
        expect(treeSelect.props("placeholder")).toEqual("Not used");

        expect(treeSelect.props("clearable")).toBe(false);
        expect(treeSelect.props("multiple")).toBe(false);

        const label = wrapper.findComponent("label");
        expect(label.classes()).toContain("disabled-label");
    });

    it("emits indicator-changed event with indicator", () => {
        const wrapper = shallowMount(FilterSelect, {store, props: {label: "label", options: testOptions}});
        wrapper.findAllComponents(TreeSelect)[0].vm.$emit("input", "2");
        expect(wrapper.emitted("input")![0][0]).toBe("2");
    });

    it("does not emit input event if disabled", () => {
        const wrapper = shallowMount(FilterSelect, {
            store,
            props: {label: "label", options: testOptions, disabled: true}
        });
        wrapper.findAllComponents(TreeSelect)[0].vm.$emit("input", "2");
        expect(wrapper.emitted("input")!).toBeUndefined();
    });

    it("emits select event with added value when multi-select", () => {
        const wrapper = shallowMount(FilterSelect, {
            store,
            props: {label: "Label", options: testOptions, multiple: true, value: []}
        });
        wrapper.findAllComponents(TreeSelect)[0].vm.$emit("select", {id: "1", label: "one"});
        expect(wrapper.emitted("select")![0][0]).toStrictEqual([{id: "1", label: "one"}]);

        wrapper.findAllComponents(TreeSelect)[0].vm.$emit("select", {id: "2", label: "two"});
        expect(wrapper.emitted("select")![1][0]).toStrictEqual([{id: "1", label: "one"}, {id: "2", label: "two"}]);
    });

    it("emits select event with replaced value when not multi-select", () => {
        const wrapper = shallowMount(FilterSelect, {
            store,
            props: {label: "Label", options: testOptions, multiple: false}
        });
        wrapper.findAllComponents(TreeSelect)[0].vm.$emit("select", {id: "1", label: "one"});
        expect(wrapper.emitted("select")![0][0]).toStrictEqual([{id: "1", label: "one"}]);

        wrapper.findAllComponents(TreeSelect)[0].vm.$emit("select", {id: "2", label: "two"});
        expect(wrapper.emitted("select")![1][0]).toStrictEqual([{id: "2", label: "two"}]);
    });

    it("emits select even when deselect", () => {
        const wrapper = shallowMount(FilterSelect, {
            store,
            props: {label: "Label", options: testOptions, multiple: true, value: ["1", "2"]}
        });

        wrapper.findAllComponents(TreeSelect)[0].vm.$emit("deselect", {id: "1", label: "one"});
        expect(wrapper.emitted("select")![0][0]).toStrictEqual([{id: "2", label: "two"}]);
    });
});
import {shallowMount} from '@vue/test-utils';
import FilterSelect from "../../../app/components/plots/FilterSelect.vue";
import TreeSelect from '@riophae/vue-treeselect';
import Vuex from "vuex";
import {emptyState} from "../../../app/root";
import registerTranslations from "../../../app/store/translations/registerTranslations";

describe("FilterSelect component", () => {
    const testOptions = [{id: "1", label: "one"}, {id: "2", label: "two"}];

    const store = new Vuex.Store({
        state: emptyState()
    });
    registerTranslations(store);

    it("renders label", () => {
        const wrapper = shallowMount(FilterSelect, {store, propsData: {options: testOptions, label: "testLabel"}});
        expect(wrapper.find("label").text()).toBe("testLabel");
    });

    it("renders TreeSelect", () => {
        const wrapper = shallowMount(FilterSelect, {
            store,
            propsData:
                {
                    label: "label",
                    options: testOptions,
                    value: "2",
                    disabled: false
                }
        });

        const treeSelect = wrapper.find(TreeSelect);
        expect(treeSelect.props("value")).toBe("2");
        expect(treeSelect.props("disabled")).toBe(false);
        expect(treeSelect.props("options")).toStrictEqual(testOptions);

        expect(treeSelect.props("clearable")).toBe(false);
        expect(treeSelect.props("multiple")).toBe(false);

        const label = wrapper.find("label");
        expect(label.classes().indexOf("disabled-label")).toBe(-1);
    });

    it("does not render TreeSelect if disabled", () => {
        const wrapper = shallowMount(FilterSelect, {
            store,
            propsData:
                {
                    label: "label",
                    options: testOptions,
                    value: "2",
                    disabled: true
                }
        });

        const treeSelect = wrapper.findAll(TreeSelect);
        expect(treeSelect.length).toBe(0);
    });

    it("emits indicator-changed event with indicator", () => {
        const wrapper = shallowMount(FilterSelect, {store, propsData: {label: "label", options: testOptions}});
        wrapper.findAll(TreeSelect).at(0).vm.$emit("input", "2");
        expect(wrapper.emitted("input")[0][0]).toBe("2");
    });

    it("emits select event with added value when multi-select", () => {
        const wrapper = shallowMount(FilterSelect, {
            store,
            propsData: {label: "Label", options: testOptions, multiple: true, value: []}
        });
        wrapper.findAll(TreeSelect).at(0).vm.$emit("select", {id: "1", label: "one"});
        expect(wrapper.emitted("select")[0][0]).toStrictEqual([{id: "1", label: "one"}]);

        wrapper.findAll(TreeSelect).at(0).vm.$emit("select", {id: "2", label: "two"});
        expect(wrapper.emitted("select")[1][0]).toStrictEqual([{id: "1", label: "one"}, {id: "2", label: "two"}]);
    });

    it("emits select event with replaced value when not multi-select", () => {
        const wrapper = shallowMount(FilterSelect, {
            store,
            propsData: {label: "Label", options: testOptions, multiple: false}
        });
        wrapper.findAll(TreeSelect).at(0).vm.$emit("select", {id: "1", label: "one"});
        expect(wrapper.emitted("select")[0][0]).toStrictEqual([{id: "1", label: "one"}]);

        wrapper.findAll(TreeSelect).at(0).vm.$emit("select", {id: "2", label: "two"});
        expect(wrapper.emitted("select")[1][0]).toStrictEqual([{id: "2", label: "two"}]);
    });

    it("emits select even when deselect", () => {
        const wrapper = shallowMount(FilterSelect, {
            store,
            propsData: {label: "Label", options: testOptions, multiple: true, value: ["1", "2"]}
        });

        wrapper.findAll(TreeSelect).at(0).vm.$emit("deselect", {id: "1", label: "one"});
        expect(wrapper.emitted("select")[0][0]).toStrictEqual([{id: "2", label: "two"}]);
    });
});
import {shallowMount} from '@vue/test-utils';
import FilterSelect from "../../../app/components/plots/FilterSelect.vue";
import TreeSelect from '@riophae/vue-treeselect';

describe("FilterSelect component", () => {
    const testOptions = [{id: "1", label: "one"}, {id: "2", label: "two"}];

    it ("renders label", () => {
        const wrapper = shallowMount(FilterSelect, {propsData: {label: "testLabel"}});

        expect(wrapper.find("label").text()).toBe("testLabel");
    });

    it ("renders TreeSelect", () => {
        const wrapper = shallowMount(FilterSelect, {propsData:
                {
                    options: testOptions,
                    value: "2",
                    disabled: false
                }});

        const treeSelect = wrapper.find(TreeSelect);
        expect(treeSelect.props("value")).toBe("2");
        expect(treeSelect.props("disabled")).toBe(false);
        expect(treeSelect.props("options")).toStrictEqual(testOptions);

        expect(treeSelect.props("clearable")).toBe(false);
        expect(treeSelect.props("multiple")).toBe(false);

        const label = wrapper.find("label");
        expect(label.classes().indexOf("disabled-label")).toBe(-1);
    });

    it ("renders TreeSelect with null value and placeholder if disabled", () => {
        const wrapper = shallowMount(FilterSelect, {propsData:
                {
                    options: testOptions,
                    value: "2",
                    disabled: true
                }});

        const treeSelect = wrapper.find(TreeSelect);
        expect(treeSelect.props("value")).toBeNull();
        expect(treeSelect.props("disabled")).toBe(true);
        expect(treeSelect.props("options")).toStrictEqual(testOptions);
        expect(treeSelect.props("placeholder")).toEqual("Not used");

        expect(treeSelect.props("clearable")).toBe(false);
        expect(treeSelect.props("multiple")).toBe(false);

        const label = wrapper.find("label");
        expect(label.classes()).toContain("disabled-label");
    });

    it("emits input event with value", () => {
        const wrapper = shallowMount(FilterSelect, {propsData: { options: testOptions}});
        wrapper.findAll(TreeSelect).at(0).vm.$emit("input", "2");
        expect(wrapper.emitted("input")[0][0]).toBe("2");
    });

    it("does not emit input event if disabled", () => {
        const wrapper = shallowMount(FilterSelect, {propsData: { options: testOptions, disabled: true}});
        wrapper.findAll(TreeSelect).at(0).vm.$emit("input", "2");
        expect(wrapper.emitted("input")).toBeUndefined();
    });

    it("emits select event with added value when multi-select", () => {
        const wrapper = shallowMount(FilterSelect, {propsData: { options: testOptions, multiple: true, value: []}});
        wrapper.findAll(TreeSelect).at(0).vm.$emit("select", {id: "1", label: "one"});
        expect(wrapper.emitted("select")[0][0]).toStrictEqual([{id: "1", label: "one"}]);

        wrapper.findAll(TreeSelect).at(0).vm.$emit("select", {id: "2", label: "two"});
        expect(wrapper.emitted("select")[1][0]).toStrictEqual([{id: "1", label: "one"}, {id: "2", label: "two"}]);
    });

    it("emits select event with replaced value when not multi-select", () => {
        const wrapper = shallowMount(FilterSelect, {propsData: { options: testOptions, multiple: false}});
        wrapper.findAll(TreeSelect).at(0).vm.$emit("select", {id: "1", label: "one"});
        expect(wrapper.emitted("select")[0][0]).toStrictEqual([{id: "1", label: "one"}]);

        wrapper.findAll(TreeSelect).at(0).vm.$emit("select", {id: "2", label: "two"});
        expect(wrapper.emitted("select")[1][0]).toStrictEqual([{id: "2", label: "two"}]);
    });

    it("emits select even when deselect", ()=> {
        const wrapper = shallowMount(FilterSelect, {propsData: { options: testOptions, multiple: true,
                value: [{id: "1", label: "one"}, {id: "2", label: "two"}]}});

        wrapper.findAll(TreeSelect).at(0).vm.$emit("deselect", {id: "1", label: "one"});
        expect(wrapper.emitted("select")[0][0]).toStrictEqual([{id: "2", label: "two"}]);
    });
});
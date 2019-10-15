import {shallowMount} from "@vue/test-utils";
import {SelectControl} from "../../../app/components/forms/types";
import TreeSelect from "@riophae/vue-treeselect";
import DynamicFormMultiSelect from "../../../app/components/forms/DynamicFormMultiSelect.vue";

describe('Dynamic form multi-select component', function () {

    const fakeSelect: SelectControl = {
        name: "id_1",
        type: "multiselect",
        required: true,
        options: ["opt1", "opt2"],
        default: "opt2"
    };

    it("renders treeselect", () => {
        const rendered = shallowMount(DynamicFormMultiSelect, {
            propsData: {
                formControl: fakeSelect
            }
        });

        const treeSelect = rendered.find(TreeSelect);
        expect(treeSelect.props("value")).toStrictEqual(["opt2"]);
        expect(treeSelect.props("options")).toStrictEqual(["opt1", "opt2"]);
        expect(treeSelect.props("multiple")).toBe(true);
    });

    it("treeselect is not clearable if formControl is required", () => {
        const rendered = shallowMount(DynamicFormMultiSelect, {
            propsData: {
                formControl: {...fakeSelect, required: true}
            }
        });

        const treeSelect = rendered.find(TreeSelect);
        expect(treeSelect.props("clearable")).toBe(false);
    });

    it("treeselect is clearable if formControl is not required", () => {
        const rendered = shallowMount(DynamicFormMultiSelect, {
            propsData: {
                formControl: {...fakeSelect, required: false}
            }
        });

        const treeSelect = rendered.find(TreeSelect);
        expect(treeSelect.props("clearable")).toBe(true);
    });

    it("initialises hidden input with default value", () => {
        const rendered = shallowMount(DynamicFormMultiSelect, {
            propsData: {
                formControl: fakeSelect
            }
        });

        expect((rendered.find("[name=id_1]").element as HTMLInputElement).value).toBe("opt2");
    });

    it("updates hidden input when new value is selected", () => {
        const rendered = shallowMount(DynamicFormMultiSelect, {
            propsData: {
                formControl: fakeSelect
            }
        });

        rendered.find(TreeSelect).vm.$emit("input", "opt1");
        expect((rendered.find("[name=id_1]").element as HTMLInputElement).value).toBe("opt1");
    });

    it("adds is-valid class if required is false", () => {
        const rendered = shallowMount(DynamicFormMultiSelect, {
            propsData: {
                formControl: {...fakeSelect, default: null, required: false}
            }
        });

        expect(rendered.classes()).toContain("is-valid");
    });

    it("adds is-valid class if value is set", () => {
        const rendered = shallowMount(DynamicFormMultiSelect, {
            propsData: {
                formControl: {...fakeSelect, required: true, default: null}
            }
        });

        rendered.find(TreeSelect).vm.$emit("input", "opt1");
        expect(rendered.classes()).toContain("is-valid");
    });

    it("adds is-invalid class if value is not set and required is true", () => {
        const rendered = shallowMount(DynamicFormMultiSelect, {
            propsData: {
                formControl: {...fakeSelect, default: null, required: true}
            }
        });

        expect(rendered.classes()).toContain("is-invalid");
    });

});
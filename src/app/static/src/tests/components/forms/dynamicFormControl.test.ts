import {mount, shallowMount} from "@vue/test-utils";
import DynamicFormControl from "../../../app/components/forms/DynamicFormControl.vue";
import {NumberControl, SelectControl} from "../../../app/components/forms/fakeFormMeta";
import DynamicFormNumberInput from "../../../app/components/forms/DynamicFormNumberInput.vue";
import DynamicFormSelect from "../../../app/components/forms/DynamicFormSelect.vue";
import DynamicFormMultiSelect from "../../../app/components/forms/DynamicFormMultiSelect.vue";

describe('Dynamic form control component', function () {

    const fakeNumber: NumberControl = {
        label: "Number label",
        name: "id_1",
        type: "number",
        required: true
    };

    const fakeSelect: SelectControl = {
        name: "id_2",
        type: "select",
        required: true,
        options: ["opt1", "opt2"]
    };

    const fakeMultiSelect: SelectControl = {
        name: "id_3",
        type: "multiselect",
        required: true,
        options: ["opt1", "opt2"]
    };

    it("renders label if it exists", () => {
        const rendered = shallowMount(DynamicFormControl, {
            propsData: {
                formControl: fakeNumber
            }
        });
        expect(rendered.find("label").text()).toBe("Number label");
    });

    it("does not renders label if it does not exist", () => {
        const rendered = shallowMount(DynamicFormControl, {
            propsData: {
                formControl: fakeSelect
            }
        });
        expect(rendered.findAll("label").length).toBe(0);
    });

    it("col has given width", () => {
        const rendered = mount(DynamicFormControl, {
            propsData: {
                formControl: fakeNumber,
                colWidth: "3"
            }
        });
        expect(rendered.element.classList).toContain("col-md-3");
    });

    it("renders number input when formControl type is number", () => {
        const rendered = shallowMount(DynamicFormControl, {
            propsData: {
                formControl: fakeNumber
            }
        });

        expect(rendered.find(DynamicFormNumberInput)).toBeDefined();
        expect(rendered.find(DynamicFormNumberInput).props("formControl")).toStrictEqual(fakeNumber);
    });

    it("renders select when formControl type is select", () => {
        const rendered = shallowMount(DynamicFormControl, {
            propsData: {
                formControl: fakeSelect
            }
        });

        expect(rendered.find(DynamicFormSelect)).toBeDefined();
        expect(rendered.find(DynamicFormSelect).props("formControl")).toStrictEqual(fakeSelect);
    });

    it("renders multi-select when formControl type is multiselect", () => {
        const rendered = shallowMount(DynamicFormControl, {
            propsData: {
                formControl: fakeMultiSelect
            }
        });

        expect(rendered.find(DynamicFormMultiSelect)).toBeDefined();
        expect(rendered.find(DynamicFormMultiSelect).props("formControl")).toStrictEqual(fakeMultiSelect);
    });

});
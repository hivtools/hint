import {mount} from "@vue/test-utils";
import {SelectControl} from "../../../app/components/forms/types";
import DynamicFormSelect from "../../../app/components/forms/DynamicFormSelect.vue";

describe('Dynamic form select component', function () {

    const fakeSelect: SelectControl = {
        name: "id_2",
        type: "select",
        required: true,
        options: [{id: "opt1", label: "option 1"}, {id: "opt2", label: "option2"}],
    };

    it("renders options", () => {
        const rendered = mount(DynamicFormSelect, {
            propsData: {
                formControl: fakeSelect
            }
        });
        const options = rendered.findAll("option");
        expect(options.length).toBe(3);
        expect((options.at(1).element as HTMLSelectElement).value).toBe("opt1");
        expect(options.at(1).text()).toBe("option 1");
    });

    it("value is selected if present", () => {
        const rendered = mount(DynamicFormSelect, {
            propsData: {
                formControl: {...fakeSelect, value: "opt2"}
            }
        });

        const select = rendered.find("select");
        expect((select.element as HTMLSelectElement).value).toBe("opt2");
    });

    it("emits change event with updated formControl when underlying select is changed", () => {
        const rendered = mount(DynamicFormSelect, {
            propsData: {
                formControl: {...fakeSelect}
            }
        });

        rendered.find("select").trigger("change");
        expect(rendered.emitted("change")[0][0]).toStrictEqual({...fakeSelect, value: ""});
    });

    it("default message is selected if no value present", () => {
        const rendered = mount(DynamicFormSelect, {
            propsData: {
                formControl: fakeSelect
            }
        });

        const select = rendered.find("select");
        expect((select.element as HTMLSelectElement).value).toBe("");
    });

    it("is required if formControl.required is true", () => {
        const rendered = mount(DynamicFormSelect, {
            propsData: {
                formControl: {...fakeSelect, required: true}
            }
        });

        const select = rendered.find("select");
        expect((select.element as HTMLSelectElement).required).toBe(true);
    });

    it("is not required if formControl.required is false", () => {
        const rendered = mount(DynamicFormSelect, {
            propsData: {
                formControl: {...fakeSelect, required: false}
            }
        });

        const select = rendered.find("select");
        expect((select.element as HTMLSelectElement).required).toBe(false);
    });

});
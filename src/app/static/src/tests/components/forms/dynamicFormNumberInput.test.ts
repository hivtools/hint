import {mount} from "@vue/test-utils";
import {NumberControl} from "../../../app/components/forms/types";
import DynamicFormNumberInput from "../../../app/components/forms/DynamicFormNumberInput.vue";

describe('Dynamic form number input component', function () {

    const fakeNumber: NumberControl = {
        name: "id_1",
        type: "number",
        required: true
    };

    it("renders number input with value", () => {
        const rendered = mount(DynamicFormNumberInput, {
            propsData: {
                formControl: {...fakeNumber, value: 1}
            }
        });

        const inputElement = rendered.find("input").element as HTMLInputElement;
        expect(inputElement.name).toBe("id_1");
        expect(inputElement.type).toBe("number");
        expect(inputElement.min).toBe("");
        expect(inputElement.max).toBe("");
        expect(inputElement.value).toBe("1");
    });

    it("renders number input without value", () => {
        const rendered = mount(DynamicFormNumberInput, {
            propsData: {
                formControl: fakeNumber
            }
        });

        const inputElement = rendered.find("input").element as HTMLInputElement;
        expect(inputElement.value).toBe("");
    });

    it("is required if formControl.required is true", () => {
        const rendered = mount(DynamicFormNumberInput, {
            propsData: {
                formControl: {...fakeNumber, required: true}
            }
        });

        const inputElement = rendered.find("input").element as HTMLInputElement;
        expect(inputElement.required).toBe(true);
    });


    it("is not required if formControl.required is false", () => {
        const rendered = mount(DynamicFormNumberInput, {
            propsData: {
                formControl: {...fakeNumber, required: false}
            }
        });

        const inputElement = rendered.find("input").element as HTMLInputElement;
        expect(inputElement.required).toBe(false);
    });

    it("renders number input with min and max", () => {
        const rendered = mount(DynamicFormNumberInput, {
            propsData: {
                formControl: {...fakeNumber, min: 1, max: 5}
            }
        });

        const inputElement = rendered.find("input").element as HTMLInputElement;
        expect(inputElement.min).toBe("1");
        expect(inputElement.max).toBe("5");
    });

    it("emits change to formControl when underlying input is updated", () => {
        const control = {...fakeNumber};
        const rendered = mount(DynamicFormNumberInput, {
            propsData: {
                formControl: control
            }
        });

        rendered.find("input").setValue(123);
        expect(rendered.emitted("change")[0][0]).toStrictEqual({...control, value: 123})
    });

});
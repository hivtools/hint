import {mount} from "@vue/test-utils";
import {NumberControl} from "../../../app/components/forms/fakeFormMeta";
import DynamicFormNumberInput from "../../../app/components/forms/DynamicFormNumberInput.vue";

describe('Dynamic form number input component', function () {

    const fakeNumber: NumberControl = {
        name: "id_1",
        type: "number",
        required: true,
        default: 1
    };

    it("renders number input", () => {
        const rendered = mount(DynamicFormNumberInput, {
            propsData: {
                formControl: fakeNumber
            }
        });

        const inputElement = rendered.find("input").element as HTMLInputElement;
        expect(inputElement.name).toBe("id_1");
        expect(inputElement.type).toBe("number");
        expect(inputElement.min).toBe("");
        expect(inputElement.max).toBe("");
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

});
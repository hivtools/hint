// The types of @reside-ic/vue-next-dynamic-form. tsconfig.app.json uses this file in place of the
// index.d.ts of the package.
//
// The index.d.ts of the package imports the .vue source file of the form. vue-tsc then type checks
// the .vue source files of the package with our settings, and gives errors in them. skipLibCheck does
// not stop this, because it applies only to .d.ts files. This file has the same exports, but it does
// not import the .vue files.
import type {DefineComponent} from "vue";
import type {
    DynamicControlGroup,
    DynamicControlSection,
    DynamicFormMeta,
    MultiSelectControl,
    NumberControl,
    Option,
    SelectControl
} from "@reside-ic/vue-next-dynamic-form/src/types";

export type * from "@reside-ic/vue-next-dynamic-form/src/types";

// The props and the events of src/DynamicForm.vue in the package.
export declare const DynamicForm: DefineComponent<
    {
        id?: string,
        submitText?: string,
        includeSubmitButton?: boolean,
        formMeta?: DynamicFormMeta,
        requiredText?: string,
        selectText?: string,
        readonly?: boolean
    },
    object,
    object,
    object,
    object,
    object,
    object,
    ("validate" | "update:formMeta" | "submit" | "confirm")[]
>

export declare function isControl(object: any): boolean

export declare function isNumberControl(object: any): object is NumberControl

export declare function isSelectControl(object: any): object is SelectControl

export declare function isMultiSelectControl(object: any): object is MultiSelectControl

export declare function isSelectOption(object: any): object is Option

export declare function isDynamicControlGroup(object: any): object is DynamicControlGroup

export declare function isDynamicControlSection(object: any): object is DynamicControlSection

export declare function isDynamicFormMeta(object: any): object is DynamicFormMeta

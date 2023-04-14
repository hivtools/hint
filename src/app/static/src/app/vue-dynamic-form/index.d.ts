// declare module "@reside-ic/vue-dynamic-form" {
// }

// import Vue from "vue";

// export type DynamicControlSection = {
//     label: string
//     description?: string
//     documentation?: string
//     collapsible?: boolean
//     collapsed?: boolean
//     controlGroups: DynamicControlGroup[]
// }

// export type DynamicControlGroup = {
//     label?: string
//     controls: Control[]
// }

// export type Option = {
//     id: string,
//     label: string,
//     children?: Option[]
// }

// export type DynamicControlType = "multiselect" | "select" | "number"
// export type Control = SelectControl | MultiSelectControl | NumberControl

// export type DynamicControl = {
//     name: string,
//     label?: string,
//     type: DynamicControlType
//     required: boolean
//     helpText?: string
//     value?: string | string[] | number | null
// }

// export type SelectControl = DynamicControl & {
//     options: Option[]
//     value?: string | null
//     excludeNullOption?: boolean
// }

// export type MultiSelectControl = DynamicControl & {
//     options: Option[]
//     value?: string[] | string
// }

// export type NumberControl = DynamicControl & {
//     min?: number
//     max?: number
//     value?: number | null
// }

// export type DynamicFormMeta = {
//     controlSections: DynamicControlSection[]
// }

// type Dict<V> = { [k: string]: V }

// export type DynamicFormData = Dict<string | string[] | number | null>

// export declare class DynamicForm extends Vue {
//     formMeta: DynamicFormMeta;
//     includeSubmitButton?: boolean;
//     submitText?: string;
//     id?: string;
//     requiredText?: string;
//     selectText?: string;
// }

// export declare function isControl(object: any): Boolean

// export declare function isNumberControl(object: any): object is NumberControl

// export declare function isSelectControl(object: any): object is SelectControl

// export declare function isMultiSelectControl(object: any): object is MultiSelectControl

// export declare function isSelectOption(object: any): object is Option

// export declare function isDynamicControlGroup(object: any): object is DynamicControlGroup

// export declare function isDynamicControlSection(object: any): object is DynamicControlSection

// export declare function isDynamicFormMeta(object: any): object is DynamicFormMeta

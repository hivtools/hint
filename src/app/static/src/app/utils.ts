import {CustomVue, mapGetters, mapState} from "vuex";
import {NestedFilterOption} from "./generated";
import {Dict} from "./types";

export type ComputedWithType<T> = () => T;

export const mapStateProp = <S, T>(namespace: string, func: (s: S) => T): ComputedWithType<T> => {
    return (mapState<S>(namespace, {prop: (state) => func(state)}) as Dict<ComputedWithType<T>>)["prop"]
};

export const mapStatePropByName = <T>(namespace: string, name: string): ComputedWithType<T> => {
    return mapState(namespace, [name])[name]
};

export const mapStateProps = <S, K extends string>(namespace: string,
                                                  map: Dict<(this: CustomVue, state: S) => any>) => {
    type R = { [key in K]: any }
    return mapState<S>(namespace, map) as R
};

export const mapGetterByName = <T>(namespace: string, name: string): ComputedWithType<T> => {
    return mapGetters(namespace, [name])[name]
};

export const mapGettersByNames = <K extends string>(namespace: string, names: string[]) => {
    type R = { [key in K]: any }
    return mapGetters(namespace, names) as R
};

export const flattenOptions = (filterOptions: NestedFilterOption[]): { [k: string]: NestedFilterOption } => {
    let result = {};
    filterOptions.forEach(r =>
        result = {
            ...result,
            ...flattenOption(r)
        });
    return result;
};

const flattenOption = (filterOption: NestedFilterOption): NestedFilterOption => {
    let result = {} as any;
    result[filterOption.id] = filterOption;
    if (filterOption.options) {
        filterOption.options.forEach(o =>
            result = {
                ...result,
                ...flattenOption(o as NestedFilterOption)
            });

    }
    return result;
};

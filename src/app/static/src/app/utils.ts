import * as CryptoJS from 'crypto-js';
import {ActionMethod, CustomVue, mapActions, mapGetters, mapMutations, mapState} from "vuex";
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

export const mapActionByName = <T>(namespace: string, name: string): ActionMethod => {
    return mapActions(namespace, [name])[name]
};

export const mapActionsByNames = <K extends string>(namespace: string, names: string[]) => {
    type R = { [key in K]: any }
    return mapActions(namespace, names) as R
};

export const mapMutationsByNames = <K extends string>(namespace: string, names: string[]) => {
    type R = { [key in K]: any }
    return mapMutations(namespace, names) as R
};

export const addCheckSum = (data: string): string => {
    const hash = CryptoJS.MD5(data);
    return JSON.stringify([hash.toString(CryptoJS.enc.Base64), data]);
};

export const verifyCheckSum = (content: string): false | any => {
    const result = JSON.parse(content);
    const hash = result[0];
    const data = result[1];
    const valid = CryptoJS.MD5(data).toString(CryptoJS.enc.Base64) === hash;

    return valid && JSON.parse(data);
};

export const freezer = {

    deepFreeze: (data: any): any => {
        if (Array.isArray(data)) {
            return Object.freeze(data.map(d => freezer.deepFreeze(d)))
        }
        if (data != null && typeof data === "object") {
            for (let prop in data) {
                if (data.hasOwnProperty(prop)) {
                    data[prop] = freezer.deepFreeze(data[prop])
                }
            }
            return Object.freeze(data);
        }
        return data;
    }
};

export function addNamespace(namespace: string, types: any) {
    Object.keys(types).forEach(key => {
        if (types.hasOwnProperty(key)) {
            types[key] = `${namespace}/${types[key]}`;
        }
    });
}

export function stripNamespace(name: string) {
    const nameArray = name.split("/");
    if (nameArray.length == 1) {
        return name;
    }
    else {
        return name[1];
    }
}

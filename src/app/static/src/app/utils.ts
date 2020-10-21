import * as CryptoJS from 'crypto-js';
import {ActionMethod, CustomVue, mapActions, mapGetters, mapMutations, mapState, MutationMethod} from "vuex";
import {DatasetResource, Dict, Version} from "./types";
import {Error, FilterOption, NestedFilterOption, Response} from "./generated";
import moment from 'moment';

export type ComputedWithType<T> = () => T;

export const mapStateProp = <S, T>(namespace: string | null, func: (s: S) => T): ComputedWithType<T> => {
    return namespace && (mapState<S>(namespace, {prop: (state) => func(state)}) as Dict<ComputedWithType<T>>)["prop"]
        || (mapState<S>({prop: (state) => func(state)}) as Dict<ComputedWithType<T>>)["prop"]
};

export const mapStatePropByName = <T>(namespace: string | null, name: string): ComputedWithType<T> => {
    return (namespace && mapState(namespace, [name])[name]) || mapState([name])[name]
};

export const mapStateProps = <S, K extends string>(namespace: string,
                                                   map: Dict<(this: CustomVue, state: S) => any>) => {
    type R = { [key in K]: any }
    return mapState<S>(namespace, map) as R
};

export const mapGetterByName = <T>(namespace: string | null, name: string): ComputedWithType<T> => {
    return (namespace && mapGetters(namespace, [name])[name]) || mapGetters([name])[name]
}

export const mapGettersByNames = <K extends string>(namespace: string, names: string[]) => {
    type R = { [key in K]: any }
    return mapGetters(namespace, names) as R
};

export const mapActionByName = <T>(namespace: string | null, name: string): ActionMethod => {
    return (!!namespace && mapActions(namespace, [name])[name]) || mapActions([name])[name]
};

export const mapActionsByNames = <K extends string>(namespace: string | null, names: string[]) => {
    type R = { [key in K]: any }
    return (!!namespace && mapActions(namespace, names) || mapActions(names)) as R
};

export const mapMutationsByNames = <K extends string>(namespace: string, names: string[]) => {
    type R = { [key in K]: any }
    return mapMutations(namespace, names) as R
};

export const mapMutationByName = <T>(namespace: string | null, name: string): MutationMethod => {
    return (!!namespace && mapMutations(namespace, [name])[name]) || mapMutations([name])[name]
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

function isHINTError(object: any): object is Error {
    return typeof object.error == "string"
        && object.details == undefined || typeof object.details == "string"
}

export function isHINTResponse(object: any): object is Response {
    return object && (typeof object.status == "string")
        && (Array.isArray(object.errors))
        && typeof object.data == "object"
        && object.errors.every((e: any) => isHINTError(e))
}

export const freezer = {

    deepFreeze: (data: any): any => {
        if (Array.isArray(data)) {
            return Object.freeze(data.map(d => freezer.deepFreeze(d)))
        }
        if (data != null && typeof data === "object") {
            for (const prop in data) {
                if (Object.prototype.hasOwnProperty.call(data, prop)) {
                    data[prop] = freezer.deepFreeze(data[prop])
                }
            }
            return Object.freeze(data);
        }
        return data;
    }
};

export function prefixNamespace(namespace: string, name: any) {
    return `${namespace}/${name}`
}

export function stripNamespace(name: string) {
    const nameArray = name.split("/");
    if (nameArray.length == 1) {
        return ["root", name];
    } else {
        return nameArray;
    }
}

const flattenToIdArray = (filterOption: NestedFilterOption): string[] => {
    let result: string[] = [];
    result.push(filterOption.id);
    if (filterOption.children) {
        filterOption.children.forEach(o =>
            result = [
                ...result,
                ...flattenToIdArray(o as NestedFilterOption)
            ]);

    }
    return result;
};

export const flattenToIdSet = (ids: string[], lookup: Dict<NestedFilterOption>): Set<string> => {
    let result: string[] = [];
    ids.forEach(r =>
        result = [
            ...result,
            ...flattenToIdArray(lookup[r])
        ]);
    return new Set(result);
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
    if (filterOption.children) {
        filterOption.children.forEach(o =>
            result = {
                ...result,
                ...flattenOption(o as NestedFilterOption)
            });

    }
    return result;
};

export const rootOptionChildren = (filterOptions: FilterOption[]) => {
    const rootOption = filterOptions[0];
    return (rootOption && (rootOption as any).children) || [];
};

export const formatDateTime = (isoUTCString: string) => {
    return moment.utc(isoUTCString).local().format('DD/MM/YYYY HH:mm:ss');
};

export const findResource = (datasetWithResources: any, resourceType: string): DatasetResource | null => {
    const metadata = datasetWithResources.resources.find((r: any) => r.resource_type == resourceType);
    return metadata ? {url: metadata.url, revisionId: metadata.revision_id, outOfDate: false} : null
}

const emailRegex = RegExp("^([\\w+-.%]+@[\\w.-]+\\.[A-Za-z]{2,4})(,[\\w+-.%]+@[\\w.-]+\\.[A-Za-z]{2,4})*$")

export const validateEmail = (test: string): boolean => {
    return emailRegex.test(test.replace(/\s*/g,""))
}

export const versionLabel = (version: Version) => `v${version.versionNumber}`;

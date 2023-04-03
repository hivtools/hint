import {
    ComputedGetter,
    MethodOptions,
    ComponentOptionsWithoutProps,
    ComponentOptionsWithObjectProps,
    defineComponent,
    PropType,
} from "vue";

type COVue3<T> = {
    [K in keyof T]: ComputedGetter<T[K]>
};

type MOVue3<T> = T & MethodOptions;

type POVue3<P> = {
    [K in keyof P]-?: {
        type: PropType<P[K]>,
        required: undefined extends P[K] ? false : true,
        default?: P[K]
    }
}

export function defineComponentProxyWithoutProps<D, M, C>(options: ComponentOptionsWithoutProps<{}, {}, D, COVue3<C>, MOVue3<M>>) {
    return defineComponent<{}, {}, D, COVue3<C>, MOVue3<M>>(options)
}

export function defineComponentProxyWithProps<D, M, C, P>(options: ComponentOptionsWithObjectProps<POVue3<P>, {}, D, COVue3<C>, MOVue3<M>>) {
    return defineComponent<POVue3<P>, {}, D, COVue3<C>, MOVue3<M>>(options)
}

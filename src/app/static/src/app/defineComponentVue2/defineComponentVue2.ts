import {
    ComputedGetter,
    MethodOptions,
    ComponentOptionsWithoutProps,
    ComponentOptionsWithObjectProps,
    defineComponent,
    PropType,
    ComponentOptionsMixin,
    ComputedOptions,
} from "vue";

type COVue3<T> = {
    [K in keyof T]: ComputedGetter<T[K]>
};

type MOVue3<T> = T & MethodOptions;

type POVue3<P> = {
    [K in keyof P]-?: {
        type: PropType<P[K]>,
        required: undefined extends P[K] ? false : true,
        default?: undefined extends P[K] ? P[K] : undefined
    }
}

export function defineComponentVue2<D, M, C, E extends ComponentOptionsMixin = ComponentOptionsMixin>(options: ComponentOptionsWithoutProps<unknown, unknown, D, COVue3<C>, MOVue3<M>, ComponentOptionsMixin, E>) {
    return defineComponent<unknown, unknown, D, COVue3<C>, MOVue3<M>, ComponentOptionsMixin, E>(options as any)
}

export function defineComponentVue2GetSet<D, M, C extends ComputedOptions, E extends ComponentOptionsMixin = ComponentOptionsMixin>(options: ComponentOptionsWithoutProps<unknown, unknown, D, C, MOVue3<M>, ComponentOptionsMixin, E>) {
    return defineComponent<unknown, unknown, D, C, MOVue3<M>, ComponentOptionsMixin, E>(options as any)
}

export function defineComponentVue2GetSetWithProps<D, M, C extends ComputedOptions, P>(options: ComponentOptionsWithObjectProps<POVue3<P>, unknown, D, C, MOVue3<M>>) {
    return defineComponent<POVue3<P>, unknown, D, C, MOVue3<M>>(options as any)
}

export function defineComponentVue2WithProps<D, M, C, P>(options: ComponentOptionsWithObjectProps<POVue3<P>, unknown, D, COVue3<C>, MOVue3<M>>) {
    return defineComponent<POVue3<P>, unknown, D, COVue3<C>, MOVue3<M>>(options as any)
}

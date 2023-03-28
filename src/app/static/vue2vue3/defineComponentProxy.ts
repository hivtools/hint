// don't worry about all these imports, mainly just copied and pasted many
// of them since I needed to modify the component option types a little bit
import {
    ComputedGetter,
    MethodOptions,
    ComponentOptionsWithoutProps,
    ComputedOptions,
    ComponentOptionsMixin,
    EmitsOptions,
    ComponentInjectOptions,
    DefineComponent,
    defineComponent,
    ExtractDefaultPropTypes,
    CreateComponentPublicInstance,
    ComponentOptionsBase,
    ObjectEmitsOptions,
    Prop
} from "vue";

// copied and pasted from vue because they annoyingly don't
// export this type
type EmitsToProps<T extends EmitsOptions> = T extends string[] ? {
    [K in string & `on${Capitalize<T[number]>}`]?: (...args: any[]) => any;
} : T extends ObjectEmitsOptions ? {
    [K in string & `on${Capitalize<string & keyof T>}`]?: K extends `on${infer C}` ? T[Uncapitalize<C>] extends null ? (...args: any[]) => any : (...args: T[Uncapitalize<C>] extends (...args: infer P) => any ? P : never) => any : never;
} : {};


// only allow components with option props or no props at all
type Options = ComponentOptionsWithObjectProps<any, any, any, any, any, any, any, any, any, any, any> |
ComponentOptionsWithoutProps<any, any, any, any, any, any, any, any, any, any, any>

// needed for ComponentObjectPropOptions default state
// NOT to be confused with Data prop which is called D
// (this was just what Vue called this)
type Data = Record<string, unknown>;

// the type of computed field changed from Computed to
// ComputedOptions which now requires all the Computed types
// to be wrapped in ComputedGetter (essentially they are now
// types of functions returning a particular type)
type ComputedOptionsVue3<T> = {
    [K in keyof T]: ComputedGetter<T[K]>
};

// Methods now need to extend MethodOptions for the
// component options types, otherwise you get a 
// string index signature required error
type MethodOptionsVue3<T> = T & MethodOptions;

// this is the type of the props object so when you type something like
// props: {
//     prop1: Object,
//     prop2: {
//         type: String,
//         default: "hey",
//         required: true
//     }
// }
// unfortunately however typescript could read prop2's type in the
// example above but for some reason did not allow prop1's type above
// so I have had to add all the types that define component accepts
// (everything onwards from Function (inclusive))
type ComponentObjectPropsOptions<P> = {
    [K in keyof P]: Prop<P[K]> | null |
    Function | String | Number | Boolean | Array<any> | Object | Date | Symbol;
};

// this is the type of the conponent options with object props (the
// object you put inside of defineComponent function) most of this is
// copied and pasted from vue however there are a couple changes:
// 1. ComponentObjectPropsOptions is not the vue type, it is the type
//    I have defined above that also accept primitive type constructors
//    like Function, String, etc.
// 2. BaseProps type does not exist in vue - I added that in. Typescript
//    was struggling to extract the prop types from the primitive constructors
//    and prop objects but since our Props type that we passed into Vue.extend
//    already had these I just pass them into this component to bypass the
//    ExtractPropType function that vue was using.
type ComponentOptionsWithObjectProps<
    PropsOptions = ComponentObjectPropsOptions<Data>,
    RawBindings = {},
    D = {},
    C extends ComputedOptions = {},
    M extends MethodOptions = {},
    Mixin extends ComponentOptionsMixin = ComponentOptionsMixin,
    Extends extends ComponentOptionsMixin = ComponentOptionsMixin,
    E extends EmitsOptions = EmitsOptions,
    EE extends string = string,
    I extends ComponentInjectOptions = {},
    II extends string = string,
    BaseProps = {},
    Props = BaseProps & EmitsToProps<E>,
    Defaults = ExtractDefaultPropTypes<PropsOptions>> = ComponentOptionsBase<Props, RawBindings, D, C, M, Mixin, Extends, E, EE, Defaults, I, II> & {
    props: PropsOptions & ThisType<void>;
} & ThisType<CreateComponentPublicInstance<Props, RawBindings, D, C, M, Mixin, Extends, E, Props, Defaults, false, I>>;

// two overloads of defineComponentVue2 that either let the component have
// props or no props at all. These are also mainly copied and pasted with
// a couple changes:
// 1. I reordered the D, M, C, Props type inputs (D is Data, C is Computed,
//    M is Methods)
// 2. M, C and Props extended interfaces called MethodOptions, ComputedOptions
//    and PropOptions respectively however I have removed this requirement
//    and I just take the types that we initially put into Vue.extend in
//    Vue 2. Then I apply ComputedOptionsVue3 and MethodOptionsVue3 types
//    to C and M respectively to get them into ComputedOptions form and
//    MethodOptions form and insert into the ComponentOptions types
// 3. For the ComponentOptionsWithObjectProps type I had to put the custom
//    defined ComponentObjectPropsOption type around Props to get it into
//    the correct form
export function defineComponentVue2<
    D,
    M,
    C,
    Props = {},
    RawBindings = {},
    Mixin extends ComponentOptionsMixin = ComponentOptionsMixin,
    Extends extends ComponentOptionsMixin = ComponentOptionsMixin,
    E extends EmitsOptions = {},
    EE extends string = string,
    I extends ComponentInjectOptions = {},
    II extends string = string>(
        options: ComponentOptionsWithoutProps<Props, RawBindings, D, ComputedOptionsVue3<C>, MethodOptionsVue3<M>, Mixin, Extends, E, EE, I, II>
    ): DefineComponent<Props, RawBindings, D, ComputedOptionsVue3<C>, MethodOptionsVue3<M>, Mixin, Extends, E, EE>

export function defineComponentVue2<
    D,
    M,
    C,
    Props,
    RawBindings = {},
    Mixin extends ComponentOptionsMixin = ComponentOptionsMixin,
    Extends extends ComponentOptionsMixin = ComponentOptionsMixin,
    E extends EmitsOptions = {},
    EE extends string = string,
    I extends ComponentInjectOptions = {},
    II extends string = string>(
        options: ComponentOptionsWithObjectProps<ComponentObjectPropsOptions<Props>, RawBindings, D, ComputedOptionsVue3<C>, MethodOptionsVue3<M>, Mixin, Extends, E, EE, I, II, Props>
    ): DefineComponent<Props, RawBindings, D, ComputedOptionsVue3<C>, MethodOptionsVue3<M>, Mixin, Extends, E, EE>;

// lastly this function just returns defineComponent from Vue and the
// Options type makes sure that we can only enter component options that
// are associated with components that have props object in them or
// components that don't have any props at all
// This is needed as defineComponent has 4 overloads (the other two are
// component options involving setup() which are part of composition API
// and ones with array props field, both of which will not be available
// through defineComponentVue2)
export function defineComponentVue2(options: Options) {
    return defineComponent(options)
}

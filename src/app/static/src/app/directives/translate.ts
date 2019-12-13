import i18next from "i18next";
import {Store} from "vuex";
import {TranslatableState} from "../root";
import {DirectiveOptions} from "vue";
import {Language} from "../store/translations/locales";
import {DirectiveBinding} from "vue/types/options";

export default <S extends TranslatableState>(store: Store<S>): DirectiveOptions => {

    function _bind(el: HTMLElement, binding: DirectiveBinding,) {
        const ele = el as any;
        ele.__lang_unwatch__ = ele.__lang_unwatch__ || {};

        const translateText = (lng: Language) => {
            const attribute = binding.arg;
            if (!binding.value) return;
            if (attribute) {
                el.setAttribute(attribute, i18next.t(binding.value, {lng}));
            } else {
                el.innerText = i18next.t(binding.value, {lng});
            }
        };

        translateText(store.state.language);

        if (binding.arg) {
            ele.__lang_unwatch__[binding.arg] = store.watch(state => state.language, lng => {
                translateText(lng)
            })
        } else {
            ele.__lang_unwatch__["innerText"] = store.watch(state => state.language, lng => {
                translateText(lng)
            })
        }
    }

    return {
        bind(el, binding) {
            _bind && _bind(el, binding)
        },
        update(el, binding) {
            const ele = el as any;
            if (binding.arg) {
                ele.__lang_unwatch__[binding.arg]()
            } else {
                ele.__lang_unwatch__["innerText"]()
            }

            _bind(el, binding);
        },
        unbind(el, binding) {
            const ele = el as any;
            if (binding.arg) {
                ele.__lang_unwatch__[binding.arg]()
            } else {
                ele.__lang_unwatch__["innerText"]()
            }
        }
    }
}

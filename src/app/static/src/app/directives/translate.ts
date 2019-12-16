import i18next from "i18next";
import {Store} from "vuex";
import {TranslatableState} from "../root";
import {DirectiveOptions, VNode} from "vue";
import {Language} from "../store/translations/locales";
import {DirectiveBinding} from "vue/types/options";

export default <S extends TranslatableState>(store: Store<S>): DirectiveOptions => {

    function _validateBinding(binding: DirectiveBinding, vnode: VNode): boolean {
        if (!binding.value) {
            console.warn("v-translate directive declared without a value", {tag: vnode.tag, data: vnode.data});
            return false;
        }
        return true;
    }

    function _translateText(lng: Language, el: HTMLElement, binding: DirectiveBinding) {
        const attribute = binding.arg;
        if (attribute) {
            el.setAttribute(attribute, i18next.t(binding.value, {lng}));
        } else {
            el.innerHTML = i18next.t(binding.value, {lng});
        }
    }

    function _addWatcher(el: HTMLElement, binding: DirectiveBinding) {
        const ele = el as any;
        ele.__lang_unwatch__ = ele.__lang_unwatch__ || {};
        if (binding.arg) {
            // this is an attribute binding
            ele.__lang_unwatch__[binding.arg] = store.watch(state => state.language, lng => {
                _translateText(lng, el, binding);
            })
        } else {
            // this is a default, i.e. innerHTML, binding
            ele.__lang_unwatch__["innerHTML"] = store.watch(state => state.language, lng => {
                _translateText(lng, el, binding);
            })
        }
    }

    function _removeWatcher(el: HTMLElement, binding: DirectiveBinding) {
        const ele = el as any;

        if (binding.arg) {
            // this is an attribute binding
            ele.__lang_unwatch__[binding.arg]()
        } else {
            // this is a default, i.e. innerHTML, binding
            ele.__lang_unwatch__["innerHTML"]()
        }
    }

    return {
        bind(el, binding, vnode: VNode) {
            if (!_validateBinding(binding, vnode)) return;
            _translateText(store.state.language, el, binding);
            _addWatcher(el, binding);
        },
        update(el, binding, vnode) {
            if (!_validateBinding(binding, vnode)) return;

            // first remove the existing watcher for this directive instance
            // since it has the previous value of the binding cached
            _removeWatcher(el, binding);

            // now re-add them with the new binding properties
            _translateText(store.state.language, el, binding);
            _addWatcher(el, binding);
        },
        unbind(el, binding) {
            _removeWatcher(el, binding);
        }
    }
}

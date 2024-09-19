import {useStore} from "vuex";
import {computed, onBeforeMount, onMounted} from "vue";

export const useADR = () => {
    const store = useStore();

    const isGuest = computed<boolean>(() => {
        return store.getters["isGuest"]
    });
    const ssoLogin = computed<boolean>(() => {
        return store.state.adr.ssoLogin
    });
    const key = computed<string | null>(() => {
        return store.state.adr.key
    });

    onBeforeMount(() => {
        if (!isGuest.value && !ssoLogin.value) {
            store.dispatch("adr/fetchKey").then();
        }
    });

    onMounted(() => {
        if (!isGuest.value) {
            store.dispatch("adr/ssoLoginMethod").then();
        }
    });

    return {
        isGuest,
        ssoLogin,
        key
    }
}

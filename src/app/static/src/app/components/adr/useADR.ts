import {useStore} from "vuex";
import {computed, onBeforeMount, onMounted} from "vue";

export const useADR = () => {
    const store = useStore();

    const isGuest = computed<boolean>(() => {
        console.log("getting is guest")
        return store.getters["isGuest"]
    });
    const ssoLogin = computed<boolean>(() => {
        console.log("getting ssoLogin", store.state.adr.ssoLogin)
        return store.state.adr.ssoLogin
    });
    const key = computed<string | null>(() => {
        console.log("gettin key", store.state.adr.key)
        return store.state.adr.key
    });

    onBeforeMount(() => {
        if (!isGuest.value) {
            if (!ssoLogin.value) {
                store.dispatch("adr/fetchKey").then();
            }
        }
    })

    onMounted(() => {
        if (!isGuest.value) {
            store.dispatch("adr/ssoLoginMethod").then();
        }
    })

    return {
        isGuest,
        ssoLogin,
        key
    }
}

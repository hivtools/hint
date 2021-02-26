<template>
    <div class="row mb-2">
        <div class="col-8">
            <div class="d-flex">
                <label for="key"
                       class="font-weight-bold align-self-stretch"
                       v-translate="'adrKey'">
                </label>
                <div class="align-self-stretch pl-2">
                    <div v-if="!editing">
                        <span class="pr-2">{{ keyText }}</span>
                        <span v-if="!key">
                           <a href="#"
                              @click="add"
                              v-translate="'add'"></a>
                              <span>/</span>
                            <a :href="'https://adr.unaids.org/me/'"
                               target="_blank"
                               v-translate="'getAccessKey'"
                               v-tooltip="tooltipContent"></a>
                        </span>
                        <span v-if="key">
                            <a href="#"
                               @click="remove"
                               v-translate="'remove'"></a>
                         </span>
                    </div>
                    <div class="input-group"
                         style="margin-top: -8px; min-width: 390px"
                         v-if="editing">
                        <input id="key"
                               ref="keyInput"
                               class="form-control"
                               v-model="editableKey"
                               type="text"
                               v-translate:placeholder="'enterKey'"/>
                        <div class="input-group-append">
                            <button class="btn btn-red"
                                    type="button"
                                    v-translate="'save'"
                                    :disabled="!editableKey"
                                    @click="save">
                            </button>
                        </div>
                    </div>
                </div>
                <div class="align-self-stretch pl-2">
                    <a href="#"
                       v-if="editing"
                       @click="cancel"
                       v-translate.lowercase="'cancel'"></a>
                </div>
            </div>
            <error-alert v-if="error" :error="error"></error-alert>
        </div>
    </div>
</template>
<script lang="ts">
    import Vue from "vue";
    import {mapActionsByNames, mapStateProp} from "../../utils";
    import {Error} from "../../generated"
    import {RootState} from "../../root";
    import {Language} from "../../store/translations/locales";
    import i18next from "i18next";
    import ErrorAlert from "../ErrorAlert.vue";
    import {VTooltip} from 'v-tooltip'
    import {ADRState} from "../../store/adr/adr";

    interface Data {
        editableKey: string | null
        editing: boolean
    }

    interface Methods {
        saveKey: (key: string | null) => void
        deleteKey: () => void
        add: (e: Event) => void
        remove: (e: Event) => void
        save: (e: Event) => void
        cancel: (e: Event) => void
    }

    interface Computed {
        key: string | null
        currentLanguage: Language
        keyText: string
        error: Error | null
        tooltipContent: string
    }

    const namespace = "adr";

    export default Vue.extend<Data, Methods, Computed, unknown>({
        data() {
            return {
                editableKey: "",
                editing: false
            }
        },
        computed: {
            key: mapStateProp<ADRState, string | null>(namespace,
                (state: ADRState) => state.key),
            currentLanguage: mapStateProp<RootState, Language>(null,
                (state: RootState) => state.language),
            error: mapStateProp<ADRState, Error | null>(namespace,
                (state: ADRState) => state.keyError),
            keyText() {
                if (this.key) {
                    let str = ""
                    let count = this.key.length
                    while (count) {
                        str += "*";
                        count--;
                    }
                    return str;
                } else {
                    return i18next.t("noneProvided", {lng: this.currentLanguage})
                }
            },
            tooltipContent() {
                return i18next.t("adrTooltip", {lng: this.currentLanguage})
            }
        },
        methods: {
            ...mapActionsByNames<keyof Methods>(namespace, ["saveKey", "deleteKey"]),
            add(e: Event) {
                e.preventDefault();
                this.editing = true;
                this.editableKey = this.key;
                this.$nextTick(() => {
                    (this.$refs["keyInput"] as HTMLInputElement).focus();
                })
            },
            remove(e: Event) {
                this.deleteKey();
                e.preventDefault();
            },
            save(e: Event) {
                e.preventDefault();
                this.saveKey(this.editableKey);
                this.editing = false;
            },
            cancel(e: Event) {
                e.preventDefault();
                this.editing = false;
            }
        },
        components: {ErrorAlert},
        directives: {"tooltip": VTooltip}
    });

</script>

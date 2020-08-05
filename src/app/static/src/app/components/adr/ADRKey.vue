<template>
    <div v-if="loggedIn" class="mb-5">
        <div class="row">
            <div class="col-8">
                <div class="d-flex">
                    <label for="key"
                           class="font-weight-bold align-self-stretch"
                           v-translate="'adrKey'">
                    </label>
                    <div class="align-self-stretch pl-2">
                        <div v-if="!editing">
                            <span class="pr-2">{{keyText}}</span>
                            <a href="#" v-if="!key"
                               @click="edit"
                               v-translate="'add'"></a>
                            <a href="#" v-if="key"
                               @click="edit"
                               v-translate="'edit'"> </a>
                            <span v-if="key">/</span>
                            <a href="#"
                               v-if="key"
                               @click="remove"
                               v-translate="'remove'"></a>
                        </div>
                        <div class="input-group"
                             style="margin-top: -11px; min-width: 390px"
                             v-if="editing">
                            <input id="key"
                                   ref="keyInput"
                                   class="form-control"
                                   v-model="editableKey"
                                   type="text"
                                   placeholder="Enter key"/>
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
                           v-translate="'cancel'"></a>
                    </div>
                </div>
                <error-alert v-if="error" :error="error"></error-alert>
            </div>
        </div>
        <select-dataset v-if="key"></select-dataset>
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
    import SelectDataset from "./SelectDataset.vue";

    interface Data {
        editableKey: string | null
        editing: boolean
    }

    interface Methods {
        fetchADRKey: () => void
        saveADRKey: (key: string | null) => void
        deleteADRKey: () => void
        edit: (e: Event) => void
        remove: (e: Event) => void
        save: (e: Event) => void
        cancel: (e: Event) => void
    }

    interface Computed {
        key: string | null
        currentLanguage: Language
        keyText: string
        loggedIn: boolean,
        error: Error | null
    }

    declare const currentUser: string;

    export default Vue.extend<Data, Methods, Computed, {}>({
        data() {
            return {
                editableKey: "",
                editing: false
            }
        },
        computed: {
            loggedIn() {
                return currentUser != "guest"
            },
            key: mapStateProp<RootState, string | null>(null,
                (state: RootState) => state.adrKey),
            currentLanguage: mapStateProp<RootState, Language>(null,
                (state: RootState) => state.language),
            error: mapStateProp<RootState, Error | null>(null,
                (state: RootState) => state.adrKeyError),
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
                    return i18next.t("noneProvided", this.currentLanguage)
                }
            }
        },
        methods: {
            ...mapActionsByNames<keyof Methods>(null, ["fetchADRKey", "saveADRKey", "deleteADRKey"]),
            edit(e: Event) {
                e.preventDefault();
                this.editing = true;
                this.editableKey = this.key;
                this.$nextTick(() => {
                    (this.$refs["keyInput"] as HTMLInputElement).focus();
                })
            },
            remove(e: Event) {
                this.deleteADRKey();
                e.preventDefault();
            },
            save(e: Event) {
                e.preventDefault();
                this.saveADRKey(this.editableKey);
                this.editing = false;
            },
            cancel(e: Event) {
                e.preventDefault();
                this.editing = false;
            }
        },
        created() {
            if (this.loggedIn) {
                this.fetchADRKey();
            }
        },
        components: {ErrorAlert, SelectDataset}
    });

</script>

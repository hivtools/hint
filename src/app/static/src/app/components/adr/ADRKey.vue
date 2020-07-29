<template>
    <div class="row mb-3">
        <div class="col-8">
            <div class="d-flex">
                <label for="key"
                       class="font-weight-bold align-self-stretch">
                    ADR API Key:
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
                    <a href="#"
                       v-if="editing"
                       @click="cancel"
                       v-translate="'cancel'"></a>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
    import Vue from "vue";
    import {mapMutationByName, mapStateProp} from "../../utils";
    import {RootMutation} from "../../store/root/mutations";
    import {RootState} from "../../root";
    import {Language} from "../../store/translations/locales";
    import i18next from "i18next";

    interface Data {
        editableKey: string | null
        editing: boolean
    }

    interface Methods {
        updateADRKey: (key: string | null) => void
        edit: (e: Event) => void
        remove: (e: Event) => void
        save: (e: Event) => void
        cancel: (e: Event) => void
    }

    interface Computed {
        key: string | null
        currentLanguage: Language
        keyText: string
    }

    export default Vue.extend<Data, Methods, Computed, {}>({
        data() {
            return {
                editableKey: "",
                editing: false
            }
        },
        computed: {
            key: mapStateProp<RootState, string | null>(null,
                (state: RootState) => state.adrKey),
            currentLanguage: mapStateProp<RootState, Language>(null,
                (state: RootState) => state.language),
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
            updateADRKey: mapMutationByName(null, RootMutation.UpdateADRKey),
            edit(e: Event) {
                e.preventDefault();
                this.editing = true;
                this.editableKey = this.key;
            },
            remove(e: Event) {
                this.updateADRKey(null);
                e.preventDefault();
            },
            save(e: Event) {
                e.preventDefault();
                this.updateADRKey(this.editableKey);
                this.editing = false;
            },
            cancel(e: Event) {
                e.preventDefault();
                this.editing = false;
            }
        }
    });

</script>

<template>
    <div v-if="loggedIn" class="mb-5">
        <adr-key></adr-key>
        <div v-if="key">
            <select-dataset></select-dataset>
            <div id="adr-capacity">
            <span class="font-weight-bold align-self-stretch"
                  v-translate="'capacityAccessLevel'">
           </span>
                <span v-tooltip="handleUploadPermission(hasUploadPermission, true)">
                    <a href="#">{{ handleUploadPermission(hasUploadPermission, false) }}</a>
                    </span>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
    import Vue from "vue";
    import {mapActionByName, mapStateProp, mapGetterByName} from "../../utils";
    import adrKey from "./ADRKey.vue";
    import SelectDataset from "./SelectDataset.vue";
    import {ADRState} from "../../store/adr/adr";
    import {VTooltip} from "v-tooltip";
    import i18next from "i18next";
    import {RootState} from "../../root";
    import {Language} from "../../store/translations/locales";

    interface Methods {
        getDatasets: () => void
        fetchADRKey: () => void
        getUserCanUpload: () => void
        handleUploadPermission: (isADRWriter: boolean, isTooltip: boolean) => string | null
        getTranslation: (key: string) => string
    }

    interface Computed {
        isGuest: boolean
        loggedIn: boolean
        key: string | null,
        hasUploadPermission: boolean,
        currentLanguage: Language
    }

    const namespace = "adr";

    export default Vue.extend<unknown, Methods, Computed, unknown>({
        components: {adrKey, SelectDataset},
        computed: {
            isGuest: mapGetterByName(null, "isGuest"),
            loggedIn() {
                return !this.isGuest
            },
            key: mapStateProp<ADRState, string | null>(namespace,
                (state: ADRState) => state.key),

            hasUploadPermission: mapStateProp<ADRState, boolean>(namespace,
                (state: ADRState) => state.userCanUpload),

            currentLanguage: mapStateProp<RootState, Language>(
                null,
                (state: RootState) => state.language
            )
        },
        methods: {
            getDatasets: mapActionByName(namespace, 'getDatasets'),
            fetchADRKey: mapActionByName(namespace, "fetchKey"),
            getUserCanUpload: mapActionByName(namespace, 'getUserCanUpload'),
            handleUploadPermission: function (isADRWriter: boolean, isTooltip: boolean) {
                let displayText = null;
                switch (isADRWriter) {
                    case true:
                        if (isTooltip) {
                            displayText = this.getTranslation("capacityAdminTooltip")
                        } else {
                            displayText = this.getTranslation("capacityReadWrite")
                        }
                        break
                    case false:
                        if (isTooltip) {
                            displayText = this.getTranslation("capacityMemberTooltip")
                        } else {
                            displayText = this.getTranslation("capacityRead")
                        }
                }
                return displayText
            },
            getTranslation(key: string) {
                return i18next.t(key, {
                    lng: this.currentLanguage,
                });
            }
        },
        created() {
            if (this.loggedIn) {
                this.fetchADRKey();
            }
        },
        watch: {
            key() {
                this.getDatasets();
                this.getUserCanUpload()
            }
        },
        directives: {
            "tooltip": VTooltip
        }
    })
</script>

<template>
    <div id="selectRelease" v-if="releases.length">
        <div class="pt-1">
            <input
                type="radio"
                id="useData"
                value="useData"
                v-model="choiceADR"
            />
            <label for="useData" v-translate="'useData'" class="pr-1"></label
            ><span class="icon-small" v-tooltip="translate('datasetTooltip')">
                <help-circle-icon></help-circle-icon>
            </span>
            <br />
        </div>
        <div>
            <input
                type="radio"
                id="useRelease"
                value="useRelease"
                v-model="choiceADR"
            />
            <label
                for="useRelease"
                v-translate="'useRelease'"
                class="pr-1"
            ></label
            ><span class="icon-small" v-tooltip="translate('releaseTooltip')">
                <help-circle-icon></help-circle-icon>
            </span>
            <br />
        </div>

        <label
            for="releaseSelector"
            class="font-weight-bold"
            v-translate="'releases'"
        ></label>
        <tree-select
            v-if="selectedDataset"
            id="releaseSelector"
            :multiple="false"
            :searchable="true"
            :options="releaseOptions"
            :placeholder="translate('select')"
            :disabled="!useRelease"
            v-model="newReleaseId"
        >
            <label
                slot="option-label"
                slot-scope="{ node }"
                v-html="node.raw.customLabel"
            >
            </label>
        </tree-select>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import { mapActionByName, mapStateProp } from "../../utils";
    import TreeSelect from "@riophae/vue-treeselect";
    import { ADRState } from "../../store/adr/adr";
    import { HelpCircleIcon } from "vue-feather-icons";
    import { VTooltip } from "v-tooltip";
    import i18next from "i18next";
    import { Language } from "../../store/translations/locales";
    import { RootState } from "../../root";

    interface Data {
        newReleaseId: string | null;
        choiceADR: "useData" | "useRelease";
    }

    interface Methods {
        getReleases: (id: string) => void;
        translate(text: string): string;
    }

    interface Computed {
        releases: any[];
        releaseOptions: any[];
        useRelease: boolean;
        currentLanguage: Language;
    }

    const namespace = "adr";

    export default Vue.extend<Data, Methods, Computed, unknown>({
        components: {
            TreeSelect,
            HelpCircleIcon,
        },
        props: ["selectedDataset"],
        data() {
            return {
                newReleaseId: null,
                choiceADR: "useData",
            };
        },
        computed: {
            releases: mapStateProp<ADRState, any[]>(
                namespace,
                (state: ADRState) => state.releases
            ),
            releaseOptions() {
                return this.releases.map((d) => ({
                    id: d.id,
                    label: d.name,
                    customLabel: `${d.name}
                                                                <div class="text-muted small" style="margin-top:-5px; line-height: 0.8rem">
                                                                    ${d.notes}<br/>
                                                                </div>`,
                }));
            },
            useRelease() {
                return this.choiceADR === "useRelease";
            },
            currentLanguage: mapStateProp<RootState, Language>(
                null,
                (state: RootState) => state.language
            ),
        },
        methods: {
            getReleases: mapActionByName(namespace, "getReleases"),
            translate(text) {
                return i18next.t(text, { lng: this.currentLanguage });
            },
        },
        watch: {
            selectedDataset(id) {
                this.getReleases(id);
            },
        },
        directives: {
            tooltip: VTooltip,
        },
    });
</script>
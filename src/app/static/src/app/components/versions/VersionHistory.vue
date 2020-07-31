<template>
    <div v-if="versions.length > 0">
        <h5 v-translate="'versionHistory'"></h5>
        <div id="headers" class="row font-weight-bold pt-2">
            <div class="col-md-1 header-cell"></div>
            <div class="col-md-3 header-cell" v-translate="'versionName'"></div>
            <div class="col-md-3 header-cell" v-translate="'lastUpdated'"></div>
        </div>
        <hr/>
        <div v-for="v in versions">
            <div :id="`v-${v.id}`"  class="row">
                <div class="col-md-1 version-cell">
                    <button v-b-toggle="`snapshots-${v.id}`" class="btn btn-xs bg-transparent shadow-none">
                        <chevron-right-icon size="20" class="icon when-closed"></chevron-right-icon>
                        <chevron-down-icon size="20" class="icon when-open"></chevron-down-icon>
                    </button>
                </div>
                <div class="col-md-3 version-cell">
                    {{v.name}}
                </div>
                <div class="col-md-3 version-cell">{{format(v.snapshots[0].updated)}}</div>
            </div>
            <b-collapse :id="`snapshots-${v.id}`">
                <div v-for="s in v.snapshots" :id="`s-${s.id}`" class="row font-italic bg-light pb-3">
                    <div class="col-md-4 snapshot-cell"></div>
                    <div class="col-md-3 snapshot-cell">{{format(s.updated)}}</div>
                </div>
            </b-collapse>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Version} from "../../types";
    import {BCollapse} from "bootstrap-vue";
    import { VBToggle } from 'bootstrap-vue';
    import {ChevronDownIcon, ChevronRightIcon} from "vue-feather-icons";
    import {formatDateTime} from "../../utils"

    Vue.directive('b-toggle', VBToggle);

    interface Props {
        versions: Version[];
    }

    interface Methods {
        format: (date: string) => string
    }

    export default Vue.extend<{}, {}, {}, Props>({
       props: {
            versions: {
                type: Array
            }
       },
        methods: {
           format(date: string) {
               return formatDateTime(date);
           }
        },
       components: {
           BCollapse,
           ChevronDownIcon,
           ChevronRightIcon
       }
    });
</script>


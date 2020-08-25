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
            <div :id="`v-${v.id}`"  class="row py-2">
                <div class="col-md-1 version-cell">
                    <button v-b-toggle="`snapshots-${v.id}`" class="btn btn-xs bg-transparent shadow-none py-0">
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
                <div v-for="s in v.snapshots" :id="`s-${s.id}`" class="row font-italic bg-light py-2">
                    <div class="col-md-4 snapshot-cell"></div>
                    <div class="col-md-3 snapshot-cell">{{format(s.updated)}}</div>
                    <div class="col-md-4 snapshot-cell"><a @click="loadSnapshot($event, v.id, s.id)" href="">Load</a></div>
                </div>
            </b-collapse>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {SnapshotIds, Version} from "../../types";
    import {BCollapse} from "bootstrap-vue";
    import { VBToggle } from 'bootstrap-vue';
    import {ChevronDownIcon, ChevronRightIcon} from "vue-feather-icons";
    import {formatDateTime, mapActionByName, mapStateProp} from "../../utils"
    import {LoadState, LoadingState} from "../../store/load/load";

    interface Props {
        versions: Version[];
    }

    interface Methods {
        format: (date: string) => void,
        loadSnapshot: (event: Event, versionId: number, snapshotId: string) => void,
        loadAction: (snapshot: SnapshotIds) => void
    }

    export default Vue.extend<{}, Methods, {}, Props>({
       props: {
            versions: {
                type: Array
            }
       },
       methods: {
           format(date: string) {
               return formatDateTime(date);
           },
           loadSnapshot(event: Event, versionId: number, snapshotId: string) {
                event.preventDefault();
               this.loadAction({versionId, snapshotId});
           },
           loadAction: mapActionByName<SnapshotIds>("versions", "loadSnapshot"),
        },
        computed: {
            loadingState: mapStateProp<LoadState, boolean>("load", state => {
                return state.loadingState === LoadingState.UpdatingState || state.loadingState === LoadingState.SettingFiles;
            }),
        },
        watch: {
           loadingState: function(newVal) {
               if (newVal) {
                   //If loading state has started that means the snapshot contents were successfully fetched and we should
                   //navigate to the home screen
                   //this.$router.push('/');
               }
           }
        },
       components: {
           BCollapse,
           ChevronDownIcon,
           ChevronRightIcon
       },
       directives: {
           'b-toggle': VBToggle
       }
    });
</script>


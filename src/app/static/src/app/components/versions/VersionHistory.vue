<template>
    <div>
        <h5>Version history</h5>
        <div class="row font-weight-bold">
            <div class="col-md-1"></div>
            <div class="col-md-3">Version name</div>
            <div class="col-md-3">Last updated</div>
        </div>
        <hr/>
        <div v-for="v in versions">
            <div  class="row">
                <div class="col-md-1">
                    <button v-b-toggle='"snapshots-"+v.id' class="btn btn-xs bg-transparent shadow-none">
                        <chevron-right-icon size="20" class="icon when-closed"></chevron-right-icon>
                        <chevron-down-icon size="20" class="icon when-open"></chevron-down-icon>
                    </button>
                </div>
                <div class="col-md-3">
                    {{v.name}}
                </div>
                <div class="col-md-3">{{format(v.snapshots[0].updated)}}</div>
            </div>
            <b-collapse :id='"snapshots-"+v.id'>
                <div v-for="s in v.snapshots" class="row font-italic bg-light pb-3">
                    <div class="col-md-4"></div>
                    <div class="col-md-3">{{format(s.updated)}}</div>
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


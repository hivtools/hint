<template>
    <div class="container">
        <div class="row">
            <div class="col-md-3">Version name</div>
            <div class="col-md-3">Last updated</div>
        </div>

        <div v-for="v in versions">
            <div  class="row">
                <div class="col-md-3">
                    <button type="button"  data-toggle="collapse" :data-target='"#snapshots-"+v.id' aria-expanded="false" :aria-controls='"#snapshots-"+v.id'>Expand</button>
                    {{v.name}}
                </div>
                <div class="col-md-3">{{v.snapshots[0].updated}}</div>
            </div>
            <div :id='"snapshots-"+v.id' class="row collapse">
                <tr v-for="s in v.snapshots">
                    <td class="col-md-3"></td>
                    <td class="col-md-3">{{s.updated}}</td>
                </tr>
            </div>
        </div>
        <!--<tr>
            <td>
                <div id="accordion" class="collapse">Hidden by default</div>
            </td>
        </tr>-->

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import {Version} from "../../types";

    interface Props {
        versions: Version[];
    }

    export default Vue.extend<{}, {}, {}, Props>({
       props: {
            versions: {
                type: Array
            }
       }
    });
</script>


<template>
    <div class="row mb-3">
        <div class="col-6">
            <div class="d-flex">
                <label for="key"
                       class="font-weight-bold align-self-stretch"
                       >ADR API Key: </label>
                <div class="align-self-stretch pl-3">
                    <div v-if="!editing">
                        <span>{{keyText}}</span>
                        <a href="#" v-if="!key" @click="edit">add</a>
                        <a href="#" v-if="key" @click="edit">edit</a>
                        <span v-if="key">/</span>
                        <a href="#" v-if="key" @click="remove">remove</a>
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
                            <button class="btn btn-red" type="button" @click="save">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
    import Vue from "vue";
    import {mapMutationByName, mapStatePropByName} from "../../utils";
    import {RootMutation} from "../../store/root/mutations";

    export default Vue.extend({
        data() {
            return {
                editableKey: "",
                editing: false
            }
        },
        computed: {
            key: mapStatePropByName<string>(null, "adrKey"),
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
                    return "none provided"
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
            }
        }
    });

</script>

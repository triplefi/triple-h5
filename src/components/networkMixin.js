import { mapState } from 'vuex'
export default {
    computed: {
        ...mapState(['isNetworkError'])
    },
    watch: {
        isNetworkError: {
            handler(v) {
                if (v) {
                    this.$alert('Please connect to Polygon or Matic network.', 'Wrong Network', {
                        confirmButtonText: 'Confirm'
                    })
                }
            },
            immediate: true
        }
    }
}
